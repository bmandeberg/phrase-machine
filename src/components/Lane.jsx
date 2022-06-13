import React, { useState, useMemo, useRef, useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { useGesture } from 'react-use-gesture'
import { NOTE_HEIGHT, MEASURE_WIDTH, MIN_MIDI_NOTE, MAX_MIDI_NOTE } from '../globals'
import { constrain } from '../util'
import './Lane.scss'

const MIN_NOTE_WIDTH = 5
const MIN_NOTE_LANES = 4

export default function Lane({ id, color, laneNum, lanePreset, setLaneState, mainContainer }) {
  const [measures, setMeasures] = useState(lanePreset.measures)
  const [delimiters, setDelimiters] = useState(lanePreset.delimiters)
  const [notes, setNotes] = useState(lanePreset.notes)
  const [minNote, setMinNote] = useState(lanePreset.viewRange.min)
  const [maxNote, setMaxNote] = useState(lanePreset.viewRange.max)
  const tempNote = useRef(null)
  const lane = useRef()
  const [selectedNotes, setSelectedNotes] = useState([])
  const selectedNotesRef = useRef()
  const [noPointerEvents, setNoPointerEvents] = useState(false)
  const [grabbing, setGrabbing] = useState(false)

  useEffect(() => {
    selectedNotesRef.current = selectedNotes
  }, [selectedNotes])

  useEffect(() => {
    function deselect(e) {
      if (
        !e.target.classList.contains('note') &&
        !e.target.parentElement.classList.contains('note') &&
        selectedNotesRef.current.length
      ) {
        setSelectedNotes([])
      }
    }
    window.addEventListener('click', deselect)
    return () => {
      window.removeEventListener('click', deselect)
    }
  }, [])

  const createNote = useGesture({
    onDragStart: () => {
      tempNote.current = null
    },
    onDrag: ({ movement: [mx], initial: [ix], event }) => {
      // create note
      if (Math.abs(mx) >= 3 && !tempNote.current) {
        const laneNum = maxNote - minNote - +event.target?.getAttribute('lane-num')
        const left = lane.current?.getBoundingClientRect().left
        if (left) {
          tempNote.current = uuid()
          setNotes((notes) => {
            const notesCopy = notes.slice()
            const newNote = {
              id: tempNote.current,
              midiNote: laneNum + minNote,
              velocity: 1,
              x: ix + 4 - lane.current?.getBoundingClientRect().left + mainContainer.current?.scrollLeft,
              width: mx,
            }
            notesCopy.push(newNote)
            // set as selected note
            setSelectedNotes([newNote.id])
            return notesCopy
          })
          setNoPointerEvents(true)
        }
      } else if (tempNote.current) {
        // update note
        setNotes((notes) => {
          const notesCopy = notes.slice()
          notesCopy.find((note) => note.id === tempNote.current).width = Math.max(mx, 3)
          return notesCopy
        })
      }
    },
    onDragEnd: () => {
      if (tempNote.current) {
        // save state
        setNoPointerEvents(false)
      }
    },
  })

  const dragStart = useRef()
  const noteStart = useRef()
  const dragNote = useGesture({
    onDragStart: ({ event }) => {
      setNoPointerEvents(true)
      setGrabbing(true)
      const note = notes.find((note) => note.id === event.target?.id)
      dragStart.current = note.x
      noteStart.current = note.midiNote
    },
    onDrag: ({ movement: [mx, my], event, shiftKey }) => {
      let newX, newNote
      if (dragStart.current && Math.abs(mx) > 2 && !shiftKey) {
        newX = Math.max(dragStart.current + mx, 0)
      }
      if (noteStart.current) {
        newNote = constrain(noteStart.current - Math.round(my / NOTE_HEIGHT), MIN_MIDI_NOTE, MAX_MIDI_NOTE)
      }
      if (newX !== undefined || newNote) {
        setNotes((notes) => {
          const notesCopy = notes.slice()
          const note = notesCopy.find((note) => note.id === event.target?.id)
          if (newX !== undefined) {
            note.x = newX
          }
          if (newNote) {
            note.midiNote = newNote
          }
          return notesCopy
        })
      }
    },
    onDragEnd: () => {
      setNoPointerEvents(false)
      setGrabbing(false)
    },
  })

  const widthStart = useRef()
  const dragNoteRight = useGesture({
    onDragStart: ({ event }) => {
      event.stopPropagation()
      setNoPointerEvents(true)
      setGrabbing(true)
      widthStart.current = notes.find((note) => note.id === event.target?.parentElement?.id).width
    },
    onDrag: ({ movement: [mx], event }) => {
      if (widthStart.current && widthStart.current + mx >= MIN_NOTE_WIDTH) {
        setNotes((notes) => {
          const notesCopy = notes.slice()
          notesCopy.find((note) => note.id === event.target?.parentElement?.id).width = widthStart.current + mx
          return notesCopy
        })
      }
    },
    onDragEnd: () => {
      setNoPointerEvents(false)
      setGrabbing(false)
    },
  })

  const dragNoteLeft = useGesture({
    onDragStart: ({ event }) => {
      event.stopPropagation()
      setNoPointerEvents(true)
      setGrabbing(true)
      const note = notes.find((note) => note.id === event.target?.parentElement?.id)
      widthStart.current = note.width
      dragStart.current = note.x
    },
    onDrag: ({ movement: [mx], event }) => {
      if (widthStart.current && widthStart.current - mx >= MIN_NOTE_WIDTH) {
        setNotes((notes) => {
          const notesCopy = notes.slice()
          const note = notesCopy.find((note) => note.id === event.target?.parentElement?.id)
          note.width = widthStart.current - mx
          note.x = dragStart.current + mx
          return notesCopy
        })
      }
    },
    onDragEnd: () => {
      setNoPointerEvents(false)
      setGrabbing(false)
    },
  })

  const minNoteStart = useRef()
  const dragLaneStart = useGesture({
    onDragStart: ({ event }) => {
      event.stopPropagation()
      setNoPointerEvents(true)
      minNoteStart.current = minNote
    },
    onDrag: ({ movement: [mx, my] }) => {
      const newMinNote = minNoteStart.current - Math.round(my / NOTE_HEIGHT)
      if (minNoteStart.current && maxNote - newMinNote >= MIN_NOTE_LANES) {
        setMinNote(newMinNote)
      }
    },
    onDragEnd: () => {
      setNoPointerEvents(false)
    },
  })

  const maxNoteStart = useRef()
  const dragLane = useGesture({
    onDragStart: () => {
      setNoPointerEvents(true)
      setGrabbing(true)
      minNoteStart.current = minNote
      maxNoteStart.current = maxNote
    },
    onDrag: ({ movement: [mx, my] }) => {
      const newMinNote = minNoteStart.current + Math.round(my / NOTE_HEIGHT)
      const newMaxNote = maxNoteStart.current + Math.round(my / NOTE_HEIGHT)
      if (minNoteStart.current && maxNoteStart.current && newMinNote >= MIN_MIDI_NOTE && maxNote <= MAX_MIDI_NOTE) {
        setMinNote(newMinNote)
        setMaxNote(newMaxNote)
      }
    },
    onDragEnd: () => {
      setNoPointerEvents(false)
      setGrabbing(false)
    },
  })

  const keyEls = useMemo(() => {
    const numNotes = maxNote - minNote + 1
    return [...Array(numNotes)].map((_d, i) => (
      <div
        key={uuid()}
        className={classNames('key', {
          'black-key': isBlackKey(maxNote - minNote - i + minNote),
          'e-key': !isBlackKey(maxNote - minNote - i + minNote) && nextKeyIsWhite(maxNote - minNote - i + minNote),
        })}>
        {numNotes - 1 - i + minNote >= 24 && (numNotes - 1 - i + minNote) % 12 === 0 && (
          <p className="note-name">C{(numNotes - 1 - i + minNote - 24) / 12 + 1}</p>
        )}
      </div>
    ))
  }, [maxNote, minNote])

  const noteEls = useMemo(() => {
    const minNoteWidth = 16
    return notes
      .filter((note) => note.midiNote >= minNote && note.midiNote <= maxNote)
      .map((note) => (
        <div
          key={note.id}
          id={note.id}
          {...dragNote()}
          className={classNames('note', {
            selected: selectedNotes.includes(note.id),
            'no-pointer': noPointerEvents,
            grabbing,
          })}
          style={{ left: note.x, bottom: (note.midiNote - minNote) * NOTE_HEIGHT + 1, width: note.width }}
          onMouseDown={() => setSelectedNotes([note.id])}>
          <div
            className={classNames('note-drag-left', { outside: note.width < minNoteWidth })}
            {...dragNoteLeft()}></div>
          <div
            className={classNames('note-drag-right', { outside: note.width < minNoteWidth })}
            {...dragNoteRight()}></div>
        </div>
      ))
  }, [notes, minNote, maxNote, dragNote, selectedNotes, noPointerEvents, grabbing, dragNoteLeft, dragNoteRight])

  return (
    <div className="lane-container" style={{ '--lane-color': color, '--note-height': NOTE_HEIGHT + 'px' }}>
      <div className={classNames('keys', { grabbing })} {...dragLane()}>
        {keyEls}
      </div>
      <div className="lane" ref={lane} style={{ width: measures * MEASURE_WIDTH }}>
        {[...Array(maxNote - minNote + 1)].map((_d, i) => (
          <div
            key={uuid()}
            {...createNote()}
            lane-num={i}
            className={classNames('note-lane', {
              'black-key': isBlackKey(maxNote - minNote - i + minNote),
              'e-key': !isBlackKey(maxNote - minNote - i + minNote) && nextKeyIsWhite(maxNote - minNote - i + minNote),
            })}></div>
        ))}
        <div className="ticks">
          {[...Array(7 * measures)].map((_d, i) => (
            <div key={uuid()} className={classNames('tick')}></div>
          ))}
        </div>
      </div>
      <div className="notes">{noteEls}</div>
      <div className="lane-expander" {...dragLaneStart()}></div>
    </div>
  )
}
Lane.propTypes = {
  color: PropTypes.string,
  laneNum: PropTypes.number,
  lanePreset: PropTypes.object,
  setLaneState: PropTypes.func,
  mainContainer: PropTypes.object,
}

const blackKeys = [false, true, false, true, false, false, true, false, true, false, true, false]
function isBlackKey(i) {
  return blackKeys[i % 12]
}

function nextKeyIsWhite(i) {
  return !blackKeys[(i % 12) + 1]
}
