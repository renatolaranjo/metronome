import { describe, expect, it } from 'vitest'
import type { MetronomePreset } from '../types/metronome'
import {
  createSharedPresetUrl,
  deserializeSharedPreset,
  serializeSharedPreset,
} from './sharedPreset'

const preset: MetronomePreset = {
  id: 'preset-1',
  name: 'Alternate Picking 1',
  bpm: 80,
  timeSignature: {
    numerator: 4,
    denominator: 4,
  },
  beatUnit: 'quarter',
  subdivisions: 4,
  subdivisionPattern: ['accent', 'normal', 'accent', 'normal'],
  progressiveEnabled: false,
  increaseBy: 2,
  increaseEveryMeasures: 4,
  maxBpm: 120,
  trainingEnabled: false,
  audibleMeasures: 4,
  silentMeasures: 2,
}

describe('shared preset serialization', () => {
  it('keeps the configuration after serialize and deserialize', () => {
    expect(deserializeSharedPreset(serializeSharedPreset(preset))).toEqual({
      ...preset,
      id: 'shared-preset',
    })
  })

  it('supports special characters in the exercise name', () => {
    const sharedPreset = deserializeSharedPreset(
      serializeSharedPreset({
        ...preset,
        name: '3NPS - Jônio / Dórico & "Mixolídio"',
      }),
    )

    expect(sharedPreset?.name).toBe('3NPS - Jônio / Dórico & "Mixolídio"')
  })

  it('rejects an invalid payload', () => {
    expect(deserializeSharedPreset('not-json')).toBeNull()
  })

  it('rejects an unknown share format version', () => {
    expect(
      deserializeSharedPreset(
        encodePayload({
          version: 2,
          preset,
        }),
      ),
    ).toBeNull()
  })

  it('rejects invalid BPM values', () => {
    expect(
      deserializeSharedPreset(
        encodePayload({
          version: 1,
          preset: {
            ...preset,
            bpm: 301,
          },
        }),
      ),
    ).toBeNull()
  })

  it('rejects patterns with an invalid length', () => {
    expect(
      deserializeSharedPreset(
        encodePayload({
          version: 1,
          preset: {
            ...preset,
            subdivisionPattern: ['accent', 'normal'],
          },
        }),
      ),
    ).toBeNull()
  })

  it('uses safe defaults when optional properties are absent', () => {
    const sharedPreset = deserializeSharedPreset(
      encodePayload({
        version: 1,
        preset: {
          bpm: 96,
          timeSignature: {
            numerator: 3,
            denominator: 4,
          },
          beatUnit: 'quarter',
          subdivisions: 2,
        },
      }),
    )

    expect(sharedPreset).toMatchObject({
      name: '',
      bpm: 96,
      subdivisionPattern: ['accent', 'normal'],
      progressiveEnabled: false,
      increaseBy: 2,
      increaseEveryMeasures: 4,
      maxBpm: 120,
      trainingEnabled: false,
      audibleMeasures: 4,
      silentMeasures: 2,
    })
  })

  it('keeps Progressive Tempo settings', () => {
    const sharedPreset = deserializeSharedPreset(
      serializeSharedPreset({
        ...preset,
        progressiveEnabled: true,
        increaseBy: 3,
        increaseEveryMeasures: 8,
        maxBpm: 144,
      }),
    )

    expect(sharedPreset).toMatchObject({
      progressiveEnabled: true,
      increaseBy: 3,
      increaseEveryMeasures: 8,
      maxBpm: 144,
    })
  })

  it('keeps Training Mode settings', () => {
    const sharedPreset = deserializeSharedPreset(
      serializeSharedPreset({
        ...preset,
        trainingEnabled: true,
        audibleMeasures: 2,
        silentMeasures: 4,
      }),
    )

    expect(sharedPreset).toMatchObject({
      trainingEnabled: true,
      audibleMeasures: 2,
      silentMeasures: 4,
    })
  })

  it('keeps Accent, Normal, and Mute subdivision states', () => {
    const sharedPreset = deserializeSharedPreset(
      serializeSharedPreset({
        ...preset,
        subdivisionPattern: ['accent', 'normal', 'mute', 'accent'],
      }),
    )

    expect(sharedPreset?.subdivisionPattern).toEqual([
      'accent',
      'normal',
      'mute',
      'accent',
    ])
  })

  it('replaces old shared preset URL parameters when creating a new link', () => {
    const url = createSharedPresetUrl(
      preset,
      'https://example.com/metronome/?p=old&preset=older&theme=dark',
    )

    const sharedUrl = new URL(url)

    expect(sharedUrl.searchParams.get('theme')).toBe('dark')
    expect(sharedUrl.searchParams.get('preset')).toBeNull()
    expect(sharedUrl.searchParams.get('p')).toBe(serializeSharedPreset(preset))
  })
})

function encodePayload(payload: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}
