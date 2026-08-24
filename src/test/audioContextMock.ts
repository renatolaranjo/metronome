import { vi } from 'vitest'

type ScheduledValue = {
  value: number
  time: number
}

export class MockAudioParam {
  readonly setValueAtTime = vi.fn((value: number, time: number) => {
    this.scheduledValues.push({ value, time })
  })

  readonly exponentialRampToValueAtTime = vi.fn(
    (value: number, time: number) => {
      this.scheduledValues.push({ value, time })
    },
  )

  readonly scheduledValues: ScheduledValue[] = []
}

export class MockOscillatorNode {
  readonly frequency = new MockAudioParam()
  readonly connect = vi.fn()
  readonly start = vi.fn()
  readonly stop = vi.fn()
}

export class MockGainNode {
  readonly gain = new MockAudioParam()
  readonly connect = vi.fn()
}

export class MockAudioContext {
  static instances: MockAudioContext[] = []

  currentTime = 0
  readonly destination = {}
  readonly oscillators: MockOscillatorNode[] = []
  readonly gains: MockGainNode[] = []
  readonly resume = vi.fn()
  state: AudioContextState = 'running'

  constructor() {
    MockAudioContext.instances.push(this)
  }

  createOscillator() {
    const oscillator = new MockOscillatorNode()

    this.oscillators.push(oscillator)

    return oscillator
  }

  createGain() {
    const gain = new MockGainNode()

    this.gains.push(gain)

    return gain
  }

  static reset() {
    MockAudioContext.instances = []
  }
}

export function installAudioContextMock() {
  vi.stubGlobal('AudioContext', MockAudioContext)
}
