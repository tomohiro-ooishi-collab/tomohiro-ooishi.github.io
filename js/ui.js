/**
 * 画面上の操作部品を作成・管理するモジュール。
 *
 * CSSはStep 4で分離して整える予定なので、
 * 現段階では機能確認に必要な最小限のインライン指定だけを使う。
 */

export function buildUI(root, initialState) {
  if (!root) {
    throw new Error("UIを配置するroot要素が見つかりません。");
  }

  root.innerHTML = `
    <h1>シャノン標本化シミュレータ</h1>

    <p>
      元信号の周波数と標本化周波数を変えて、
      標本点と復元波形の変化を観察してください。
    </p>

    <section>
      <div>
        <label for="signal-frequency">
          元信号周波数：
          <strong><span id="signal-frequency-value"></span> Hz</strong>
        </label>
        <br>
        <input
          id="signal-frequency"
          type="range"
          min="100"
          max="1000"
          step="10"
        >
      </div>

      <br>

      <div>
        <label for="sampling-frequency">
          標本化周波数：
          <strong><span id="sampling-frequency-value"></span> Hz</strong>
        </label>
        <br>
        <input
          id="sampling-frequency"
          type="range"
          min="100"
          max="4000"
          step="10"
        >
      </div>

      <br>

      <button id="reset-button" type="button">初期値に戻す</button>
    </section>

    <hr>

    <section>
      <h2>元信号と標本点</h2>
      <canvas
        id="sampling-canvas"
        width="900"
        height="280"
        aria-label="元信号と標本点のグラフ"
      ></canvas>
    </section>

    <section>
      <h2>元信号と復元信号</h2>
      <canvas
        id="reconstruction-canvas"
        width="900"
        height="280"
        aria-label="元信号と復元信号のグラフ"
      ></canvas>
    </section>

    <p id="status" role="status"></p>
  `;

  const elements = {
    signalFrequency: root.querySelector("#signal-frequency"),
    signalFrequencyValue: root.querySelector("#signal-frequency-value"),
    samplingFrequency: root.querySelector("#sampling-frequency"),
    samplingFrequencyValue: root.querySelector("#sampling-frequency-value"),
    resetButton: root.querySelector("#reset-button"),
    samplingCanvas: root.querySelector("#sampling-canvas"),
    reconstructionCanvas: root.querySelector("#reconstruction-canvas"),
    status: root.querySelector("#status"),
  };

  // Step 4でCSSへ移す予定の、最低限の表示上の指定。
  for (const canvas of [
    elements.samplingCanvas,
    elements.reconstructionCanvas,
  ]) {
    canvas.style.width = "100%";
    canvas.style.maxWidth = "900px";
    canvas.style.height = "280px";
    canvas.style.border = "1px solid #ccc";
    canvas.style.display = "block";
  }

  elements.signalFrequency.style.width = "min(700px, 90vw)";
  elements.samplingFrequency.style.width = "min(700px, 90vw)";

  syncUI(elements, initialState);

  return elements;
}

export function bindUI(
  elements,
  {
    onSignalFrequencyChange,
    onSamplingFrequencyChange,
    onReset,
  }
) {
  elements.signalFrequency.addEventListener("input", (event) => {
    onSignalFrequencyChange(Number(event.target.value));
  });

  elements.samplingFrequency.addEventListener("input", (event) => {
    onSamplingFrequencyChange(Number(event.target.value));
  });

  elements.resetButton.addEventListener("click", () => {
    onReset();
  });
}

export function syncUI(elements, currentState) {
  elements.signalFrequency.value = currentState.signalFrequency;
  elements.signalFrequencyValue.textContent = currentState.signalFrequency;

  elements.samplingFrequency.value = currentState.samplingFrequency;
  elements.samplingFrequencyValue.textContent = currentState.samplingFrequency;
}

export function setStatus(elements, message) {
  elements.status.textContent = message;
}
