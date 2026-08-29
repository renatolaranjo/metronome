import { useEffect, useMemo, useState } from 'react'
import { MetronomeEngine } from '../audio/metronomeEngine'
import {
  createDefaultSubdivisionPattern,
  getNextTickState,
  getPulsesPerMeasure,
  resizeSubdivisionPattern,
} from '../music/rhythm'
import type {
  MetronomePreset,
  NoteValue,
  SubdivisionPattern,
  TimeSignature,
} from '../types/metronome'

const metronome = new MetronomeEngine()

export function useMetronome(initialPreset?: MetronomePreset) {
  const [bpm, setBpm] = useState(initialPreset?.bpm ?? 80)
  const [isPlaying, setIsPlaying] = useState(false)

  const [timeSignature, setTimeSignature] = useState<TimeSignature>({
    numerator: initialPreset?.timeSignature.numerator ?? 4,
    denominator: initialPreset?.timeSignature.denominator ?? 4,
  })
  const [beatUnit, setBeatUnit] = useState<NoteValue>(
    initialPreset?.beatUnit ?? 'quarter',
  )
  const [subdivisions, setSubdivisions] = useState(
    initialPreset?.subdivisions ?? 1,
  )
  const [subdivisionPattern, setSubdivisionPattern] =
    useState<SubdivisionPattern>(
      () => initialPreset?.subdivisionPattern ?? createDefaultSubdivisionPattern(1),
    )

  const [currentBeat, setCurrentBeat] = useState(0)
  const [currentSubdivision, setCurrentSubdivision] = useState(0)
  const [currentMeasure, setCurrentMeasure] = useState(0)

  const [progressiveEnabled, setProgressiveEnabled] = useState(
    initialPreset?.progressiveEnabled ?? false,
  )
  const [increaseBy, setIncreaseBy] = useState(initialPreset?.increaseBy ?? 2)
  const [increaseEveryMeasures, setIncreaseEveryMeasures] = useState(
    initialPreset?.increaseEveryMeasures ?? 4,
  )
  const [maxBpm, setMaxBpm] = useState(initialPreset?.maxBpm ?? 120)

  const [trainingEnabled, setTrainingEnabled] = useState(
    initialPreset?.trainingEnabled ?? false,
  )
  const [audibleMeasures, setAudibleMeasures] = useState(
    initialPreset?.audibleMeasures ?? 4,
  )
  const [silentMeasures, setSilentMeasures] = useState(
    initialPreset?.silentMeasures ?? 2,
  )
  const [, setTapTimes] = useState<number[]>([])

  const beatsPerMeasure = useMemo(
    () => getPulsesPerMeasure(timeSignature, beatUnit),
    [timeSignature, beatUnit],
  )

  useEffect(() => {
    metronome.setOnBeat((beat) => {
      setCurrentBeat(beat)
    })

    metronome.setOnSubdivision((subdivision) => {
      setCurrentSubdivision(subdivision)
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

  useEffect(() => {
    metronome.setTimeSignature(timeSignature)
    metronome.setBeatUnit(beatUnit)
    metronome.setSubdivisions(subdivisions)
    metronome.setSubdivisionPattern(subdivisionPattern)
  }, [timeSignature, beatUnit, subdivisions, subdivisionPattern])

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

  function changeTimeSignatureNumerator(value: number) {
    setTimeSignature((currentTimeSignature) => ({
      ...currentTimeSignature,
      numerator: Math.max(1, Math.round(value)),
    }))
    setCurrentBeat(0)
  }

  function changeTimeSignatureDenominator(value: number) {
    setTimeSignature((currentTimeSignature) => ({
      ...currentTimeSignature,
      denominator: value,
    }))
    setCurrentBeat(0)
  }

  function changeBeatUnit(value: NoteValue) {
    setBeatUnit(value)
    setCurrentBeat(0)
  }

  function changeBeatsPerMeasure(value: number) {
    changeTimeSignatureNumerator(value)
  }

  function changeSubdivisions(value: number) {
    const newSubdivisions = Math.min(8, Math.max(1, Math.round(value)))

    setSubdivisions(newSubdivisions)
    setCurrentSubdivision(0)
    setSubdivisionPattern((currentPattern) =>
      resizeSubdivisionPattern(currentPattern, newSubdivisions),
    )
  }

  function changeSubdivisionPattern(pattern: SubdivisionPattern) {
    setSubdivisionPattern(
      resizeSubdivisionPattern(pattern, pattern.length),
    )
  }

  function toggleSubdivisionTick(index: number) {
    setSubdivisionPattern((currentPattern) =>
      currentPattern.map((state, currentIndex) =>
        currentIndex === index ? getNextTickState(state) : state,
      ),
    )
  }

  async function toggleMetronome() {
    if (isPlaying) {
      metronome.stop()

      setIsPlaying(false)
      setCurrentBeat(0)
      setCurrentSubdivision(0)
      setCurrentMeasure(0)

      return
    }

    metronome.setBpm(bpm)
    metronome.setTimeSignature(timeSignature)
    metronome.setBeatUnit(beatUnit)
    metronome.setSubdivisions(subdivisions)
    metronome.setSubdivisionPattern(subdivisionPattern)
    metronome.setSoundEnabled(true)

    setCurrentBeat(0)
    setCurrentSubdivision(0)
    setCurrentMeasure(0)

    await metronome.start()
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

    timeSignature,
    beatUnit,
    beatsPerMeasure,
    subdivisions,
    subdivisionPattern,

    currentBeat,
    currentSubdivision,
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
    changeTimeSignatureNumerator,
    changeTimeSignatureDenominator,
    changeBeatUnit,
    changeBeatsPerMeasure,
    changeSubdivisions,
    changeSubdivisionPattern,
    toggleSubdivisionTick,
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
