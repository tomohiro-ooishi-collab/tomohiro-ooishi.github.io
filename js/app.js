import {
  createSineSignal,
  generateSignal,
} from "./signal.js";

import {
  sampleSignal,
} from "./sampling.js";

import {
  reconstructSignal,
} from "./reconstruction.js";

import {
  state,
  updateState,
  resetState,
} from "./state.js";

import {
  buildUI,
  bindUI,
  syncUI,
  setStatus,
  setAudioNote,
} from "./ui.js";

import {
  renderSampling,
  renderReconstruction,
} from "./renderer.js";

import {
  createAudioController,
  calculateAudioInfo,
} from "./audio.js";

const root = document.querySelector("#app");
const ui = buildUI(root, state);
const audio = createAudioController();

bindUI(ui, {
  onSignalFrequencyChange(value) {
    audio.stop();

    updateState({
      signalFrequency: value,
    });

    syncUI(ui, state);
    scheduleUpdate();
  },

  onSamplingFrequencyChange(value) {
    audio.stop();

    updateState({
      samplingFrequency: value,
    });

    syncUI(ui, state);
    scheduleUpdate();
  },

  async onPlaySource() {
    try {
      const info = await audio.play(
        "source",
        getAudioParameters()
      );

      setAudioNote(ui, info.note);
    } catch (error) {
      console.error(error);
      setAudioNote(
        ui,
        `音声を再生できませんでした: ${error.message}`
      );
    }
  },

  async onPlayReconstructed() {
    try {
      const info = await audio.play(
        "reconstructed",
        getAudioParameters()
      );

      setAudioNote(ui, info.note);
    } catch (error) {
      console.error(error);
      setAudioNote(
        ui,
        `音声を再生できませんでした: ${error.message}`
      );
    }
  },

  onReset() {
    audio.stop();
    resetState();
    syncUI(ui, state);
    scheduleUpdate();
  },
});

let updateScheduled = false;

function scheduleUpdate() {
  if (updateScheduled) {
    return;
  }

  updateScheduled = true;

  requestAnimationFrame(() => {
    updateScheduled = false;
    updateSimulation();
  });
}

function updateSimulation() {
  try {
    const signal = createSineSignal({
      frequency: state.signalFrequency,
      amplitude: state.amplitude,
      phase: state.phase,
    });

    const sourceWave = generateSignal(
      signal,
      {
        startTime: state.displayStart,
        endTime: state.displayEnd,
        pointCount: state.pointCount,
      }
    );

    const samples = sampleSignal(
      signal,
      {
        samplingFrequency:
          state.samplingFrequency,
        startTime:
          state.displayStart -
          state.samplePadding,
        endTime:
          state.displayEnd +
          state.samplePadding,
      }
    );

    const reconstructedWave =
      reconstructSignal(
        samples,
        {
          samplingFrequency:
            state.samplingFrequency,
          startTime:
            state.displayStart,
          endTime:
            state.displayEnd,
          pointCount:
            state.pointCount,
        }
      );

    const visibleSamples =
      filterSamples(
        samples,
        state.displayStart,
        state.displayEnd
      );

    renderSampling(
      ui.samplingCanvas,
      {
        sourceWave,
        samples: visibleSamples,
        startTime: state.displayStart,
        endTime: state.displayEnd,
      }
    );

    renderReconstruction(
      ui.reconstructionCanvas,
      {
        sourceWave,
        reconstructedWave,
        startTime: state.displayStart,
        endTime: state.displayEnd,
      }
    );

    const audioInfo = calculateAudioInfo(
      getAudioParameters(),
      "source"
    );

    setAudioNote(ui, audioInfo.note);

    setStatus(
      ui,
      `元信号 ${state.signalFrequency} Hz ／ 標本化周波数 ${state.samplingFrequency} Hz`
    );
  } catch (error) {
    console.error(error);

    setStatus(
      ui,
      `エラー: ${error.message}`
    );
  }
}

function getAudioParameters() {
  return {
    signalFrequency: state.signalFrequency,
    samplingFrequency: state.samplingFrequency,
    phase: state.phase,
  };
}

function filterSamples(
  samples,
  startTime,
  endTime
) {
  const times = [];
  const values = [];

  for (let i = 0; i < samples.times.length; i++) {
    const t = samples.times[i];

    if (t >= startTime && t <= endTime) {
      times.push(t);
      values.push(samples.values[i]);
    }
  }

  return { times, values };
}

console.log(
  "Shannon sampling simulator audio-button version loaded."
);

updateSimulation();
