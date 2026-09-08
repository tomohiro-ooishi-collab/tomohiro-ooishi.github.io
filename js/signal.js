/**
 * 元信号を扱うモジュール。
 * 現段階では正弦波だけを扱う。
 */

export function createSineSignal({
  frequency,
  amplitude = 1,
  phase = 0,
}) {
  if (!Number.isFinite(frequency) || frequency <= 0) {
    throw new Error("frequency は 0 より大きい有限値にしてください。");
  }

  if (!Number.isFinite(amplitude) || amplitude < 0) {
    throw new Error("amplitude は 0 以上の有限値にしてください。");
  }

  if (!Number.isFinite(phase)) {
    throw new Error("phase は有限値にしてください。");
  }

  return function signal(t) {
    return amplitude * Math.sin(2 * Math.PI * frequency * t + phase);
  };
}

export function generateSignal(
  signal,
  {
    startTime,
    endTime,
    pointCount = 2001,
  }
) {
  if (typeof signal !== "function") {
    throw new Error("signal には関数を指定してください。");
  }

  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    endTime <= startTime
  ) {
    throw new Error("endTime は startTime より大きい有限値にしてください。");
  }

  if (!Number.isInteger(pointCount) || pointCount < 2) {
    throw new Error("pointCount は 2 以上の整数にしてください。");
  }

  const times = [];
  const values = [];
  const dt = (endTime - startTime) / (pointCount - 1);

  for (let i = 0; i < pointCount; i++) {
    const t = startTime + i * dt;
    times.push(t);
    values.push(signal(t));
  }

  return { times, values };
}
