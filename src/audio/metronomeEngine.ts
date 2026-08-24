import type {
    NoteValue,
    SubdivisionPattern,
    TickState,
    TimeSignature,
} from '../types/metronome'
import {
    createDefaultSubdivisionPattern,
    getPulsesPerMeasure,
} from '../music/rhythm'

type ClickType = 'measureAccent' | 'accent' | 'normal'

export class MetronomeEngine {
    private audioContext: AudioContext | null = null
    private timerId: number | null = null

    private bpm = 80
    private nextBeatTime = 0

    private currentBeat = 0
    private timeSignature: TimeSignature = {
        numerator: 4,
        denominator: 4,
    }
    private beatUnit: NoteValue = 'quarter'

    private readonly schedulerInterval = 25
    private readonly scheduleAheadTime = 0.1

    private subdivisions = 1
    private currentSubdivision = 0
    private subdivisionPattern: SubdivisionPattern =
        createDefaultSubdivisionPattern(this.subdivisions)

    private onBeat?: (beat: number) => void
    private onSubdivision?: (subdivision: number) => void

    private currentMeasure = 0

    private onMeasure?: (measure: number) => void

    private soundEnabled = true

    setSoundEnabled(enabled: boolean) {
        this.soundEnabled = enabled
    }

    setBpm(bpm: number) {
        this.bpm = bpm
    }

    setTimeSignature(timeSignature: TimeSignature) {
        this.timeSignature = timeSignature
        this.currentBeat = 0
    }

    setBeatUnit(beatUnit: NoteValue) {
        this.beatUnit = beatUnit
    }

    setOnBeat(callback: (beat: number) => void) {
        this.onBeat = callback
    }

    setOnSubdivision(callback: (subdivision: number) => void) {
        this.onSubdivision = callback
    }

    setOnMeasure(callback: (measure: number) => void) {
        this.onMeasure = callback
    }

    start() {
        if (this.timerId !== null) {
            return
        }

        if (!this.audioContext) {
            this.audioContext = new AudioContext()
        }

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume()
        }

        this.currentBeat = 0
        this.currentSubdivision = 0
        this.nextBeatTime = this.audioContext.currentTime
        this.currentMeasure = 0

        this.scheduler()

        this.timerId = window.setInterval(() => {
            this.scheduler()
        }, this.schedulerInterval)
    }

    stop() {
        if (this.timerId !== null) {
            window.clearInterval(this.timerId)
            this.timerId = null
        }
    }

    setBeatsPerMeasure(beats: number) {
        this.setTimeSignature({
            ...this.timeSignature,
            numerator: beats,
        })
    }

    setSubdivisions(subdivisions: number) {
        this.subdivisions = subdivisions
        this.subdivisionPattern =
            createDefaultSubdivisionPattern(subdivisions)
    }

    setSubdivisionPattern(pattern: SubdivisionPattern) {
        this.subdivisionPattern = pattern
    }

    private scheduler() {
        if (!this.audioContext) {
            return
        }

        while (
            this.nextBeatTime <
            this.audioContext.currentTime + this.scheduleAheadTime
        ) {
            const isMainBeat = this.currentSubdivision === 0
            const isMeasureStart =
                this.currentBeat === 0 && isMainBeat
            const tickState =
                this.subdivisionPattern[this.currentSubdivision] ??
                'normal'

            if (this.soundEnabled && tickState !== 'mute') {
                this.scheduleClick(
                    this.nextBeatTime,
                    this.getClickType(tickState, isMeasureStart),
                )
            }

            if (isMainBeat) {
                this.onBeat?.(this.currentBeat)
            }
            this.onSubdivision?.(this.currentSubdivision)

            this.calculateNextTick()
        }
    }

    private getClickType(
        tickState: TickState,
        isMeasureStart: boolean,
    ): ClickType {
        if (isMeasureStart) {
            return 'measureAccent'
        }

        if (tickState === 'accent') {
            return 'accent'
        }

        return 'normal'
    }

    private scheduleClick(time: number, clickType: ClickType) {
        if (!this.audioContext) {
            return
        }

        const oscillator = this.audioContext.createOscillator()
        const gain = this.audioContext.createGain()

        oscillator.connect(gain)
        gain.connect(this.audioContext.destination)

        let frequency = 700
        let volume = 0.4

        if (clickType === 'accent') {
            frequency = 1000
            volume = 0.7
        }

        if (clickType === 'measureAccent') {
            frequency = 1400
            volume = 1
        }

        oscillator.frequency.setValueAtTime(
            frequency,
            time,
        )

        gain.gain.setValueAtTime(
            volume,
            time,
        )

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            time + 0.05,
        )

        oscillator.start(time)
        oscillator.stop(time + 0.05)
    }

    private calculateNextTick() {
        const secondsPerTick =
            60 / this.bpm / this.subdivisions

        this.nextBeatTime += secondsPerTick

        this.currentSubdivision++

            if (this.currentSubdivision >= this.subdivisions) {
                this.currentSubdivision = 0
                this.currentBeat++

            if (
                this.currentBeat >=
                getPulsesPerMeasure(
                    this.timeSignature,
                    this.beatUnit,
                )
            ) {
                this.currentBeat = 0
                this.currentMeasure++

                this.onMeasure?.(this.currentMeasure)
            }
        }
    }
}
