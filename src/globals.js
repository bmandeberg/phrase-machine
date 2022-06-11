import { v4 as uuid } from 'uuid'

export const LANE_COLORS = ['#008dff', '#ff413e', '#33ff00', '#ff00ff', '#ff9700', '#a825f4', '#00C591', '#EDDB00']
export const MEASURE_WIDTH = 200
export const NOTE_HEIGHT = 12

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
  lanes: [DEFAULT_LANE],
})
