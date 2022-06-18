import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { v4 as uuid } from 'uuid'
import classNames from 'classnames'
import { useGesture } from 'react-use-gesture'
import { NOTE_HEIGHT, MEASURE_WIDTH, MIN_MIDI_NOTE, MAX_MIDI_NOTE } from '../globals'
import { constrain, noteString } from '../util'
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
  const [selectedNotes, setSelectedNotes] = useState([]) // list of note IDs
  const selectedNotesRef = useRef(selectedNotes)
  const [noPointerEvents, setNoPointerEvents] = useState(false)
  const noPointerEventsRef = useRef(noPointerEvents)
  const [grabbing, setGrabbing] = useState(false)
  const shiftPressed = useRef(false)

  useEffect(() => {
    selectedNotesRef.current = selectedNotes
  }, [selectedNotes])

  useEffect(() => {
    noPointerEventsRef.current = noPointerEvents
  }, [noPointerEvents])

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
    function keydown(e) {
      if (e.key === 'Backspace' && selectedNotesRef.current?.length && !noPointerEventsRef.current) {
        setNotes((notes) => notes.filter((note) => !selectedNotesRef.current.includes(note.id)))
        setSelectedNotes([])
      } else if (e.key === 'Shift') {
        shiftPressed.current = true
      }
    }
    function keyup(e) {
      if (e.key === 'Shift') {
        shiftPressed.current = false
      }
    }
    window.addEventListener('click', deselect)
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    return () => {
      window.removeEventListener('click', deselect)
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
    }
  }, [])

  // note creation

  const createNote = useGesture({
    onDragStart: () => {
      if (tempNote.current) {
        tempNote.current = null
      }
    },
    onDrag: ({ movement: [mx], initial: [ix], event, metaKey }) => {
      // create note
      if (metaKey && Math.abs(mx) >= 3 && !tempNote.current) {
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

  // note dragging

  const addSelectedNotes = useCallback((id) => {
    if (!selectedNotesRef.current.includes(id)) {
      if (shiftPressed.current) {
        selectedNotesRef.current.push(id)
      } else {
        selectedNotesRef.current = [id]
      }
    } else {
      selectedNotesRef.current.push(selectedNotesRef.current.splice(selectedNotesRef.current.indexOf(id), 1)[0])
    }
    setSelectedNotes(selectedNotesRef.current.slice())
  }, [])

  const dragStart = useRef()
  const noteStart = useRef()
  const dragChanged = useRef(false)
  const dragNote = useGesture({
    onDragStart: ({ event }) => {
      setNoPointerEvents(true)
      setGrabbing(true)
      addSelectedNotes(event.target?.id)
      dragStart.current = selectedNotesRef.current.map((id) => notes.find((note) => note.id === id).x)
      noteStart.current = selectedNotesRef.current.map((id) => notes.find((note) => note.id === id).midiNote)
    },
    onDrag: ({ movement: [mx, my], cancel, shiftKey }) => {
      dragChanged.current = mx || my
      selectedNotesRef.current.forEach((id, i) => {
        let newX = dragStart.current[i]
        let newNote = noteStart.current[i]
        let shiftDirectionX
        if (shiftKey) {
          shiftDirectionX = Math.abs(mx) > Math.abs(my)
        }
        if (dragStart.current[i] !== undefined && Math.abs(mx) > 2 && (!shiftKey || shiftDirectionX)) {
          newX = Math.max(dragStart.current[i] + mx, 0)
        }
        if (noteStart.current[i] && (!shiftKey || shiftDirectionX === false)) {
          newNote = constrain(noteStart.current[i] - Math.round(my / NOTE_HEIGHT), MIN_MIDI_NOTE, MAX_MIDI_NOTE)
        }
        setNotes((notes) => {
          const notesCopy = notes.slice()
          const note = notesCopy.find((note) => note.id === id)
          note.x = newX
          note.midiNote = newNote
          return notesCopy
        })
        if (i === selectedNotesRef.current.length - 1 && (newNote < minNote || newNote > maxNote)) {
          cancel()
        }
      })
    },
    onDragEnd: ({ shiftKey, event }) => {
      setNoPointerEvents(false)
      setGrabbing(false)
      if (!dragChanged.current && !shiftKey) {
        setSelectedNotes([event.target?.id])
      }
      dragChanged.current = false
    },
  })

  const widthStart = useRef()
  const dragNoteRight = useGesture({
    onDragStart: ({ event }) => {
      event.stopPropagation()
      setNoPointerEvents(true)
      setGrabbing(true)
      addSelectedNotes(event.target?.parentElement?.id)
      widthStart.current = selectedNotesRef.current.map((id) => notes.find((note) => note.id === id).width)
    },
    onDrag: ({ movement: [mx] }) => {
      dragChanged.current = mx
      selectedNotesRef.current.forEach((id, i) => {
        if (widthStart.current[i] && widthStart.current[i] + mx >= MIN_NOTE_WIDTH) {
          setNotes((notes) => {
            const notesCopy = notes.slice()
            notesCopy.find((note) => note.id === id).width = widthStart.current[i] + mx
            return notesCopy
          })
        }
      })
    },
    onDragEnd: ({ shiftKey, event }) => {
      setNoPointerEvents(false)
      setGrabbing(false)
      if (!dragChanged.current && !shiftKey) {
        setSelectedNotes([event.target?.parentElement?.id])
      }
      dragChanged.current = false
    },
  })

  const dragNoteLeft = useGesture({
    onDragStart: ({ event }) => {
      event.stopPropagation()
      setNoPointerEvents(true)
      setGrabbing(true)
      addSelectedNotes(event.target?.parentElement?.id)
      widthStart.current = selectedNotesRef.current.map((id) => notes.find((note) => note.id === id).width)
      dragStart.current = selectedNotesRef.current.map((id) => notes.find((note) => note.id === id).x)
    },
    onDrag: ({ movement: [mx] }) => {
      dragChanged.current = mx
      selectedNotesRef.current.forEach((id, i) => {
        if (widthStart.current[i] && widthStart.current[i] - mx >= MIN_NOTE_WIDTH) {
          setNotes((notes) => {
            const notesCopy = notes.slice()
            const note = notesCopy.find((note) => note.id === id)
            note.width = widthStart.current[i] - mx
            note.x = dragStart.current[i] + mx
            return notesCopy
          })
        }
      })
    },
    onDragEnd: ({ shiftKey, event }) => {
      setNoPointerEvents(false)
      setGrabbing(false)
      if (!dragChanged.current && !shiftKey) {
        setSelectedNotes([event.target?.parentElement?.id])
      }
      dragChanged.current = false
    },
  })

  // lane dragging

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

  // elements and handlers

  const keyEls = useMemo(() => {
    const numNotes = maxNote - minNote + 1
    const noC = maxNote - minNote < 12 && maxNote % 12 > minNote % 12 && minNote % 12 !== 0
    return [...Array(numNotes)].map((_d, i) => (
      <div
        key={uuid()}
        className={classNames('key', {
          'black-key': isBlackKey(maxNote - minNote - i + minNote),
          'e-key': !isBlackKey(maxNote - minNote - i + minNote) && nextKeyIsWhite(maxNote - minNote - i + minNote),
        })}>
        {!noC && numNotes - 1 - i + minNote >= 24 && (numNotes - 1 - i + minNote) % 12 === 0 && (
          <p className="note-name">C{(numNotes - 1 - i + minNote - 24) / 12 + 1}</p>
        )}
        {noC && i === numNotes - 1 && <p className="note-name">{noteString(minNote)}</p>}
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
          style={{ left: note.x, bottom: (note.midiNote - minNote) * NOTE_HEIGHT + 1, width: note.width }}>
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
  return blackKeys[(i % 12) + 1]
}
