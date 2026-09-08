import {
  createSineSignal,
  generateSignal,
} from "./signal.js";

import {
  sampleSignal,
} from "./sampling.js";

import {
  reconstructSignal,
} from "./reconstruction.js";

/*
 * 数学モデルの動作確認用。
 * UIや描画はまだ行わない。
 */

const SIGNAL_FREQUENCY = 440;
const DISPLAY_START = 0;
const DISPLAY_END = 0.02;
const POINT_COUNT = 201;

// sinc補間は本来、無限個の標本を使う。
// 有限個で計算するため、表示区間の前後にも標本を取る。
const SAMPLE_PADDING = 0.10;

const sourceSignal = createSineSignal({
  frequency: SIGNAL_FREQUENCY,
});

// 1. 元信号の確認
const quarterPeriod =
  1 / (4 * SIGNAL_FREQUENCY);

console.assert(
  Math.abs(sourceSignal(0)) < 1e-12,
  "元信号テスト失敗: t=0 では 0 になるはずです。"
);

console.assert(
  Math.abs(sourceSignal(quarterPeriod) - 1) < 1e-12,
  "元信号テスト失敗: 1/4周期では 1 になるはずです。"
);

// 2. 比較用の元波形
const sourceWave = generateSignal(
  sourceSignal,
  {
    startTime: DISPLAY_START,
    endTime: DISPLAY_END,
    pointCount: POINT_COUNT,
  }
);

// 3. 十分に高い標本化周波数
const HIGH_FS = 2000;

const highSamples = sampleSignal(
  sourceSignal,
  {
    samplingFrequency: HIGH_FS,
    startTime:
      DISPLAY_START - SAMPLE_PADDING,
    endTime:
      DISPLAY_END + SAMPLE_PADDING,
  }
);

const highReconstructed =
  reconstructSignal(
    highSamples,
    {
      samplingFrequency: HIGH_FS,
      startTime: DISPLAY_START,
      endTime: DISPLAY_END,
      pointCount: POINT_COUNT,
    }
  );

const highError = calculateError(
  sourceWave.values,
  highReconstructed.values
);

// 4. 低い標本化周波数
const LOW_FS = 600;

const lowSamples = sampleSignal(
  sourceSignal,
  {
    samplingFrequency: LOW_FS,
    startTime:
      DISPLAY_START - SAMPLE_PADDING,
    endTime:
      DISPLAY_END + SAMPLE_PADDING,
  }
);

const lowReconstructed =
  reconstructSignal(
    lowSamples,
    {
      samplingFrequency: LOW_FS,
      startTime: DISPLAY_START,
      endTime: DISPLAY_END,
      pointCount: POINT_COUNT,
    }
  );

const lowError = calculateError(
  sourceWave.values,
  lowReconstructed.values
);

// 440 Hz を 600 Hz で標本化すると、
// 標本列は -160 Hz の正弦波と一致する。
const expectedAliasedSignal =
  createSineSignal({
    frequency: 160,
    phase: Math.PI,
  });

const expectedAliasedWave =
  generateSignal(
    expectedAliasedSignal,
    {
      startTime: DISPLAY_START,
      endTime: DISPLAY_END,
      pointCount: POINT_COUNT,
    }
  );

const aliasError = calculateError(
  expectedAliasedWave.values,
  lowReconstructed.values
);

// 5. Consoleに結果を表示
console.log(
  "=== シャノン標本化シミュレータ：数学モデル確認 ==="
);

console.table([
  {
    test: "元信号",
    condition: "440 Hz",
    result: "基本値を確認",
  },
  {
    test: "標本化",
    condition: `fs = ${HIGH_FS} Hz`,
    result: `${highSamples.times.length} 点`,
  },
  {
    test: "復元",
    condition:
      `440 Hz / fs = ${HIGH_FS} Hz`,
    result:
      `平均絶対誤差 ${highError.mean.toExponential(3)}`,
  },
  {
    test: "低標本化",
    condition:
      `440 Hz / fs = ${LOW_FS} Hz`,
    result:
      `元信号との平均絶対誤差 ${lowError.mean.toFixed(3)}`,
  },
  {
    test: "エイリアシング",
    condition: "期待される -160 Hz と比較",
    result:
      `平均絶対誤差 ${aliasError.mean.toExponential(3)}`,
  },
]);

console.log(
  "高標本化時の最大絶対誤差:",
  highError.max
);

console.log(
  "低標本化時の元信号との最大絶対誤差:",
  lowError.max
);

console.log(
  "低標本化時の -160 Hz との最大絶対誤差:",
  aliasError.max
);

const status =
  document.querySelector("#app p");

if (status) {
  status.textContent =
    "数学モデル（元信号・標本化・sinc復元）を読み込みました。開発者ツールのConsoleで検証結果を確認できます。";
}

function calculateError(
  expected,
  actual
) {
  if (expected.length !== actual.length) {
    throw new Error(
      "比較する配列の長さが一致していません。"
    );
  }

  let sum = 0;
  let max = 0;

  for (
    let i = 0;
    i < expected.length;
    i++
  ) {
    const error =
      Math.abs(expected[i] - actual[i]);

    sum += error;
    max = Math.max(max, error);
  }

  return {
    mean: sum / expected.length,
    max,
  };
}
