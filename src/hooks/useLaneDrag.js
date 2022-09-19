import { useRef } from 'react'
import { useGesture } from 'react-use-gesture'
import { NOTE_HEIGHT, MIN_MIDI_NOTE, MAX_MIDI_NOTE } from '../globals'

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
  setChangingProbability,
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

  const maxNoteStart = useRef()
  const dragLane = useGesture({
    onDragStart: ({ event }) => {
      event.stopPropagation()
      setNoPointerEvents(true)
      setGrabbing(true)
      minNoteStart.current = minNote
      maxNoteStart.current = maxNote
      dragChanged.current = false
      cancelClick.current = true
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

  // probability bar drag
  const delimiterIndex = useRef()
  const laneID = useRef()
  const fullHeight = useRef()
  const dragProbability = useGesture({
    onDragStart: ({ event }) => {
      event.stopPropagation()
      delimiterIndex.current = +event.target.getAttribute('delimiter-index')
      laneID.current = event.target.getAttribute('lane-id')
      fullHeight.current = +event.target.getAttribute('full-height')
      setChangingProbability(delimiterIndex.current)
    },
    onDrag: ({ movement: [mx, my], event }) => {
      event.stopPropagation()
    },
    onDragEnd: ({ event }) => {
      event.stopPropagation()
      setChangingProbability(null)
    },
  })

  return { dragLaneStart, dragLane, dragProbability }
}
