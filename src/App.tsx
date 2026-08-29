import { useMemo, useState } from 'react'
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
import {
  createSharedPresetUrl,
  getSharedPresetFromUrl,
} from './sharing/sharedPreset'

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

function NoteSymbol({ value }: { value: NoteValue }) {
  const hasStem = value !== 'whole'
  const flags = {
    whole: 0,
    half: 0,
    quarter: 0,
    eighth: 1,
    sixteenth: 2,
    thirtySecond: 3,
    sixtyFourth: 4,
  }[value]
  const isFilled = !['whole', 'half'].includes(value)

  return (
    <svg
      className={`note-symbol note-symbol-${value}`}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse
        className={isFilled ? 'note-head-filled' : undefined}
        cx="12"
        cy="23"
        rx="5.4"
        ry="3.7"
        transform="rotate(-22 12 23)"
      />
      {hasStem && <path className="note-stem" d="M17 21.5V5" />}
      {Array.from({ length: flags }, (_, index) => {
        const y = 5 + index * 4.5

        return (
          <path
            key={index}
            className="note-flag"
            d={`M17 ${y}C25 ${y + 1.2} 26 ${y + 7.2} 20.2 ${y + 9.8}`}
          />
        )
      })}
    </svg>
  )
}

function App() {
  const sharedPresetLoad = useMemo(
    () => getSharedPresetFromUrl(new URL(window.location.href)),
    [],
  )
  const sharedPreset =
    sharedPresetLoad.status === 'loaded' ? sharedPresetLoad.preset : undefined
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
  } = useMetronome(sharedPreset)

  const [presets, setPresets] = useState<MetronomePreset[]>(() => {
    const savedPresets = localStorage.getItem('metronome-presets')

    if (!savedPresets) {
      return []
    }

    return (JSON.parse(savedPresets) as StoredMetronomePreset[]).map(
      normalizePreset,
    )
  })
  const [presetName, setPresetName] = useState(sharedPreset?.name ?? '')
  const [selectedPresetId, setSelectedPresetId] = useState<string>('')
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const hasPresetName = presetName.trim().length > 0
  const hasDuplicatePresetName =
    hasPresetName &&
    presets.some(
      (preset) =>
        preset.id !== selectedPresetId &&
        preset.name.trim().toLocaleLowerCase() ===
          presetName.trim().toLocaleLowerCase(),
    )
  const canSavePreset = hasPresetName && !hasDuplicatePresetName
  const canUpdatePreset = Boolean(selectedPresetId) && !hasDuplicatePresetName

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

  function showShareFeedback(message: string) {
    setShareFeedback(message)
    window.setTimeout(() => setShareFeedback(null), 2400)
  }

  async function shareExercise() {
    const name = presetName.trim()
    const sharedUrl = createSharedPresetUrl(
      createPreset(name),
      window.location.href,
    )

    if (navigator.share) {
      try {
        await navigator.share({
          title: name || 'Metronome exercise',
          text: name ? `Metronome exercise: ${name}` : 'Metronome exercise',
          url: sharedUrl,
        })
        showShareFeedback('Shared')
        return
      } catch (error) {
        if (isAbortError(error)) {
          return
        }
      }
    }

    try {
      await navigator.clipboard.writeText(sharedUrl)
      showShareFeedback('Link copied')
    } catch {
      showShareFeedback('Link could not be copied')
    }
  }

  function savePreset() {
    const name = presetName.trim()

    if (!name) {
      return
    }

    if (
      presets.some(
        (preset) =>
          preset.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    ) {
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

    const name = presetName.trim()

    if (
      name &&
      presets.some(
        (preset) =>
          preset.id !== selectedPresetId &&
          preset.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    ) {
      return
    }

    const updatedPresets = presets.map((preset) => {
      if (preset.id !== selectedPresetId) {
        return preset
      }

      return {
        ...createPreset(name || preset.name),
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

  function isAbortError(error: unknown) {
    return error instanceof DOMException && error.name === 'AbortError'
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

        {sharedPresetLoad.status === 'loaded' && sharedPresetLoad.preset.name && (
          <div className="shared-preset-notice" role="status">
            <span>Shared exercise</span>
            <strong>{sharedPresetLoad.preset.name}</strong>
          </div>
        )}

        {sharedPresetLoad.status === 'invalid' && (
          <div className="shared-preset-notice is-error" role="status">
            This shared preset could not be loaded.
          </div>
        )}

        <div className="tempo-stage">
          <p className={`measure-counter ${isPlaying ? 'is-running' : ''}`}>
            Measure <span key={currentMeasure}>{currentMeasure}</span>
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
              <span
                className={`play-icon ${isPlaying ? 'pause' : 'play'}`}
                aria-hidden="true"
              />
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

          <div className="rhythm-config">
            <div className="rhythm-config-header">
              <span>Tempo Setup</span>
              <strong>
                {timeSignature.numerator}/{timeSignature.denominator}
              </strong>
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

              <div className="beat-unit-field">
                <span className="field-title">Beat Unit</span>
                <div
                  className="note-value-picker"
                  role="radiogroup"
                  aria-label="Beat unit"
                >
                  {NOTE_VALUES.map((noteValue) => (
                    <button
                      key={noteValue.value}
                      className={`note-value-option ${
                        beatUnit === noteValue.value ? 'is-selected' : ''
                      }`}
                      type="button"
                      role="radio"
                      aria-checked={beatUnit === noteValue.value}
                      aria-label={noteValue.label}
                      onClick={() => changeBeatUnit(noteValue.value)}
                    >
                      <div className="note-icon-badge">
                        <NoteSymbol value={noteValue.value} />
                      </div>
                      <div className="note-text-group">
                        <span className="note-fraction">1/{noteValue.denominator}</span>
                        <span className="note-name">{noteValue.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

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
          <details
            className={`settings-panel mode-panel ${
              progressiveEnabled ? 'is-enabled' : 'is-disabled'
            }`}
          >
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

          <details
            className={`settings-panel mode-panel ${
              trainingEnabled ? 'is-enabled' : 'is-disabled'
            }`}
          >
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
                <span className="sr-only">Name</span>
                <input
                  type="text"
                  placeholder="Preset name..."
                  aria-label="Preset name"
                  aria-invalid={hasDuplicatePresetName}
                  aria-describedby={
                    hasDuplicatePresetName ? 'preset-name-error' : undefined
                  }
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                />
              </label>

              {hasDuplicatePresetName && (
                <p
                  className="preset-validation"
                  id="preset-name-error"
                  role="alert"
                >
                  A preset with this name already exists.
                </p>
              )}

              <div className="preset-actions">
                <button
                  className={`primary-action preset-save-action ${
                    canSavePreset ? 'is-ready' : 'is-idle'
                  }`}
                  type="button"
                  onClick={savePreset}
                  disabled={!canSavePreset}
                >
                  Save preset
                </button>

                <button
                  className="secondary-action"
                  type="button"
                  onClick={updatePreset}
                  disabled={!canUpdatePreset}
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

              <div className="share-row">
                <button
                  className="secondary-action share-action"
                  type="button"
                  onClick={shareExercise}
                >
                  Share exercise
                </button>

                {shareFeedback && (
                  <p className="share-feedback" role="status">
                    {shareFeedback}
                  </p>
                )}
              </div>
            </div>
          </details>
        </div>

        <footer className="app-version" aria-label={`Version ${__APP_VERSION__}`}>
          v{__APP_VERSION__}
        </footer>
      </section>
    </main>
  )
}

export default App
