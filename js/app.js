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

import {
  state,
  updateState,
  resetState,
} from "./state.js";

import {
  buildUI,
  bindUI,
  syncUI,
  setStatus,
} from "./ui.js";

import {
  renderSampling,
  renderReconstruction,
} from "./renderer.js";

/**
 * シミュレータ全体の司令塔。
 *
 * 状態
 *   ↓
 * 元信号生成
 *   ↓
 * 標本化
 *   ↓
 * sinc復元
 *   ↓
 * 描画
 */

const root = document.querySelector("#app");
const ui = buildUI(root, state);

bindUI(ui, {
  onSignalFrequencyChange(value) {
    updateState({
      signalFrequency: value,
    });

    ui.signalFrequencyValue.textContent =
      value;

    scheduleUpdate();
  },

  onSamplingFrequencyChange(value) {
    updateState({
      samplingFrequency: value,
    });

    ui.samplingFrequencyValue.textContent =
      value;

    scheduleUpdate();
  },

  onReset() {
    resetState();
    syncUI(ui, state);
    scheduleUpdate();
  },
});

// スライダーを連続して動かしても、
// 1フレームに何度も重いsinc計算をしないようにする。
let updateScheduled = false;

function scheduleUpdate() {
  if (updateScheduled) {
    return;
  }

  updateScheduled = true;

  requestAnimationFrame(() => {
    updateScheduled = false;
    updateSimulation();
  });
}

function updateSimulation() {
  try {
    const signal = createSineSignal({
      frequency: state.signalFrequency,
      amplitude: state.amplitude,
      phase: state.phase,
    });

    const sourceWave = generateSignal(
      signal,
      {
        startTime: state.displayStart,
        endTime: state.displayEnd,
        pointCount: state.pointCount,
      }
    );

    // sinc補間は本来無限個の標本を用いる。
    // 表示区間の前後にも標本を作り、有限和による端部誤差を抑える。
    const samples = sampleSignal(
      signal,
      {
        samplingFrequency:
          state.samplingFrequency,
        startTime:
          state.displayStart -
          state.samplePadding,
        endTime:
          state.displayEnd +
          state.samplePadding,
      }
    );

    const reconstructedWave =
      reconstructSignal(
        samples,
        {
          samplingFrequency:
            state.samplingFrequency,
          startTime:
            state.displayStart,
          endTime:
            state.displayEnd,
          pointCount:
            state.pointCount,
        }
      );

    const visibleSamples =
      filterSamples(
        samples,
        state.displayStart,
        state.displayEnd
      );

    renderSampling(
      ui.samplingCanvas,
      {
        sourceWave,
        samples: visibleSamples,
        startTime: state.displayStart,
        endTime: state.displayEnd,
      }
    );

    renderReconstruction(
      ui.reconstructionCanvas,
      {
        sourceWave,
        reconstructedWave,
        startTime: state.displayStart,
        endTime: state.displayEnd,
      }
    );

    setStatus(
      ui,
      `元信号 ${state.signalFrequency} Hz ／ 標本化周波数 ${state.samplingFrequency} Hz`
    );
  } catch (error) {
    console.error(error);
    setStatus(
      ui,
      `エラー: ${error.message}`
    );
  }
}

function filterSamples(
  samples,
  startTime,
  endTime
) {
  const times = [];
  const values = [];

  for (let i = 0; i < samples.times.length; i++) {
    const t = samples.times[i];

    if (t >= startTime && t <= endTime) {
      times.push(t);
      values.push(samples.values[i]);
    }
  }

  return { times, values };
}

console.log(
  "Shannon sampling simulator interactive version loaded."
);

updateSimulation();
