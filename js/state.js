/**
 * シミュレータの現在状態を管理するモジュール。
 *
 * 「標本化定理を満たしているか」のような答えは保持しない。
 * あくまで、ユーザーが操作するパラメータだけを管理する。
 */

const defaults = {
  signalFrequency: 440,    // Hz
  samplingFrequency: 1200, // Hz
  amplitude: 1,
  phase: 0,

  // 表示・計算用の固定パラメータ
  displayStart: 0,
  displayEnd: 0.02,        // 20 ms
  pointCount: 801,
  samplePadding: 0.05,     // sinc復元の端部誤差を減らすため前後にも標本を取る
};

export const state = { ...defaults };

export function updateState(partialState) {
  for (const [key, value] of Object.entries(partialState)) {
    if (!(key in state)) {
      throw new Error(`未知の状態項目です: ${key}`);
    }

    if (!Number.isFinite(value)) {
      throw new Error(`${key} は有限値にしてください。`);
    }

    state[key] = value;
  }

  validateState();
}

export function resetState() {
  Object.assign(state, defaults);
}

function validateState() {
  if (state.signalFrequency <= 0) {
    throw new Error("signalFrequency は 0 より大きくしてください。");
  }

  if (state.samplingFrequency <= 0) {
    throw new Error("samplingFrequency は 0 より大きくしてください。");
  }

  if (state.amplitude < 0) {
    throw new Error("amplitude は 0 以上にしてください。");
  }

  if (state.displayEnd <= state.displayStart) {
    throw new Error("displayEnd は displayStart より大きくしてください。");
  }

  if (!Number.isInteger(state.pointCount) || state.pointCount < 2) {
    throw new Error("pointCount は 2 以上の整数にしてください。");
  }

  if (state.samplePadding < 0) {
    throw new Error("samplePadding は 0 以上にしてください。");
  }
}
