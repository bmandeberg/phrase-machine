import { useRef } from 'react'
import { useGesture } from 'react-use-gesture'
import { NOTE_HEIGHT, MIN_MIDI_NOTE, MAX_MIDI_NOTE } from '../globals'

const MIN_NOTE_LANES = 4

export default function useLaneDrag(
  minNote,
  setMinNote,
  maxNote,
  setMaxNote,
  setNoPointerEvents,
  setGrabbing,
  updateLaneState,
  dragChanged
) {
  const minNoteStart = useRef()
  const dragLaneStart = useGesture({
    onDragStart: ({ event }) => {
      event.stopPropagation()
      setNoPointerEvents(true)
      minNoteStart.current = minNote
      dragChanged.current = false
    },
    onDrag: ({ movement: [mx, my], event }) => {
      event.stopPropagation()
      const newMinNote = minNoteStart.current - Math.round(my / NOTE_HEIGHT)
      if (minNoteStart.current && maxNote - newMinNote >= MIN_NOTE_LANES && newMinNote !== minNote) {
        setMinNote(newMinNote)
        dragChanged.current = true
      }
    },
    onDragEnd: ({ event }) => {
      event.stopPropagation()
      setNoPointerEvents(false)
      if (dragChanged.current === true) {
        dragChanged.current = false
        updateLaneState()
      }
    },
  })

  const maxNoteStart = useRef()
  const dragLane = useGesture({
    onDragStart: ({ event }) => {
      event.stopPropagation()
      setNoPointerEvents(true)
      setGrabbing(true)
      minNoteStart.current = minNote
      maxNoteStart.current = maxNote
      dragChanged.current = false
    },
    onDrag: ({ movement: [mx, my], event }) => {
      event.stopPropagation()
      const newMinNote = minNoteStart.current + Math.round(my / NOTE_HEIGHT)
      const newMaxNote = maxNoteStart.current + Math.round(my / NOTE_HEIGHT)
      if (
        minNoteStart.current &&
        maxNoteStart.current &&
        newMinNote >= MIN_MIDI_NOTE &&
        maxNote <= MAX_MIDI_NOTE &&
        (newMinNote !== minNote || newMaxNote !== maxNote)
      ) {
        setMinNote(newMinNote)
        setMaxNote(newMaxNote)
        dragChanged.current = true
      }
    },
    onDragEnd: ({ event }) => {
      event.stopPropagation()
      setNoPointerEvents(false)
      setGrabbing(false)
      if (dragChanged.current === true) {
        dragChanged.current = false
        updateLaneState()
      }
    },
  })

  return { dragLaneStart, dragLane }
}
