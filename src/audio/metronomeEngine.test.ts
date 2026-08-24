import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MetronomeEngine } from './metronomeEngine'
import {
  installAudioContextMock,
  MockAudioContext,
} from '../test/audioContextMock'

describe('MetronomeEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    MockAudioContext.reset()
    installAudioContextMock()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('starts only one scheduler interval while already running', () => {
    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    const engine = new MetronomeEngine()

    engine.start()
    engine.start()

    expect(setIntervalSpy).toHaveBeenCalledTimes(1)

    engine.stop()
  })

  it('schedules an accented first beat when sound is enabled', () => {
    const engine = new MetronomeEngine()

    engine.start()

    const context = MockAudioContext.instances[0]
    const oscillator = context.oscillators[0]
    const gain = context.gains[0]

    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(1400, 0)
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(1, 0)
    expect(oscillator.start).toHaveBeenCalledWith(0)
    expect(oscillator.stop).toHaveBeenCalledWith(0.05)

    engine.stop()
  })

  it('does not schedule clicks when sound is disabled', () => {
    const engine = new MetronomeEngine()

    engine.setSoundEnabled(false)
    engine.start()

    expect(MockAudioContext.instances[0].oscillators).toHaveLength(0)

    engine.stop()
  })

  it('reports beats and completed measures according to the configured meter', () => {
    const onBeat = vi.fn()
    const onMeasure = vi.fn()
    const engine = new MetronomeEngine()

    engine.setBpm(60)
    engine.setBeatsPerMeasure(4)
    engine.setOnBeat(onBeat)
    engine.setOnMeasure(onMeasure)
    engine.start()

    const context = MockAudioContext.instances[0]

    for (const currentTime of [1, 2, 3, 4]) {
      context.currentTime = currentTime
      vi.advanceTimersByTime(25)
    }

    expect(onBeat).toHaveBeenNthCalledWith(1, 0)
    expect(onBeat).toHaveBeenNthCalledWith(2, 1)
    expect(onBeat).toHaveBeenNthCalledWith(3, 2)
    expect(onBeat).toHaveBeenNthCalledWith(4, 3)
    expect(onBeat).toHaveBeenNthCalledWith(5, 0)
    expect(onMeasure).toHaveBeenCalledWith(1)

    engine.stop()
  })
})
