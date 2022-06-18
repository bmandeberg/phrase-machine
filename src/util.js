export function noteString(noteNumber) {
  const notes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
  return notes[noteNumber % 12] + Math.max(Math.floor((noteNumber - 24) / 12) + 1, 0)
}

export function constrain(n, min, max) {
  return Math.min(Math.max(n, min), max)
}
