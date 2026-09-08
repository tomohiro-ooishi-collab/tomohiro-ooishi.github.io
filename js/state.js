/**
 * シミュレータの現在状態を管理するモジュール。
 */

const defaults = Object.freeze({
  signalFrequency: 440,
  samplingFrequency: 1200,
  amplitude: 1,
  phase: 0,

  audioEnabled: false,
  audioMode: "source",

  displayStart: 0,
  displayEnd: 0.02,
  pointCount: 801,
  samplePadding: 0.05,
});

export const state = { ...defaults };

export function updateState(partialState) {
  const candidate = {
    ...state,
    ...partialState,
  };

  validateState(candidate);
  Object.assign(state, candidate);
}

export function resetState() {
  Object.assign(state, defaults);
}

function validateState(candidate) {
  if (!Number.isFinite(candidate.signalFrequency) || candidate.signalFrequency <= 0) {
    throw new Error("signalFrequency は 0 より大きい有限値にしてください。");
  }

  if (
    !Number.isFinite(candidate.samplingFrequency) ||
    candidate.samplingFrequency <= 0
  ) {
    throw new Error("samplingFrequency は 0 より大きい有限値にしてください。");
  }

  if (!Number.isFinite(candidate.amplitude) || candidate.amplitude < 0) {
    throw new Error("amplitude は 0 以上の有限値にしてください。");
  }

  if (!Number.isFinite(candidate.phase)) {
    throw new Error("phase は有限値にしてください。");
  }

  if (typeof candidate.audioEnabled !== "boolean") {
    throw new Error("audioEnabled は true / false で指定してください。");
  }

  if (!["source", "reconstructed"].includes(candidate.audioMode)) {
    throw new Error("audioMode は source または reconstructed にしてください。");
  }

  if (
    !Number.isFinite(candidate.displayStart) ||
    !Number.isFinite(candidate.displayEnd) ||
    candidate.displayEnd <= candidate.displayStart
  ) {
    throw new Error("displayEnd は displayStart より大きくしてください。");
  }

  if (!Number.isInteger(candidate.pointCount) || candidate.pointCount < 2) {
    throw new Error("pointCount は 2 以上の整数にしてください。");
  }

  if (!Number.isFinite(candidate.samplePadding) || candidate.samplePadding < 0) {
    throw new Error("samplePadding は 0 以上にしてください。");
  }
}
