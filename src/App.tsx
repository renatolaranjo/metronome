import { useState } from 'react'
import './App.css'
import {
  NOTE_VALUES,
  VALID_DENOMINATORS,
  normalizePreset,
} from './music/rhythm'
import type {
  MetronomePreset,
  NoteValue,
  StoredMetronomePreset,
  TickState,
} from './types/metronome'
import { useMetronome } from './hooks/useMetronome'

const tickStateLabels: Record<TickState, string> = {
  accent: 'Accent',
  normal: 'Normal',
  mute: 'Mute',
}

const tickStateSymbols: Record<TickState, string> = {
  accent: 'A',
  normal: 'N',
  mute: 'X',
}

function App() {
  const {
    bpm,
    isPlaying,
    timeSignature,
    beatUnit,
    beatsPerMeasure,
    subdivisions,
    subdivisionPattern,
    currentBeat,
    currentSubdivision,
    currentMeasure,

    progressiveEnabled,
    increaseBy,
    increaseEveryMeasures,
    maxBpm,

    trainingEnabled,
    audibleMeasures,
    silentMeasures,

    increaseBpm,
    decreaseBpm,
    changeBpm,
    changeTimeSignatureNumerator,
    changeTimeSignatureDenominator,
    changeBeatUnit,
    changeBeatsPerMeasure,
    changeSubdivisions,
    changeSubdivisionPattern,
    toggleSubdivisionTick,
    toggleMetronome,

    setProgressiveEnabled,
    setIncreaseBy,
    setIncreaseEveryMeasures,
    setMaxBpm,

    setTrainingEnabled,
    setAudibleMeasures,
    setSilentMeasures,

    tapTempo,
  } = useMetronome()

  const [presets, setPresets] = useState<MetronomePreset[]>(() => {
    const savedPresets = localStorage.getItem('metronome-presets')

    if (!savedPresets) {
      return []
    }

    return (JSON.parse(savedPresets) as StoredMetronomePreset[]).map(
      normalizePreset,
    )
  })
  const [presetName, setPresetName] = useState('')
  const [selectedPresetId, setSelectedPresetId] = useState<string>('')

  function applyPreset(preset: MetronomePreset) {
    changeBpm(preset.bpm)
    changeTimeSignatureNumerator(preset.timeSignature.numerator)
    changeTimeSignatureDenominator(preset.timeSignature.denominator)
    changeBeatUnit(preset.beatUnit)
    changeSubdivisions(preset.subdivisions)
    changeSubdivisionPattern(preset.subdivisionPattern)
    setProgressiveEnabled(preset.progressiveEnabled)
    setIncreaseBy(preset.increaseBy)
    setIncreaseEveryMeasures(preset.increaseEveryMeasures)
    setMaxBpm(preset.maxBpm)
    setTrainingEnabled(preset.trainingEnabled)
    setAudibleMeasures(preset.audibleMeasures)
    setSilentMeasures(preset.silentMeasures)
  }

  function createPreset(name: string): MetronomePreset {
    return {
      id: crypto.randomUUID(),
      name,
      bpm,
      timeSignature,
      beatUnit,
      subdivisions,
      subdivisionPattern,
      progressiveEnabled,
      increaseBy,
      increaseEveryMeasures,
      maxBpm,
      trainingEnabled,
      audibleMeasures,
      silentMeasures,
    }
  }

  function savePreset() {
    const name = presetName.trim()

    if (!name) {
      return
    }

    const updatedPresets = [...presets, createPreset(name)]

    setPresets(updatedPresets)

    localStorage.setItem(
      'metronome-presets',
      JSON.stringify(updatedPresets),
    )

    setPresetName('')
  }

  function updatePreset() {
    if (!selectedPresetId) {
      return
    }

    const updatedPresets = presets.map((preset) => {
      if (preset.id !== selectedPresetId) {
        return preset
      }

      return {
        ...createPreset(presetName.trim() || preset.name),
        id: preset.id,
      }
    })

    setPresets(updatedPresets)

    localStorage.setItem(
      'metronome-presets',
      JSON.stringify(updatedPresets),
    )
  }

  function deletePreset() {
    if (!selectedPresetId) {
      return
    }

    const updatedPresets = presets.filter(
      (preset) => preset.id !== selectedPresetId,
    )

    setPresets(updatedPresets)

    localStorage.setItem(
      'metronome-presets',
      JSON.stringify(updatedPresets),
    )

    setSelectedPresetId('')
    setPresetName('')
  }

  function selectPreset(id: string) {
    setSelectedPresetId(id)

    const preset = presets.find((item) => item.id === id)

    if (preset) {
      applyPreset(preset)
      setPresetName(preset.name)
    }
  }

  return (
    <main className="app-shell">
      <section className={`metronome-panel ${isPlaying ? 'is-playing' : ''}`}>
        <header className="panel-header">
          <div>
            <p className="eyebrow">Studio tool</p>
            <h1>Metronome</h1>
          </div>

          <label className="preset-picker">
            <span className="sr-only">Preset</span>
            <select
              aria-label="Preset"
              value={selectedPresetId}
              onChange={(event) => selectPreset(event.target.value)}
            >
              <option value="">Select preset</option>

              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
        </header>

        <div className="tempo-stage">
          <p className="measure-counter">
            Measure <span>{currentMeasure}</span>
          </p>

          <h2 className="tempo-readout" aria-label={`${bpm} BPM`}>
            <span className="tempo-number">{bpm}</span>
            <span className="tempo-label">BPM</span>
          </h2>

          <div className="transport-controls" aria-label="Tempo controls">
            <button
              className="round-control"
              type="button"
              onClick={decreaseBpm}
              title="Decrease BPM"
            >
              -
            </button>

            <button
              className={`play-control ${isPlaying ? 'stop' : ''}`}
              type="button"
              onClick={toggleMetronome}
            >
              <span className="play-symbol" aria-hidden="true">
                {isPlaying ? 'STOP' : 'PLAY'}
              </span>
              {isPlaying ? 'Stop' : 'Start'}
            </button>

            <button
              className="round-control"
              type="button"
              onClick={increaseBpm}
              title="Increase BPM"
            >
              +
            </button>
          </div>

          <div className="beat-indicator" aria-label="Beat indicator">
            {Array.from({ length: beatsPerMeasure }, (_, index) => (
              <div
                key={index}
                className={`beat ${index === 0 ? 'beat-accent' : ''} ${
                  currentBeat === index ? 'beat-active' : ''
                }`}
              >
                <span className="beat-dot" aria-hidden="true" />
                <span className="beat-number">{index + 1}</span>
              </div>
            ))}
          </div>

          <div className="meter-controls">
            <label>
              <span>Numerator</span>
              <input
                aria-label="Time signature numerator"
                type="number"
                min={1}
                max={64}
                value={timeSignature.numerator}
                onChange={(event) =>
                  changeBeatsPerMeasure(Number(event.target.value))
                }
              />
            </label>

            <label>
              <span>Denominator</span>
              <select
                aria-label="Time signature denominator"
                value={timeSignature.denominator}
                onChange={(event) =>
                  changeTimeSignatureDenominator(Number(event.target.value))
                }
              >
                {VALID_DENOMINATORS.map((denominator) => (
                  <option key={denominator} value={denominator}>
                    {denominator}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Beat Unit</span>
              <select
                aria-label="Beat unit"
                value={beatUnit}
                onChange={(event) =>
                  changeBeatUnit(event.target.value as NoteValue)
                }
              >
                {NOTE_VALUES.map((noteValue) => (
                  <option key={noteValue.value} value={noteValue.value}>
                    {noteValue.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Subdivision</span>
              <select
                aria-label="Subdivision"
                value={subdivisions}
                onChange={(event) =>
                  changeSubdivisions(Number(event.target.value))
                }
              >
                {Array.from({ length: 8 }, (_, index) => index + 1).map(
                  (value) => (
                    <option key={value} value={value}>
                      {value === 3 ? '3 - Triplet' : value}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>

          <div className="pattern-editor">
            <div className="pattern-header">
              <span>Subdivision Pattern</span>
              <strong>
                {timeSignature.numerator}/{timeSignature.denominator}
              </strong>
            </div>

            <div className="pattern-buttons">
              {subdivisionPattern.map((tickState, index) => (
                <button
                  key={index}
                  className={`pattern-button ${tickState} ${
                    currentSubdivision === index ? 'is-current' : ''
                  }`}
                  type="button"
                  onClick={() => toggleSubdivisionTick(index)}
                  aria-label={`Subdivision ${index + 1}: ${tickStateLabels[tickState]}`}
                >
                  <span className="pattern-index">{index + 1}</span>
                  <span className="pattern-symbol" aria-hidden="true">
                    {tickStateSymbols[tickState]}
                  </span>
                  <span className="pattern-state">
                    {tickStateLabels[tickState]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button className="tap-control" type="button" onClick={tapTempo}>
            Tap Tempo
          </button>
        </div>

        <div className="advanced-panels">
          <details className="settings-panel">
            <summary>
              <span>Progressive Tempo</span>
              <strong>{progressiveEnabled ? 'On' : 'Off'}</strong>
            </summary>

            <div className="settings-content">
              <label className="toggle-row">
                <span>Enable</span>
                <input
                  type="checkbox"
                  checked={progressiveEnabled}
                  onChange={(event) =>
                    setProgressiveEnabled(event.target.checked)
                  }
                />
              </label>

              <label className="field-row">
                <span>Increase by</span>
                <div className="number-with-unit">
                  <input
                    type="number"
                    value={increaseBy}
                    min={1}
                    onChange={(event) =>
                      setIncreaseBy(Number(event.target.value))
                    }
                  />
                  <span>BPM</span>
                </div>
              </label>

              <label className="field-row">
                <span>Every</span>
                <div className="number-with-unit">
                  <input
                    type="number"
                    value={increaseEveryMeasures}
                    min={1}
                    onChange={(event) =>
                      setIncreaseEveryMeasures(Number(event.target.value))
                    }
                  />
                  <span>measures</span>
                </div>
              </label>

              <label className="field-row">
                <span>Maximum BPM</span>
                <input
                  type="number"
                  value={maxBpm}
                  onChange={(event) =>
                    setMaxBpm(Number(event.target.value))
                  }
                />
              </label>
            </div>
          </details>

          <details className="settings-panel">
            <summary>
              <span>Training Mode</span>
              <strong>{trainingEnabled ? 'On' : 'Off'}</strong>
            </summary>

            <div className="settings-content">
              <label className="toggle-row">
                <span>Enable</span>
                <input
                  type="checkbox"
                  checked={trainingEnabled}
                  onChange={(event) =>
                    setTrainingEnabled(event.target.checked)
                  }
                />
              </label>

              <label className="field-row">
                <span>Audible measures</span>
                <input
                  type="number"
                  min={1}
                  value={audibleMeasures}
                  onChange={(event) =>
                    setAudibleMeasures(Number(event.target.value))
                  }
                />
              </label>

              <label className="field-row">
                <span>Silent measures</span>
                <input
                  type="number"
                  min={1}
                  value={silentMeasures}
                  onChange={(event) =>
                    setSilentMeasures(Number(event.target.value))
                  }
                />
              </label>
            </div>
          </details>

          <details className="settings-panel presets-panel" open>
            <summary>
              <span>Presets</span>
              <strong>{presets.length}</strong>
            </summary>

            <div className="settings-content preset-content">
              <label className="preset-name-field">
                <span>Name</span>
                <input
                  type="text"
                  placeholder="Preset name"
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                />
              </label>

              <div className="preset-actions">
                <button
                  className="primary-action"
                  type="button"
                  onClick={savePreset}
                >
                  Save preset
                </button>

                <button
                  className="secondary-action"
                  type="button"
                  onClick={updatePreset}
                  disabled={!selectedPresetId}
                >
                  Update preset
                </button>

                <button
                  className="danger-action"
                  type="button"
                  onClick={deletePreset}
                  disabled={!selectedPresetId}
                >
                  Delete preset
                </button>
              </div>
            </div>
          </details>
        </div>
      </section>
    </main>
  )
}

export default App
