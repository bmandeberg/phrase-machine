import { v4 as uuid } from 'uuid'

export const LANE_COLORS = [
  {
    base: '#008dff',
    hover: '#33a4ff',
    lane: '#e6f3fc',
    light: '#8fd2ff',
    lightest: '#b3ddff',
    dark: '#0247aa',
    white: '#E6F3FC',
    gray: '#BFCED6',
  }, // blue
  {
    base: '#00DD69',
    hover: '#20f279',
    lane: '#e8f7eb',
    light: '#82f9b2',
    lightest: '#a2fcc7',
    dark: '#03843a',
    white: '#E8F7EB',
    gray: '#B8D1BC',
  }, // green
  {
    base: '#FF88E3',
    hover: '#ffabef',
    lane: '#ffeeff',
    light: '#f9c7ef',
    lightest: '#fcd4f4',
    dark: '#c4009f',
    white: '#FFEEFF',
    gray: '#D9C8DB',
  }, // pink
  {
    base: '#7C00FF',
    hover: '#994aff',
    lane: '#efeeff',
    light: '#c3a4ff',
    lightest: '#d4b8ff',
    dark: '#4600a0',
    white: '#EFEEFF',
    gray: '#C6C6E0',
  }, // purple
  {
    base: '#FF3154',
    hover: '#ff577b',
    lane: '#fff0f5',
    light: '#f99bbd',
    lightest: '#fcb4cb',
    dark: '#bf0029',
    white: '#FFF0F5',
    gray: '#DDCAD2',
  }, // red
  {
    base: '#FF9B00',
    hover: '#ffb452',
    lane: '#fff2e3',
    light: '#ffd0a6',
    lightest: '#ffdebb',
    dark: '#af5300',
    white: '#FFF2E3',
    gray: '#DDCFC3',
  }, // orange
  {
    base: '#d600a9',
    hover: '#ef48cf',
    lane: '#f9edf9',
    light: '#ff92f5',
    lightest: '#ffa9f3',
    dark: '#9b0085',
    white: '#F9EDF9',
    gray: '#D7CAD8',
  }, // magenta
  {
    base: '#00c6a9',
    hover: '#40e2c7',
    lane: '#e1f9f4',
    light: '#62efd4',
    lightest: '#80ffe7',
    dark: '#006b68',
    white: '#E1F9F4',
    gray: '#BAD1CB',
  }, // teal
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
  mute: false,
  solo: false,
})

export const DEFAULT_PRESET = JSON.stringify({
  id: uuid(),
  tempo: 120,
  snapToGrid: true,
  grid: '8n',
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

export function mapLaneLength(laneLength, grid) {
  return Math.ceil(laneLength / RATE_MULTS[grid])
}

export const RATE_TICKS = {
  '1n': () => true,
  '1n.': () => true,
  '2n': () => true,
  '2n.': () => true,
  '2t': () => true,
  '4n': () => true,
  '4n.': () => true,
  '4t': (i) => i % 3 === 0,
  '8n': (i) => i % 2 === 0,
  '8n.': () => true,
  '8t': (i) => i % 3 === 0,
  '16n': (i) => i % 4 === 0,
  '16n.': () => true,
  '16t': (i) => i % 6 === 0,
  '32n': (i) => i % 8 === 0,
  '32n.': () => true,
  '32t': (i) => i % 12 === 0,
}

export const RATES = Object.keys(RATE_MULTS)
