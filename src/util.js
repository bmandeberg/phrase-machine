import { RATE_MULTS,  } from "./globals"

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

export function pixelsToTime(px, snap) {
  if (snap) {

  }
}

export function timeToPixels(time) {

}