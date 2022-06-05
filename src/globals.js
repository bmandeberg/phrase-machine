import { v4 as uuid } from 'uuid'

export const MEASURE_WIDTH = 200

export const DEFAULT_LANE = {
  id: uuid(),
  measures: [
    {
      id: uuid(),
      notes: [],
    },
  ],
  viewRange: { min: 60, max: 71 },
  probability: 1,
}

export const DEFAULT_PRESET = JSON.stringify({
  id: uuid(),
  lanes: [DEFAULT_LANE],
})
