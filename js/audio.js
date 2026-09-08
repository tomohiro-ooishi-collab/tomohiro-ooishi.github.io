/**
 * 音声再生を扱うモジュール。
 *
 * 現在の信号モデルは単一正弦波なので、
 * 元信号はその周波数、復元信号は標本列から得られる
 * エイリアス周波数として再生する。
 *
 * 低すぎる音を聞きやすくする場合は「加算オフセット」ではなく、
 * 元音と復元音の両方に同じ 2^n 倍のオクターブ補正をかける。
 * これにより両者の周波数比を保つ。
 */

const TARGET_LOW_FREQUENCY = 140;
const MAX_PLAYBACK_FREQUENCY = 3500;
const OUTPUT_GAIN = 0.045;
const SILENCE_THRESHOLD = 1e-7;

export function createAudioController() {
  let context = null;
  let oscillator = null;
  let gainNode = null;
  let enabled = false;
  let mode = "source";
  let currentParameters = null;

  async function setEnabled(nextEnabled, parameters) {
    enabled = nextEnabled;
    currentParameters = parameters;

    if (!enabled) {
      stopTone();
      return getAudioInfo(parameters);
    }

    ensureAudioGraph();

    if (context.state === "suspended") {
      await context.resume();
    }

    startOrUpdateTone();
    return getAudioInfo(parameters);
  }

  function setMode(nextMode, parameters) {
    mode = nextMode;
    currentParameters = parameters;

    if (enabled) {
      startOrUpdateTone();
    }

    return getAudioInfo(parameters);
  }

  function update(parameters) {
    currentParameters = parameters;

    if (enabled) {
      startOrUpdateTone();
    }

    return getAudioInfo(parameters);
  }

  function stop() {
    enabled = false;
    stopTone();
  }

  function ensureAudioGraph() {
    if (!context) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error("このブラウザは Web Audio API に対応していません。");
      }

      context = new AudioContextClass();

      gainNode = context.createGain();
      gainNode.gain.value = 0;
      gainNode.connect(context.destination);
    }

    if (!oscillator) {
      oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = 440;
      oscillator.connect(gainNode);
      oscillator.start();
    }
  }

  function startOrUpdateTone() {
    ensureAudioGraph();

    const info = getAudioInfo(currentParameters);
    const now = context.currentTime;

    let frequency;

    if (mode === "source") {
      frequency = info.sourcePlaybackFrequency;
    } else {
      frequency = info.reconstructedPlaybackFrequency;
    }

    if (!Number.isFinite(frequency) || frequency <= 0) {
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setTargetAtTime(0, now, 0.015);
      return;
    }

    oscillator.frequency.cancelScheduledValues(now);
    oscillator.frequency.setTargetAtTime(
      frequency,
      now,
      0.01
    );

    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setTargetAtTime(
      OUTPUT_GAIN,
      now,
      0.02
    );
  }

  function stopTone() {
    if (!context || !gainNode) {
      return;
    }

    const now = context.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setTargetAtTime(0, now, 0.015);
  }

  return {
    setEnabled,
    setMode,
    update,
    stop,
  };

  function getAudioInfo(parameters) {
    return calculateAudioInfo(parameters, mode);
  }
}

export function calculateAudioInfo(
  {
    signalFrequency,
    samplingFrequency,
    phase = 0,
  },
  mode = "source"
) {
  const aliasFrequency = getAliasFrequency(
    signalFrequency,
    samplingFrequency
  );

  const sampleRms = estimateSampleRms(
    signalFrequency,
    samplingFrequency,
    phase
  );

  const reconstructedIsSilent =
    aliasFrequency < SILENCE_THRESHOLD ||
    sampleRms < SILENCE_THRESHOLD;

  const audibleFrequencies = [
    signalFrequency,
  ];

  if (!reconstructedIsSilent) {
    audibleFrequencies.push(aliasFrequency);
  }

  const octaveMultiplier =
    chooseCommonOctaveMultiplier(
      audibleFrequencies
    );

  const sourcePlaybackFrequency =
    signalFrequency * octaveMultiplier;

  const reconstructedPlaybackFrequency =
    reconstructedIsSilent
      ? 0
      : aliasFrequency * octaveMultiplier;

  let note = "";

  if (octaveMultiplier > 1) {
    note =
      `聞き取りやすさのため、元音と復元音の両方を同じ倍率（×${octaveMultiplier}）で高く再生しています。`;
  } else {
    note =
      "音程補正なしで再生しています。";
  }

  if (
    mode === "reconstructed" &&
    reconstructedIsSilent
  ) {
    note +=
      " 現在の標本値から得られる復元音は、ほぼ直流または振幅0のため無音です。";
  }

  return {
    aliasFrequency,
    reconstructedIsSilent,
    octaveMultiplier,
    sourcePlaybackFrequency,
    reconstructedPlaybackFrequency,
    note,
  };
}

function getAliasFrequency(
  signalFrequency,
  samplingFrequency
) {
  const remainder =
    ((signalFrequency % samplingFrequency) +
      samplingFrequency) %
    samplingFrequency;

  return remainder <= samplingFrequency / 2
    ? remainder
    : samplingFrequency - remainder;
}

function estimateSampleRms(
  signalFrequency,
  samplingFrequency,
  phase
) {
  const count = 64;
  let sumSquares = 0;

  for (let n = 0; n < count; n++) {
    const value = Math.sin(
      2 *
        Math.PI *
        signalFrequency *
        (n / samplingFrequency) +
        phase
    );

    sumSquares += value * value;
  }

  return Math.sqrt(sumSquares / count);
}

function chooseCommonOctaveMultiplier(
  frequencies
) {
  const positive = frequencies.filter(
    (frequency) =>
      Number.isFinite(frequency) &&
      frequency > SILENCE_THRESHOLD
  );

  if (positive.length === 0) {
    return 1;
  }

  const minFrequency = Math.min(...positive);
  const maxFrequency = Math.max(...positive);

  let desiredPower = 0;

  while (
    minFrequency * 2 ** desiredPower <
    TARGET_LOW_FREQUENCY
  ) {
    desiredPower++;
  }

  let maximumPower = 0;

  while (
    maxFrequency * 2 ** (maximumPower + 1) <=
    MAX_PLAYBACK_FREQUENCY
  ) {
    maximumPower++;
  }

  const selectedPower = Math.min(
    desiredPower,
    maximumPower
  );

  return 2 ** selectedPower;
}
