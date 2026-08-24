import { cleanup, render, screen } from '@testing-library/react'
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
    expect(screen.getByLabelText('Time signature')).toHaveValue('4')
    expect(screen.getByLabelText('Subdivision')).toHaveValue('1')
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

  it('saves, applies, updates, and deletes presets', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '+' }))
    await user.selectOptions(screen.getByLabelText('Time signature'), '3')
    await user.selectOptions(screen.getByLabelText('Subdivision'), '2')
    await user.type(screen.getByPlaceholderText('Preset name'), 'Waltz')
    await user.click(screen.getByRole('button', { name: 'Save preset' }))

    expect(screen.getByRole('option', { name: 'Waltz' })).toBeInTheDocument()
    expect(
      JSON.parse(localStorage.getItem('metronome-presets') ?? '[]'),
    ).toEqual([
      {
        id: 'preset-1',
        name: 'Waltz',
        bpm: 81,
        beatsPerMeasure: 3,
        subdivisions: 2,
      },
    ])

    await user.click(screen.getByRole('button', { name: '-' }))
    await user.selectOptions(screen.getByLabelText('Preset'), 'preset-1')

    expect(screen.getByRole('heading', { name: '81 BPM' })).toBeVisible()
    expect(screen.getByPlaceholderText('Preset name')).toHaveValue('Waltz')

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
})
