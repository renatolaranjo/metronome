import type {
  MetronomePreset,
  NoteValue,
  StoredMetronomePreset,
  SubdivisionPattern,
  TickState,
  TimeSignature,
} from '../types/metronome'

export const VALID_DENOMINATORS = [1, 2, 4, 8, 16, 32, 64] as const

export const NOTE_VALUES: Array<{
  value: NoteValue
  label: string
  denominator: number
}> = [
  { value: 'whole', label: 'Whole note', denominator: 1 },
  { value: 'half', label: 'Half note', denominator: 2 },
  { value: 'quarter', label: 'Quarter note', denominator: 4 },
  { value: 'eighth', label: 'Eighth note', denominator: 8 },
  { value: 'sixteenth', label: 'Sixteenth note', denominator: 16 },
  { value: 'thirtySecond', label: 'Thirty-second', denominator: 32 },
  { value: 'sixtyFourth', label: 'Sixty-fourth', denominator: 64 },
]

const TICK_STATE_SEQUENCE: TickState[] = ['normal', 'accent', 'mute']

export function createDefaultSubdivisionPattern(
  subdivisions: number,
): SubdivisionPattern {
  return Array.from({ length: subdivisions }, (_, index) =>
    index === 0 ? 'accent' : 'normal',
  )
}

export function resizeSubdivisionPattern(
  pattern: SubdivisionPattern,
  subdivisions: number,
): SubdivisionPattern {
  const defaultPattern = createDefaultSubdivisionPattern(subdivisions)

  return defaultPattern.map((defaultState, index) => {
    const existingState = pattern[index]

    return existingState ?? defaultState
  })
}

export function getNextTickState(state: TickState): TickState {
  const currentIndex = TICK_STATE_SEQUENCE.indexOf(state)
  const nextIndex = (currentIndex + 1) % TICK_STATE_SEQUENCE.length

  return TICK_STATE_SEQUENCE[nextIndex]
}

export function normalizeTimeSignature(
  timeSignature: Partial<TimeSignature> | undefined,
  fallbackNumerator = 4,
): TimeSignature {
  const numerator = clampInteger(timeSignature?.numerator, 1, 64)
  const denominator: number = VALID_DENOMINATORS.includes(
    timeSignature?.denominator as (typeof VALID_DENOMINATORS)[number],
  )
    ? Number(timeSignature?.denominator)
    : 4

  return {
    numerator: numerator ?? fallbackNumerator,
    denominator,
    grouping: timeSignature?.grouping,
  }
}

export function normalizeSubdivisionCount(value: unknown): number {
  return clampInteger(value, 1, 8) ?? 1
}

export function getNoteValueDenominator(noteValue: NoteValue): number {
  return (
    NOTE_VALUES.find((item) => item.value === noteValue)?.denominator ?? 4
  )
}

export function getPulsesPerMeasure(
  timeSignature: TimeSignature,
  beatUnit: NoteValue,
): number {
  const beatUnitDenominator = getNoteValueDenominator(beatUnit)
  const pulses =
    (timeSignature.numerator * beatUnitDenominator) /
    timeSignature.denominator

  return Math.max(1, Math.round(pulses))
}

export function normalizePreset(
  preset: StoredMetronomePreset,
): MetronomePreset {
  const subdivisions = normalizeSubdivisionCount(preset.subdivisions)
  const timeSignature = normalizeTimeSignature(
    preset.timeSignature,
    preset.beatsPerMeasure,
  )

  return {
    id: preset.id,
    name: preset.name,
    bpm: preset.bpm,
    timeSignature,
    beatUnit: preset.beatUnit ?? 'quarter',
    subdivisions,
    subdivisionPattern: resizeSubdivisionPattern(
      preset.subdivisionPattern ?? [],
      subdivisions,
    ),
    progressiveEnabled: preset.progressiveEnabled ?? false,
    increaseBy: preset.increaseBy ?? 2,
    increaseEveryMeasures: preset.increaseEveryMeasures ?? 4,
    maxBpm: preset.maxBpm ?? 120,
    trainingEnabled: preset.trainingEnabled ?? false,
    audibleMeasures: preset.audibleMeasures ?? 4,
    silentMeasures: preset.silentMeasures ?? 2,
  }
}

function clampInteger(
  value: unknown,
  min: number,
  max: number,
): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined
  }

  return Math.min(max, Math.max(min, Math.round(value)))
}
