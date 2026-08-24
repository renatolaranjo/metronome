export class MetronomeEngine {
    private audioContext: AudioContext | null = null
    private timerId: number | null = null

    private bpm = 80
    private nextBeatTime = 0

    private currentBeat = 0
    private beatsPerMeasure = 4

    private readonly schedulerInterval = 25
    private readonly scheduleAheadTime = 0.1

    private subdivisions = 1
    private currentSubdivision = 0

    private onBeat?: (beat: number) => void

    private currentMeasure = 0

    private onMeasure?: (measure: number) => void

    private soundEnabled = true

    setSoundEnabled(enabled: boolean) {
        this.soundEnabled = enabled
    }

    setBpm(bpm: number) {
        this.bpm = bpm
    }

    setOnBeat(callback: (beat: number) => void) {
        this.onBeat = callback
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
        this.beatsPerMeasure = beats
        this.currentBeat = 0
    }

    setSubdivisions(subdivisions: number) {
        this.subdivisions = subdivisions
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
            const isAccent =
                this.currentBeat === 0 && isMainBeat

            if (this.soundEnabled) {
                this.scheduleClick(
                    this.nextBeatTime,
                    isAccent,
                    isMainBeat,
                )
            }
            if (isMainBeat) {
                this.onBeat?.(this.currentBeat)
            }

            this.calculateNextTick()
        }
    }

    private scheduleClick(
        time: number,
        isAccent: boolean,
        isMainBeat: boolean,
    ) {
        if (!this.audioContext) {
            return
        }

        const oscillator = this.audioContext.createOscillator()
        const gain = this.audioContext.createGain()

        oscillator.connect(gain)
        gain.connect(this.audioContext.destination)

        let frequency = 700
        let volume = 0.4

        if (isMainBeat) {
            frequency = 1000
            volume = 0.7
        }

        if (isAccent) {
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

            if (this.currentBeat >= this.beatsPerMeasure) {
                this.currentBeat = 0
                this.currentMeasure++

                this.onMeasure?.(this.currentMeasure)
            }
        }
    }
}
