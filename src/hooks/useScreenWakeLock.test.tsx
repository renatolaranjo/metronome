import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useScreenWakeLock } from './useScreenWakeLock'

class MockWakeLockSentinel extends EventTarget {
  released = false
  release = vi.fn(async () => {
    this.released = true
    this.dispatchEvent(new Event('release'))
  })
}

function TestComponent({ enabled }: { enabled: boolean }) {
  useScreenWakeLock(enabled)

  return null
}

describe('useScreenWakeLock', () => {
  let wakeLockSentinel: MockWakeLockSentinel
  let requestWakeLock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    wakeLockSentinel = new MockWakeLockSentinel()
    requestWakeLock = vi.fn(async () => wakeLockSentinel)

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        request: requestWakeLock,
      },
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('requests a screen wake lock when enabled', async () => {
    render(<TestComponent enabled />)

    await waitFor(() => {
      expect(requestWakeLock).toHaveBeenCalledWith('screen')
    })
  })

  it('releases the wake lock when disabled', async () => {
    const { rerender } = render(<TestComponent enabled />)

    await waitFor(() => {
      expect(requestWakeLock).toHaveBeenCalledWith('screen')
    })

    rerender(<TestComponent enabled={false} />)

    await waitFor(() => {
      expect(wakeLockSentinel.release).toHaveBeenCalled()
    })
  })

  it('does nothing when the Wake Lock API is unavailable', () => {
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: undefined,
    })

    expect(() => render(<TestComponent enabled />)).not.toThrow()
  })
})
