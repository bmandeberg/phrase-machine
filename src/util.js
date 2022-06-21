import { RATE_MULTS, EIGHTH_WIDTH } from './globals'

export function noteString(noteNumber) {
  const notes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
  return notes[noteNumber % 12] + Math.max(Math.floor((noteNumber - 24) / 12) + 1, 0)
}

export function constrain(n, min, max) {
  return Math.min(Math.max(n, min), max)
}

export function boxesIntersect(x1min, x1max, y1min, y1max, x2min, x2max, y2min, y2max) {
  return x1min < x2max && x2min < x1max && y1min < y2max && y2min < y1max
}

function snapNum(px, snap) {
  return Math.round(px / (EIGHTH_WIDTH * RATE_MULTS[snap]))
}

export function snapPixels(px, snap) {
  if (snap) {
    return snapNum(px, snap) * (EIGHTH_WIDTH * RATE_MULTS[snap])
  } else return px
}

export function pixelsToTime(px, snap) {
  if (snap) {
    return { [snap]: snapNum(px, snap) }
  } else {
    return { '8n': px / EIGHTH_WIDTH }
  }
}

export function timeToPixels(time) {
  let px = 0
  Object.keys(time).forEach((t) => {
    px += RATE_MULTS[t] * EIGHTH_WIDTH * time[t]
  })
  return px
}
