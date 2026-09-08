/**
 * 画面上の操作部品を作成・管理するモジュール。
 */

export function buildUI(root, initialState) {
  if (!root) {
    throw new Error("UIを配置するroot要素が見つかりません。");
  }

  root.innerHTML = `
    <header class="page-header">
      <p class="eyebrow">Sampling theorem explorer</p>
      <h1>シャノン標本化シミュレータ</h1>
      <p class="lead">
        元信号の周波数と標本化周波数を変えて、
        標本点と復元波形の変化を観察してください。
      </p>
    </header>

    <section class="control-panel" aria-label="シミュレータ設定">
      <div class="control-grid">
        <div class="control-block">
          <div class="control-label-row">
            <label for="signal-frequency">元信号周波数</label>
            <output id="signal-frequency-value" for="signal-frequency"></output>
          </div>
          <input
            id="signal-frequency"
            type="range"
            min="100"
            max="1000"
            step="10"
          >
          <div class="range-hints" aria-hidden="true">
            <span>100 Hz</span>
            <span>1000 Hz</span>
          </div>
        </div>

        <div class="control-block">
          <div class="control-label-row">
            <label for="sampling-frequency">標本化周波数</label>
            <output id="sampling-frequency-value" for="sampling-frequency"></output>
          </div>
          <input
            id="sampling-frequency"
            type="range"
            min="100"
            max="4000"
            step="10"
          >
          <div class="range-hints" aria-hidden="true">
            <span>100 Hz</span>
            <span>4000 Hz</span>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <button id="reset-button" class="reset-button" type="button">
          初期値に戻す
        </button>
        <p id="status" class="status" role="status"></p>
      </div>
    </section>

    <section class="graph-card">
      <div class="graph-heading">
        <div>
          <p class="graph-number">01</p>
          <h2>元信号と標本点</h2>
        </div>
        <p>連続した元信号から、どの点が取り出されているかを観察します。</p>
      </div>

      <div class="canvas-wrap">
        <canvas
          id="sampling-canvas"
          width="900"
          height="280"
          aria-label="元信号と標本点のグラフ"
        ></canvas>
      </div>
    </section>

    <section class="graph-card">
      <div class="graph-heading">
        <div>
          <p class="graph-number">02</p>
          <h2>元信号と復元信号</h2>
        </div>
        <p>標本値から理想的な sinc 補間で復元した波形を比較します。</p>
      </div>

      <div class="canvas-wrap">
        <canvas
          id="reconstruction-canvas"
          width="900"
          height="280"
          aria-label="元信号と復元信号のグラフ"
        ></canvas>
      </div>

      <div class="audio-actions" aria-label="音声比較">
        <div class="audio-buttons">
          <button
            id="play-source-button"
            class="audio-button source-audio-button"
            type="button"
          >
            原音を聞く
          </button>

          <button
            id="play-reconstructed-button"
            class="audio-button reconstructed-audio-button"
            type="button"
          >
            復元音を聞く
          </button>
        </div>

        <p id="audio-note" class="audio-note"></p>
      </div>
    </section>
  `;

  const elements = {
    signalFrequency: root.querySelector("#signal-frequency"),
    signalFrequencyValue: root.querySelector("#signal-frequency-value"),
    samplingFrequency: root.querySelector("#sampling-frequency"),
    samplingFrequencyValue: root.querySelector("#sampling-frequency-value"),

    resetButton: root.querySelector("#reset-button"),
    samplingCanvas: root.querySelector("#sampling-canvas"),
    reconstructionCanvas: root.querySelector("#reconstruction-canvas"),

    playSourceButton: root.querySelector("#play-source-button"),
    playReconstructedButton: root.querySelector("#play-reconstructed-button"),
    audioNote: root.querySelector("#audio-note"),

    status: root.querySelector("#status"),
  };

  syncUI(elements, initialState);

  return elements;
}

export function bindUI(
  elements,
  {
    onSignalFrequencyChange,
    onSamplingFrequencyChange,
    onPlaySource,
    onPlayReconstructed,
    onReset,
  }
) {
  elements.signalFrequency.addEventListener("input", (event) => {
    onSignalFrequencyChange(Number(event.target.value));
  });

  elements.samplingFrequency.addEventListener("input", (event) => {
    onSamplingFrequencyChange(Number(event.target.value));
  });

  elements.playSourceButton.addEventListener("click", () => {
    onPlaySource();
  });

  elements.playReconstructedButton.addEventListener("click", () => {
    onPlayReconstructed();
  });

  elements.resetButton.addEventListener("click", () => {
    onReset();
  });
}

export function syncUI(elements, currentState) {
  elements.signalFrequency.value = currentState.signalFrequency;
  elements.signalFrequencyValue.textContent =
    `${currentState.signalFrequency} Hz`;

  elements.samplingFrequency.value = currentState.samplingFrequency;
  elements.samplingFrequencyValue.textContent =
    `${currentState.samplingFrequency} Hz`;
}

export function setStatus(elements, message) {
  elements.status.textContent = message;
}

export function setAudioNote(elements, message) {
  elements.audioNote.textContent = message;
}
