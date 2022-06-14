import { v4 as uuid } from 'uuid'

export const LANE_COLORS = ['#008dff', '#ff413e', '#33ff00', '#ff00ff', '#ff9700', '#a825f4', '#00C591', '#EDDB00']
export const MEASURE_WIDTH = 200
export const NOTE_HEIGHT = 12

export const MIN_MIDI_NOTE = 21
export const MAX_MIDI_NOTE = 127

export const DEFAULT_LANE = {
  id: uuid(),
  measures: 8,
  delimiters: [],
  notes: [],
  viewRange: { min: 60, max: 71 },
  probability: 1,
}

export const DEFAULT_PRESET = JSON.stringify({
  id: uuid(),
  tempo: 120,
  snap: '4n',
  lanes: [DEFAULT_LANE],
})

export const RATES = [
  '1m',
  '1n',
  '1n.',
  '2n',
  '2n.',
  '2t',
  '4n',
  '4n.',
  '4t',
  '8n',
  '8n.',
  '8t',
  '16n',
  '16n.',
  '16t',
  '32n',
  '32n.',
  '32t',
  '64n',
  '64n.',
  '64t',
]
