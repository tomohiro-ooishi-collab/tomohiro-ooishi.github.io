/**
 * sinc補間による理想復元を扱うモジュール。
 */

export function sinc(x) {
  if (Math.abs(x) < 1e-12) {
    return 1;
  }

  return Math.sin(Math.PI * x) / (Math.PI * x);
}

export function reconstructAtTime(
  t,
  samples,
  samplingFrequency
) {
  if (!Number.isFinite(t)) {
    throw new Error("t は有限値にしてください。");
  }

  validateSamples(samples);

  if (!Number.isFinite(samplingFrequency) || samplingFrequency <= 0) {
    throw new Error(
      "samplingFrequency は 0 より大きい有限値にしてください。"
    );
  }

  let sum = 0;

  for (let i = 0; i < samples.times.length; i++) {
    const sampleTime = samples.times[i];
    const sampleValue = samples.values[i];

    sum +=
      sampleValue *
      sinc(samplingFrequency * (t - sampleTime));
  }

  return sum;
}

export function reconstructSignal(
  samples,
  {
    samplingFrequency,
    startTime,
    endTime,
    pointCount = 2001,
  }
) {
  validateSamples(samples);

  if (!Number.isFinite(samplingFrequency) || samplingFrequency <= 0) {
    throw new Error(
      "samplingFrequency は 0 より大きい有限値にしてください。"
    );
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
    values.push(
      reconstructAtTime(t, samples, samplingFrequency)
    );
  }

  return { times, values };
}

function validateSamples(samples) {
  if (
    !samples ||
    !Array.isArray(samples.times) ||
    !Array.isArray(samples.values) ||
    samples.times.length !== samples.values.length ||
    samples.times.length === 0
  ) {
    throw new Error(
      "samples は同じ長さの times と values を持つ必要があります。"
    );
  }
}
