import { useEffect, useState } from 'react'
import { MetronomeEngine } from '../audio/metronomeEngine'

const metronome = new MetronomeEngine()

export function useMetronome() {
  const [bpm, setBpm] = useState(80)
  const [isPlaying, setIsPlaying] = useState(false)

  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4)
  const [subdivisions, setSubdivisions] = useState(1)

  const [currentBeat, setCurrentBeat] = useState(0)
  const [currentMeasure, setCurrentMeasure] = useState(0)

  const [progressiveEnabled, setProgressiveEnabled] = useState(false)
  const [increaseBy, setIncreaseBy] = useState(2)
  const [increaseEveryMeasures, setIncreaseEveryMeasures] = useState(4)
  const [maxBpm, setMaxBpm] = useState(120)

  const [trainingEnabled, setTrainingEnabled] = useState(false)
  const [audibleMeasures, setAudibleMeasures] = useState(4)
  const [silentMeasures, setSilentMeasures] = useState(2)
  const [, setTapTimes] = useState<number[]>([])

  useEffect(() => {
    metronome.setOnBeat((beat) => {
      setCurrentBeat(beat)
    })

    metronome.setOnMeasure((measure) => {
      setCurrentMeasure(measure)

      if (trainingEnabled) {
        const cycleLength =
          audibleMeasures + silentMeasures

        const positionInCycle =
          measure % cycleLength

        metronome.setSoundEnabled(
          positionInCycle < audibleMeasures,
        )
      } else {
        metronome.setSoundEnabled(true)
      }

      if (
        progressiveEnabled &&
        measure % increaseEveryMeasures === 0
      ) {
        setBpm((currentBpm) => {
          const newBpm = Math.min(
            currentBpm + increaseBy,
            maxBpm,
          )

          metronome.setBpm(newBpm)

          return newBpm
        })
      }
    })
  }, [
    progressiveEnabled,
    increaseBy,
    increaseEveryMeasures,
    maxBpm,
    trainingEnabled,
    audibleMeasures,
    silentMeasures,
  ])

  function increaseBpm() {
    setBpm((currentBpm) => {
      const newBpm = Math.min(300, currentBpm + 1)

      metronome.setBpm(newBpm)

      return newBpm
    })
  }

  function decreaseBpm() {
    setBpm((currentBpm) => {
      const newBpm = Math.max(20, currentBpm - 1)

      metronome.setBpm(newBpm)

      return newBpm
    })
  }

  function changeBpm(value: number) {
    setBpm(value)
    metronome.setBpm(value)
  }

  function changeBeatsPerMeasure(value: number) {
    setBeatsPerMeasure(value)
    metronome.setBeatsPerMeasure(value)
  }

  function changeSubdivisions(value: number) {
    setSubdivisions(value)
    metronome.setSubdivisions(value)
  }

  function toggleMetronome() {
    if (isPlaying) {
      metronome.stop()

      setIsPlaying(false)
      setCurrentBeat(0)
      setCurrentMeasure(0)

      return
    }

    metronome.setBpm(bpm)
    metronome.setBeatsPerMeasure(beatsPerMeasure)
    metronome.setSubdivisions(subdivisions)
    metronome.setSoundEnabled(true)

    setCurrentBeat(0)
    setCurrentMeasure(0)

    metronome.start()
    setIsPlaying(true)
  }

  function tapTempo() {
  const now = performance.now()

  setTapTimes((currentTapTimes) => {
    if (currentTapTimes.length > 0) {
      const lastTap =
        currentTapTimes[currentTapTimes.length - 1]

      const timeSinceLastTap = now - lastTap

      if (timeSinceLastTap > 2000) {
        return [now]
      }
    }

    const newTapTimes = [
      ...currentTapTimes,
      now,
    ].slice(-6)

    if (newTapTimes.length < 2) {
      return newTapTimes
    }

    const intervals: number[] = []

    for (let i = 1; i < newTapTimes.length; i++) {
      intervals.push(
        newTapTimes[i] - newTapTimes[i - 1],
      )
    }

    const averageInterval =
      intervals.reduce(
        (sum, interval) => sum + interval,
        0,
      ) / intervals.length

    const calculatedBpm = Math.round(
      60000 / averageInterval,
    )

    const limitedBpm = Math.min(
      300,
      Math.max(20, calculatedBpm),
    )

    setBpm(limitedBpm)
    metronome.setBpm(limitedBpm)

    return newTapTimes
  })
}

  return {
    bpm,
    isPlaying,

    beatsPerMeasure,
    subdivisions,

    currentBeat,
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
    changeBeatsPerMeasure,
    changeSubdivisions,
    toggleMetronome,

    setProgressiveEnabled,
    setIncreaseBy,
    setIncreaseEveryMeasures,
    setMaxBpm,

    setTrainingEnabled,
    setAudibleMeasures,
    setSilentMeasures,

    tapTempo,
  }
}
