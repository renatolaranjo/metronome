export type TimeSignature = {
  numerator: number
  denominator: number
  grouping?: number[]
}

export type NoteValue =
  | 'whole'
  | 'half'
  | 'quarter'
  | 'eighth'
  | 'sixteenth'
  | 'thirtySecond'
  | 'sixtyFourth'

export type TickState = 'accent' | 'normal' | 'mute'

export type SubdivisionPattern = TickState[]

export type MetronomePreset = {
  id: string
  name: string
  bpm: number
  timeSignature: TimeSignature
  beatUnit: NoteValue
  subdivisions: number
  subdivisionPattern: SubdivisionPattern
  progressiveEnabled: boolean
  increaseBy: number
  increaseEveryMeasures: number
  maxBpm: number
  trainingEnabled: boolean
  audibleMeasures: number
  silentMeasures: number
  beatsPerMeasure?: number
}

export type StoredMetronomePreset = Partial<MetronomePreset> & {
  id: string
  name: string
  bpm: number
  beatsPerMeasure?: number
}
