import { useRef } from 'react'
import { useGesture } from 'react-use-gesture'
import { NOTE_HEIGHT } from '../globals'

const MIN_NOTE_LANES = 8

export default function useLaneDrag(
  minNote,
  setMinNote,
  maxNote,
  setMaxNote,
  setNoPointerEvents,
  setGrabbing,
  updateLaneState,
  dragChanged,
  cancelClick
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
      if (minNoteStart.current && maxNote - newMinNote >= MIN_NOTE_LANES - 1 && newMinNote !== minNote) {
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

  return { dragLaneStart }
}
