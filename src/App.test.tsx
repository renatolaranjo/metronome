import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import {
  installAudioContextMock,
  MockAudioContext,
} from './test/audioContextMock'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    MockAudioContext.reset()
    installAudioContextMock()
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'preset-1'),
    })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('renders the default metronome controls', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Metronome' })).toBeVisible()
    expect(screen.getByRole('heading', { name: '80 BPM' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled()
    expect(screen.getByLabelText('Time signature numerator')).toHaveValue(4)
    expect(screen.getByLabelText('Time signature denominator')).toHaveValue('4')
    expect(screen.getByLabelText('Beat unit')).toHaveValue('quarter')
    expect(screen.getByLabelText('Subdivision')).toHaveValue('1')
    expect(
      screen.getByRole('button', { name: 'Subdivision 1: Accent' }),
    ).toBeVisible()
  })

  it('changes the visible BPM with the increment and decrement buttons', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '+' }))
    expect(screen.getByRole('heading', { name: '81 BPM' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: '-' }))
    expect(screen.getByRole('heading', { name: '80 BPM' })).toBeVisible()
  })

  it('toggles playback and resets the label when stopped', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Start' }))

    expect(screen.getByRole('button', { name: 'Stop' })).toBeVisible()
    expect(MockAudioContext.instances).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Stop' }))

    expect(screen.getByRole('button', { name: 'Start' })).toBeVisible()
  })

  it('resizes and cycles the subdivision pattern', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.selectOptions(screen.getByLabelText('Subdivision'), '4')

    expect(screen.getByRole('button', { name: 'Subdivision 1: Accent' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Subdivision 2: Normal' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Subdivision 3: Normal' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Subdivision 4: Normal' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Subdivision 2: Normal' }))
    expect(screen.getByRole('button', { name: 'Subdivision 2: Accent' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Subdivision 2: Accent' }))
    expect(screen.getByRole('button', { name: 'Subdivision 2: Mute' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Subdivision 2: Mute' }))
    expect(screen.getByRole('button', { name: 'Subdivision 2: Normal' })).toBeVisible()
  })

  it('saves, applies, updates, and deletes presets with rhythm settings', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '+' }))
    fireEvent.change(screen.getByLabelText('Time signature numerator'), {
      target: { value: '7' },
    })
    await user.selectOptions(screen.getByLabelText('Time signature denominator'), '8')
    await user.selectOptions(screen.getByLabelText('Beat unit'), 'eighth')
    await user.selectOptions(screen.getByLabelText('Subdivision'), '4')
    await user.click(screen.getByRole('button', { name: 'Subdivision 3: Normal' }))
    await user.click(screen.getByRole('button', { name: 'Subdivision 4: Normal' }))
    await user.click(screen.getByRole('button', { name: 'Subdivision 4: Accent' }))
    await user.type(screen.getByPlaceholderText('Preset name'), 'Seven')
    await user.click(screen.getByRole('button', { name: 'Save preset' }))

    expect(screen.getByRole('option', { name: 'Seven' })).toBeInTheDocument()
    expect(
      JSON.parse(localStorage.getItem('metronome-presets') ?? '[]'),
    ).toEqual([
      {
        id: 'preset-1',
        name: 'Seven',
        bpm: 81,
        timeSignature: {
          numerator: 7,
          denominator: 8,
        },
        beatUnit: 'eighth',
        subdivisions: 4,
        subdivisionPattern: ['accent', 'normal', 'accent', 'mute'],
        progressiveEnabled: false,
        increaseBy: 2,
        increaseEveryMeasures: 4,
        maxBpm: 120,
        trainingEnabled: false,
        audibleMeasures: 4,
        silentMeasures: 2,
      },
    ])

    await user.click(screen.getByRole('button', { name: '-' }))
    fireEvent.change(screen.getByLabelText('Time signature numerator'), {
      target: { value: '4' },
    })
    await user.selectOptions(screen.getByLabelText('Preset'), 'preset-1')

    expect(screen.getByRole('heading', { name: '81 BPM' })).toBeVisible()
    expect(screen.getByLabelText('Time signature numerator')).toHaveValue(7)
    expect(screen.getByLabelText('Time signature denominator')).toHaveValue('8')
    expect(screen.getByLabelText('Beat unit')).toHaveValue('eighth')
    expect(screen.getByPlaceholderText('Preset name')).toHaveValue('Seven')

    await user.clear(screen.getByPlaceholderText('Preset name'))
    await user.type(screen.getByPlaceholderText('Preset name'), 'Updated')
    await user.click(screen.getByRole('button', { name: 'Update preset' }))

    expect(screen.getByRole('option', { name: 'Updated' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete preset' }))

    expect(
      screen.queryByRole('option', { name: 'Updated' }),
    ).not.toBeInTheDocument()
    expect(localStorage.getItem('metronome-presets')).toBe('[]')
  })

  it('loads old presets with safe rhythm defaults', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'metronome-presets',
      JSON.stringify([
        {
          id: 'old-preset',
          name: 'Old',
          bpm: 90,
          beatsPerMeasure: 3,
          subdivisions: 2,
        },
      ]),
    )

    render(<App />)

    await user.selectOptions(screen.getByLabelText('Preset'), 'old-preset')

    expect(screen.getByRole('heading', { name: '90 BPM' })).toBeVisible()
    expect(screen.getByLabelText('Time signature numerator')).toHaveValue(3)
    expect(screen.getByLabelText('Time signature denominator')).toHaveValue('4')
    expect(screen.getByRole('button', { name: 'Subdivision 1: Accent' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Subdivision 2: Normal' })).toBeVisible()
  })
})
