import * as Tone from 'tone'
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

function snapNum(px, snap, direction) {
  const snapDimension = EIGHTH_WIDTH * RATE_MULTS[snap]
  if (direction) {
    return Math.floor(px / snapDimension) + (direction > 0 ? 1 : 0)
  }
  return Math.round(px / snapDimension)
}

export function snapPixels(px, snap, direction) {
  if (snap) {
    const snapNumber = snapNum(px, snap, direction)
    return { px: snapNumber * (EIGHTH_WIDTH * RATE_MULTS[snap]), snapNumber }
  } else return { px, snapNumber: null }
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
  for (const t in time) {
    px += RATE_MULTS[t] * EIGHTH_WIDTH * time[t]
  }
  return px
}

export function positionToPixels(position) {
  const eighthSeconds = new Tone.Time('8n').toSeconds()
  const positionSeconds = new Tone.Time(position).toSeconds()
  return (positionSeconds / eighthSeconds) * EIGHTH_WIDTH
}

export function chooseLane(lanes) {
  const rand = Math.random()
  let probability = 0
  for (const lane in lanes) {
    if (rand >= probability && rand < probability + lanes[lane]) {
      return lane
    }
    probability += lanes[lane]
  }
}

export function delimiterIndex(delimiters) {
  const position = positionToPixels(Tone.Transport.position)
  for (const [i, delimiter] of delimiters.entries()) {
    if (position >= delimiter.x && (i === delimiters.length - 1 || position < delimiters[i + 1].x)) {
      return i
    }
  }
}
