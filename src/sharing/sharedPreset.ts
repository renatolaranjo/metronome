import {
  NOTE_VALUES,
  VALID_DENOMINATORS,
  createDefaultSubdivisionPattern,
} from '../music/rhythm'
import type {
  MetronomePreset,
  NoteValue,
  SubdivisionPattern,
  TickState,
  TimeSignature,
} from '../types/metronome'

export const SHARED_PRESET_FORMAT_VERSION = 1
export const SHARED_PRESET_QUERY_PARAM = 'p'
export const LEGACY_SHARED_PRESET_QUERY_PARAM = 'preset'

const MAX_ENCODED_PAYLOAD_LENGTH = 4096
const MIN_BPM = 20
const MAX_BPM = 300
const MIN_SUBDIVISIONS = 1
const MAX_SUBDIVISIONS = 8
const MIN_TIME_SIGNATURE_NUMERATOR = 1
const MAX_TIME_SIGNATURE_NUMERATOR = 64

const NOTE_VALUE_SET = new Set<NoteValue>(
  NOTE_VALUES.map((noteValue) => noteValue.value),
)
const DENOMINATOR_SET = new Set<number>(VALID_DENOMINATORS)
const TICK_STATE_SET = new Set<TickState>(['accent', 'normal', 'mute'])

type SharedPresetPayload = {
  version: typeof SHARED_PRESET_FORMAT_VERSION
  preset: SharedPresetData
}

type SharedPresetData = {
  name?: string
  bpm: number
  timeSignature: TimeSignature
  beatUnit: NoteValue
  subdivisions: number
  subdivisionPattern?: SubdivisionPattern
  progressiveEnabled?: boolean
  increaseBy?: number
  increaseEveryMeasures?: number
  maxBpm?: number
  trainingEnabled?: boolean
  audibleMeasures?: number
  silentMeasures?: number
}

export type SharedPresetLoadResult =
  | { status: 'none' }
  | { status: 'loaded'; preset: MetronomePreset }
  | { status: 'invalid' }

export function serializeSharedPreset(preset: MetronomePreset): string {
  const payload: SharedPresetPayload = {
    version: SHARED_PRESET_FORMAT_VERSION,
    preset: {
      name: preset.name,
      bpm: preset.bpm,
      timeSignature: {
        numerator: preset.timeSignature.numerator,
        denominator: preset.timeSignature.denominator,
      },
      beatUnit: preset.beatUnit,
      subdivisions: preset.subdivisions,
      subdivisionPattern: preset.subdivisionPattern,
      progressiveEnabled: preset.progressiveEnabled,
      increaseBy: preset.increaseBy,
      increaseEveryMeasures: preset.increaseEveryMeasures,
      maxBpm: preset.maxBpm,
      trainingEnabled: preset.trainingEnabled,
      audibleMeasures: preset.audibleMeasures,
      silentMeasures: preset.silentMeasures,
    },
  }

  return encodeBase64Url(JSON.stringify(payload))
}

export function deserializeSharedPreset(value: string): MetronomePreset | null {
  if (!value || value.length > MAX_ENCODED_PAYLOAD_LENGTH) {
    return null
  }

  try {
    const payload = JSON.parse(decodeBase64Url(value)) as unknown

    return validateSharedPresetPayload(payload)
  } catch {
    return null
  }
}

export function getSharedPresetFromUrl(url: URL): SharedPresetLoadResult {
  const encodedPreset =
    url.searchParams.get(SHARED_PRESET_QUERY_PARAM) ??
    url.searchParams.get(LEGACY_SHARED_PRESET_QUERY_PARAM)

  if (!encodedPreset) {
    return { status: 'none' }
  }

  const preset = deserializeSharedPreset(encodedPreset)

  if (!preset) {
    return { status: 'invalid' }
  }

  return { status: 'loaded', preset }
}

export function createSharedPresetUrl(
  preset: MetronomePreset,
  currentUrl: string,
): string {
  const url = new URL(currentUrl)

  url.searchParams.delete(SHARED_PRESET_QUERY_PARAM)
  url.searchParams.delete(LEGACY_SHARED_PRESET_QUERY_PARAM)
  url.searchParams.set(SHARED_PRESET_QUERY_PARAM, serializeSharedPreset(preset))
  url.hash = ''

  return url.toString()
}

function validateSharedPresetPayload(payload: unknown): MetronomePreset | null {
  if (!isRecord(payload)) {
    return null
  }

  if (payload.version !== SHARED_PRESET_FORMAT_VERSION) {
    return null
  }

  if (!isRecord(payload.preset)) {
    return null
  }

  return validateSharedPresetData(payload.preset)
}

function validateSharedPresetData(data: Record<string, unknown>): MetronomePreset | null {
  const bpm = readIntegerInRange(data.bpm, MIN_BPM, MAX_BPM)
  const timeSignature = readTimeSignature(data.timeSignature)
  const beatUnit = readNoteValue(data.beatUnit)
  const subdivisions = readIntegerInRange(
    data.subdivisions,
    MIN_SUBDIVISIONS,
    MAX_SUBDIVISIONS,
  )

  if (
    bpm === null ||
    timeSignature === null ||
    beatUnit === null ||
    subdivisions === null
  ) {
    return null
  }

  const subdivisionPattern = readSubdivisionPattern(
    data.subdivisionPattern,
    subdivisions,
  )

  if (subdivisionPattern === null) {
    return null
  }

  const progressiveEnabled = readOptionalBoolean(
    data.progressiveEnabled,
    false,
  )
  const increaseBy = readOptionalIntegerInRange(data.increaseBy, 1, MAX_BPM, 2)
  const increaseEveryMeasures = readOptionalIntegerInRange(
    data.increaseEveryMeasures,
    1,
    64,
    4,
  )
  const maxBpm = readOptionalIntegerInRange(data.maxBpm, MIN_BPM, MAX_BPM, 120)
  const trainingEnabled = readOptionalBoolean(data.trainingEnabled, false)
  const audibleMeasures = readOptionalIntegerInRange(
    data.audibleMeasures,
    1,
    64,
    4,
  )
  const silentMeasures = readOptionalIntegerInRange(
    data.silentMeasures,
    1,
    64,
    2,
  )

  if (
    progressiveEnabled === null ||
    increaseBy === null ||
    increaseEveryMeasures === null ||
    maxBpm === null ||
    trainingEnabled === null ||
    audibleMeasures === null ||
    silentMeasures === null
  ) {
    return null
  }

  return {
    id: 'shared-preset',
    name: readOptionalName(data.name),
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

function readTimeSignature(value: unknown): TimeSignature | null {
  if (!isRecord(value)) {
    return null
  }

  const numerator = readIntegerInRange(
    value.numerator,
    MIN_TIME_SIGNATURE_NUMERATOR,
    MAX_TIME_SIGNATURE_NUMERATOR,
  )
  const denominator = readDenominator(value.denominator)

  if (numerator === null || denominator === null) {
    return null
  }

  return { numerator, denominator }
}

function readSubdivisionPattern(
  value: unknown,
  subdivisions: number,
): SubdivisionPattern | null {
  if (value === undefined) {
    return createDefaultSubdivisionPattern(subdivisions)
  }

  if (!Array.isArray(value) || value.length !== subdivisions) {
    return null
  }

  if (!value.every((item): item is TickState => readTickState(item) !== null)) {
    return null
  }

  return value
}

function readOptionalName(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, 120)
}

function readNoteValue(value: unknown): NoteValue | null {
  if (typeof value === 'string' && NOTE_VALUE_SET.has(value as NoteValue)) {
    return value as NoteValue
  }

  return null
}

function readDenominator(value: unknown): number | null {
  if (typeof value === 'number' && DENOMINATOR_SET.has(value)) {
    return value
  }

  return null
}

function readTickState(value: unknown): TickState | null {
  if (typeof value === 'string' && TICK_STATE_SET.has(value as TickState)) {
    return value as TickState
  }

  return null
}

function readOptionalBoolean(value: unknown, fallback: boolean): boolean | null {
  if (value === undefined) {
    return fallback
  }

  if (typeof value !== 'boolean') {
    return null
  }

  return value
}

function readOptionalIntegerInRange(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number | null {
  if (value === undefined) {
    return fallback
  }

  return readIntegerInRange(value, min, max)
}

function readIntegerInRange(
  value: unknown,
  min: number,
  max: number,
): number | null {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value)
  ) {
    return null
  }

  if (value < min || value > max) {
    return null
  }

  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function decodeBase64Url(value: string): string {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const paddedBase64 = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    '=',
  )
  const binary = atob(paddedBase64)
  const bytes = Uint8Array.from(binary, (character) =>
    character.charCodeAt(0),
  )

  return new TextDecoder().decode(bytes)
}
