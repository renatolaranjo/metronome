import { useEffect, useRef } from 'react'

type ScreenWakeLockSentinel = EventTarget & {
  released: boolean
  release: () => Promise<void>
}

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: 'screen') => Promise<ScreenWakeLockSentinel>
  }
}

export function useScreenWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<ScreenWakeLockSentinel | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function requestWakeLock() {
      if (
        !enabled ||
        wakeLockRef.current ||
        document.visibilityState !== 'visible'
      ) {
        return
      }

      const wakeLock = (navigator as NavigatorWithWakeLock).wakeLock

      if (!wakeLock) {
        return
      }

      try {
        const wakeLockSentinel = await wakeLock.request('screen')

        if (isCancelled || !enabled) {
          await releaseWakeLockSentinel(wakeLockSentinel)
          return
        }

        wakeLockRef.current = wakeLockSentinel
        wakeLockSentinel.addEventListener(
          'release',
          () => {
            if (wakeLockRef.current === wakeLockSentinel) {
              wakeLockRef.current = null
            }
          },
          { once: true },
        )
      } catch {
        wakeLockRef.current = null
      }
    }

    async function releaseWakeLock() {
      const wakeLockSentinel = wakeLockRef.current
      wakeLockRef.current = null

      if (wakeLockSentinel) {
        await releaseWakeLockSentinel(wakeLockSentinel)
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void requestWakeLock()
        return
      }

      void releaseWakeLock()
    }

    if (!enabled) {
      void releaseWakeLock()
      return
    }

    void requestWakeLock()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isCancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      void releaseWakeLock()
    }
  }, [enabled])
}

async function releaseWakeLockSentinel(
  wakeLockSentinel: ScreenWakeLockSentinel,
) {
  if (wakeLockSentinel.released) {
    return
  }

  try {
    await wakeLockSentinel.release()
  } catch {
    // The browser may already have released it during visibility or power changes.
  }
}
