import { v4 as uuid } from 'uuid'

export const LANE_COLORS = ['#008dff', '#ff413e', '#33ff00', '#ff00ff', '#ff9700', '#a825f4', '#00C591', '#EDDB00']
export const EIGHTH_WIDTH = 24
export const NOTE_HEIGHT = 12
export const KEYS_WIDTH = 10
export const MIN_DELIMITER_WIDTH = 8

export const MIN_MIDI_NOTE = 21
export const MAX_MIDI_NOTE = 127

export function calcLaneLength(width, direction = -1) {
  const measures = width / (EIGHTH_WIDTH * 8)
  return (direction < 0 ? Math.floor(measures) : Math.ceil(measures)) * 8
}

const laneID = uuid()
export const DEFAULT_LANE = {
  id: laneID,
  laneLength: calcLaneLength(window.innerWidth - 30),
  notes: [],
  viewRange: { min: 60, max: 71 },
}

export const DEFAULT_PRESET = JSON.stringify({
  id: uuid(),
  tempo: 120,
  snap: '8n',
  beatsPerBar: 4,
  beatValue: 4,
  lanes: [DEFAULT_LANE],
  delimiters: [
    {
      lanes: { [laneID]: 1 },
      x: 0,
    },
  ],
})

// rates, relative to an eighth note
export const RATE_MULTS = {
  '1n': 8,
  '1n.': 12,
  '2n': 4,
  '2n.': 6,
  '2t': 8 / 3,
  '4n': 2,
  '4n.': 3,
  '4t': 4 / 3,
  '8n': 1,
  '8n.': 1.5,
  '8t': 2 / 3,
  '16n': 0.5,
  '16n.': 0.75,
  '16t': 1 / 3,
  '32n': 0.25,
  '32n.': 0.375,
  '32t': 0.5 / 3,
  // '64n': 0.125,
  // '64n.': 0.1875,
  // '64t': 0.25 / 3,
}

export const RATES = Object.keys(RATE_MULTS)
