import { v4 as uuid } from 'uuid'

export const LANE_COLORS = [
  { base: '#008dff', hover: '#33a4ff', lane: '#e6f3fc', light: '#8fd2ff', lightest: '#b3ddff' },
  { base: '#00DD69', hover: '#20f279', lane: '#e8f7eb', light: '#82f9b2', lightest: '#a2fcc7' },
  { base: '#FF88E3', hover: '#ffabef', lane: '#ffeeff', light: '#f9c7ef', lightest: '#fcd4f4' },
  { base: '#7C00FF', hover: '#994aff', lane: '#efeeff', light: '#c3a4ff', lightest: '#d4b8ff' },
  { base: '#FF3154', hover: '#ff577b', lane: '#fff0f5', light: '#f99bbd', lightest: '#fcb4cb' },
  { base: '#FF9B00', hover: '#ffb452', lane: '#fff2e3', light: '#ffd0a6', lightest: '#ffdebb' },
  { base: '#d600a9', hover: '#ef48cf', lane: '#f9edf9', light: '#ff92f5', lightest: '#ffa9f3' },
  { base: '#00c6a9', hover: '#40e2c7', lane: '#e1f9f4', light: '#62efd4', lightest: '#80ffe7' },
]
export const EIGHTH_WIDTH = 24
export const NOTE_HEIGHT = 12
export const KEYS_WIDTH = 10
export const MIN_DELIMITER_WIDTH = 8
export const MAX_LANES = 8

export const MIN_MIDI_NOTE = 21
export const MAX_MIDI_NOTE = 127

export function calcLaneLength(width, direction = -1) {
  const measures = width / (EIGHTH_WIDTH * 8)
  return (direction < 0 ? Math.floor(measures) : Math.ceil(measures)) * 8
}

const laneID = uuid()
export const DEFAULT_LANE = (id = laneID, laneLength = calcLaneLength(window.innerWidth - 30), colorIndex = 0) => ({
  id,
  laneLength,
  notes: [],
  viewRange: { min: 60, max: 71 },
  colorIndex,
})

export const DEFAULT_PRESET = JSON.stringify({
  id: uuid(),
  tempo: 120,
  snap: '8n',
  beatsPerBar: 4,
  beatValue: 4,
  lanes: [DEFAULT_LANE()],
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
