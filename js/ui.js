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

      <div class="audio-panel">
        <div class="audio-heading">
          <div>
            <h2>音で比較</h2>
            <p>音をオンにすると、元信号と復元信号を切り替えて聞けます。</p>
          </div>

          <label class="switch">
            <input id="audio-enabled" type="checkbox">
            <span class="switch-track" aria-hidden="true"></span>
            <span class="switch-label">音</span>
          </label>
        </div>

        <fieldset id="audio-mode-fieldset" class="segmented-control">
          <legend class="visually-hidden">再生する音</legend>

          <label>
            <input
              type="radio"
              name="audio-mode"
              value="source"
              checked
            >
            <span>元信号</span>
          </label>

          <label>
            <input
              type="radio"
              name="audio-mode"
              value="reconstructed"
            >
            <span>復元信号</span>
          </label>
        </fieldset>

        <p id="audio-note" class="audio-note"></p>
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
    </section>
  `;

  const elements = {
    signalFrequency: root.querySelector("#signal-frequency"),
    signalFrequencyValue: root.querySelector("#signal-frequency-value"),
    samplingFrequency: root.querySelector("#sampling-frequency"),
    samplingFrequencyValue: root.querySelector("#sampling-frequency-value"),

    audioEnabled: root.querySelector("#audio-enabled"),
    audioModeFieldset: root.querySelector("#audio-mode-fieldset"),
    audioModeInputs: [
      ...root.querySelectorAll('input[name="audio-mode"]'),
    ],
    audioNote: root.querySelector("#audio-note"),

    resetButton: root.querySelector("#reset-button"),
    samplingCanvas: root.querySelector("#sampling-canvas"),
    reconstructionCanvas: root.querySelector("#reconstruction-canvas"),
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
    onAudioEnabledChange,
    onAudioModeChange,
    onReset,
  }
) {
  elements.signalFrequency.addEventListener("input", (event) => {
    onSignalFrequencyChange(Number(event.target.value));
  });

  elements.samplingFrequency.addEventListener("input", (event) => {
    onSamplingFrequencyChange(Number(event.target.value));
  });

  elements.audioEnabled.addEventListener("change", (event) => {
    onAudioEnabledChange(event.target.checked);
  });

  for (const input of elements.audioModeInputs) {
    input.addEventListener("change", (event) => {
      if (event.target.checked) {
        onAudioModeChange(event.target.value);
      }
    });
  }

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

  elements.audioEnabled.checked = currentState.audioEnabled;

  for (const input of elements.audioModeInputs) {
    input.checked = input.value === currentState.audioMode;
    input.disabled = !currentState.audioEnabled;
  }

  elements.audioModeFieldset.classList.toggle(
    "is-disabled",
    !currentState.audioEnabled
  );
}

export function setStatus(elements, message) {
  elements.status.textContent = message;
}

export function setAudioNote(elements, message) {
  elements.audioNote.textContent = message;
}
