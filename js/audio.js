/**
 * 音声再生を扱うモジュール。
 *
 * 原音・復元音はボタンを押したときだけ、一定時間鳴らす。
 * 比較を壊さないため、低音補正は加算オフセットではなく
 * 両方に共通する 2^n 倍のオクターブ補正を用いる。
 */

const TARGET_LOW_FREQUENCY = 140;
const MAX_PLAYBACK_FREQUENCY = 3500;
const OUTPUT_GAIN = 0.045;
const PLAY_DURATION = 1.5;
const SILENCE_THRESHOLD = 1e-7;

export function createAudioController() {
  let context = null;
  let currentOscillator = null;
  let currentGain = null;

  async function play(mode, parameters) {
    stop();

    ensureContext();

    if (context.state === "suspended") {
      await context.resume();
    }

    const info = calculateAudioInfo(parameters, mode);

    const frequency =
      mode === "source"
        ? info.sourcePlaybackFrequency
        : info.reconstructedPlaybackFrequency;

    if (!Number.isFinite(frequency) || frequency <= 0) {
      return info;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    currentOscillator = oscillator;
    currentGain = gain;

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    const now = context.currentTime;
    const fadeIn = 0.02;
    const fadeOut = 0.06;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(
      OUTPUT_GAIN,
      now + fadeIn
    );
    gain.gain.setValueAtTime(
      OUTPUT_GAIN,
      now + PLAY_DURATION - fadeOut
    );
    gain.gain.linearRampToValueAtTime(
      0,
      now + PLAY_DURATION
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + PLAY_DURATION + 0.02);

    oscillator.addEventListener(
      "ended",
      () => {
        if (currentOscillator === oscillator) {
          currentOscillator = null;
          currentGain = null;
        }
      },
      { once: true }
    );

    return info;
  }

  function stop() {
    if (!context || !currentOscillator) {
      return;
    }

    const oscillator = currentOscillator;
    const gain = currentGain;
    const now = context.currentTime;

    try {
      if (gain) {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setTargetAtTime(0, now, 0.01);
      }

      oscillator.stop(now + 0.04);
    } catch {
      // すでに停止済みの場合は何もしない。
    }

    currentOscillator = null;
    currentGain = null;
  }

  function ensureContext() {
    if (context) {
      return;
    }

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error(
        "このブラウザは Web Audio API に対応していません。"
      );
    }

    context = new AudioContextClass();
  }

  return {
    play,
    stop,
  };
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

  const audibleFrequencies = [signalFrequency];

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
      `聞き取りやすさのため、原音と復元音の両方を同じ倍率（×${octaveMultiplier}）で高く再生します。`;
  } else {
    note = "音程補正なしで再生します。";
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
