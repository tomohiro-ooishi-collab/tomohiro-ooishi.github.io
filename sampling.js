/**
 * 標本化を扱うモジュール。
 */

export function sampleSignal(
  signal,
  {
    samplingFrequency,
    startTime,
    endTime,
  }
) {
  if (typeof signal !== "function") {
    throw new Error("signal には関数を指定してください。");
  }

  if (!Number.isFinite(samplingFrequency) || samplingFrequency <= 0) {
    throw new Error(
      "samplingFrequency は 0 より大きい有限値にしてください。"
    );
  }

  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    endTime < startTime
  ) {
    throw new Error("endTime は startTime 以上の有限値にしてください。");
  }

  const times = [];
  const values = [];
  const epsilon = 1e-12;

  const firstIndex = Math.ceil(
    startTime * samplingFrequency - epsilon
  );
  const lastIndex = Math.floor(
    endTime * samplingFrequency + epsilon
  );

  for (let n = firstIndex; n <= lastIndex; n++) {
    const t = n / samplingFrequency;
    times.push(t);
    values.push(signal(t));
  }

  return { times, values };
}
