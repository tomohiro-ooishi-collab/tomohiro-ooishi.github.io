/**
 * Canvasへ波形を描画するモジュール。
 *
 * 計算は行わず、渡された波形データを描画することだけを担当する。
 */

const COLORS = {
  axis: "#666",
  grid: "#e5e7eb",
  source: "#2563eb",
  samples: "#dc2626",
  reconstructed: "#f59e0b",
  text: "#111827",
  background: "#ffffff",
};

const PADDING = {
  left: 52,
  right: 18,
  top: 30,
  bottom: 36,
};

export function renderSampling(
  canvas,
  {
    sourceWave,
    samples,
    startTime,
    endTime,
  }
) {
  const ctx = prepareCanvas(canvas);

  const yLimit = calculateYLimit([
    sourceWave.values,
    samples.values,
  ]);

  drawBaseGraph(ctx, canvas, {
    startTime,
    endTime,
    yLimit,
  });

  drawWave(ctx, canvas, sourceWave, {
    startTime,
    endTime,
    yLimit,
    color: COLORS.source,
    lineWidth: 2,
  });

  drawSamples(ctx, canvas, samples, {
    startTime,
    endTime,
    yLimit,
  });

  drawLegend(ctx, [
    { label: "元信号", color: COLORS.source, type: "line" },
    { label: "標本点", color: COLORS.samples, type: "point" },
  ]);
}

export function renderReconstruction(
  canvas,
  {
    sourceWave,
    reconstructedWave,
    startTime,
    endTime,
  }
) {
  const ctx = prepareCanvas(canvas);

  const yLimit = calculateYLimit([
    sourceWave.values,
    reconstructedWave.values,
  ]);

  drawBaseGraph(ctx, canvas, {
    startTime,
    endTime,
    yLimit,
  });

  drawWave(ctx, canvas, sourceWave, {
    startTime,
    endTime,
    yLimit,
    color: COLORS.source,
    lineWidth: 2,
  });

  drawWave(ctx, canvas, reconstructedWave, {
    startTime,
    endTime,
    yLimit,
    color: COLORS.reconstructed,
    lineWidth: 2,
  });

  drawLegend(ctx, [
    { label: "元信号", color: COLORS.source, type: "line" },
    { label: "復元信号", color: COLORS.reconstructed, type: "line" },
  ]);
}

function prepareCanvas(canvas) {
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = "13px sans-serif";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  return ctx;
}

function drawBaseGraph(
  ctx,
  canvas,
  {
    startTime,
    endTime,
    yLimit,
  }
) {
  const plot = getPlotArea(canvas);

  // 横方向の補助線
  const yTicks = [-1, -0.5, 0, 0.5, 1];

  for (const normalized of yTicks) {
    const value = normalized * yLimit;
    const y = mapY(value, plot, yLimit);

    ctx.beginPath();
    ctx.strokeStyle =
      normalized === 0 ? COLORS.axis : COLORS.grid;
    ctx.lineWidth =
      normalized === 0 ? 1.2 : 1;
    ctx.moveTo(plot.left, y);
    ctx.lineTo(plot.right, y);
    ctx.stroke();

    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(
      value.toFixed(1),
      plot.left - 8,
      y
    );
  }

  // 時間軸
  const tickCount = 5;

  for (let i = 0; i <= tickCount; i++) {
    const ratio = i / tickCount;
    const time =
      startTime +
      (endTime - startTime) * ratio;
    const x =
      plot.left +
      (plot.right - plot.left) * ratio;

    ctx.beginPath();
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.moveTo(x, plot.top);
    ctx.lineTo(x, plot.bottom);
    ctx.stroke();

    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      `${(time * 1000).toFixed(0)} ms`,
      x,
      plot.bottom + 8
    );
  }
}

function drawWave(
  ctx,
  canvas,
  wave,
  {
    startTime,
    endTime,
    yLimit,
    color,
    lineWidth,
  }
) {
  const plot = getPlotArea(canvas);

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  let started = false;

  for (let i = 0; i < wave.times.length; i++) {
    const t = wave.times[i];

    if (t < startTime || t > endTime) {
      continue;
    }

    const x = mapX(t, plot, startTime, endTime);
    const y = mapY(wave.values[i], plot, yLimit);

    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
}

function drawSamples(
  ctx,
  canvas,
  samples,
  {
    startTime,
    endTime,
    yLimit,
  }
) {
  const plot = getPlotArea(canvas);

  for (let i = 0; i < samples.times.length; i++) {
    const t = samples.times[i];

    if (t < startTime || t > endTime) {
      continue;
    }

    const x = mapX(t, plot, startTime, endTime);
    const y = mapY(samples.values[i], plot, yLimit);
    const zeroY = mapY(0, plot, yLimit);

    // 標本時刻を見やすくするためのステム
    ctx.beginPath();
    ctx.strokeStyle = COLORS.samples;
    ctx.lineWidth = 1;
    ctx.moveTo(x, zeroY);
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = COLORS.samples;
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function drawLegend(ctx, items) {
  let x = PADDING.left;
  const y = 17;

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  for (const item of items) {
    ctx.strokeStyle = item.color;
    ctx.fillStyle = item.color;
    ctx.lineWidth = 3;

    if (item.type === "point") {
      ctx.beginPath();
      ctx.arc(x + 8, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 18, y);
      ctx.stroke();
    }

    ctx.fillStyle = COLORS.text;
    ctx.fillText(item.label, x + 26, y);
    x += 105;
  }
}

function getPlotArea(canvas) {
  return {
    left: PADDING.left,
    right: canvas.width - PADDING.right,
    top: PADDING.top,
    bottom: canvas.height - PADDING.bottom,
  };
}

function mapX(t, plot, startTime, endTime) {
  return (
    plot.left +
    ((t - startTime) / (endTime - startTime)) *
      (plot.right - plot.left)
  );
}

function mapY(value, plot, yLimit) {
  return (
    plot.top +
    ((yLimit - value) / (2 * yLimit)) *
      (plot.bottom - plot.top)
  );
}

function calculateYLimit(valueArrays) {
  let maxAbs = 1;

  for (const values of valueArrays) {
    for (const value of values) {
      maxAbs = Math.max(maxAbs, Math.abs(value));
    }
  }

  return maxAbs * 1.1;
}
