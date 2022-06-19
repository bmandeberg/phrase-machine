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
  const mouseMoved = useRef(false)

  useEffect(() => {
    selectedNotesRef.current = selectedNotes
  }, [selectedNotes])

  useEffect(() => {
    noPointerEventsRef.current = noPointerEvents
  }, [noPointerEvents])

  // lane state management

  const updateLaneStateRef = useRef(() => {})
  const updateLaneState = useCallback(() => {
    setLaneState({
      id,
      measures,
      delimiters,
      notes,
      viewRange: { min: minNote, max: maxNote },
    })
  }, [delimiters, id, maxNote, measures, minNote, notes, setLaneState])
  useEffect(() => {
    updateLaneStateRef.current = updateLaneState
  }, [updateLaneState])

  useEffect(() => {
    setMeasures(lanePreset.measures)
    setDelimiters(lanePreset.delimiters)
    setNotes(lanePreset.notes)
    setMinNote(lanePreset.viewRange.min)
    setMaxNote(lanePreset.viewRange.max)
  }, [lanePreset])

  // init and attach events

  useEffect(() => {
    function mouseDown() {
      mouseMoved.current = false
    }
    function moveMouse() {
      if (!mouseMoved.current) {
        mouseMoved.current = true
      }
    }
    function deselect(e) {
      if (
        !e.target.classList.contains('note') &&
        !e.target.parentElement.classList.contains('note') &&
        selectedNotesRef.current.length &&
        !mouseMoved.current
      ) {
        setSelectedNotes([])
      }
      mouseMoved.current = false
    }
    function keydown(e) {
      if (e.key === 'Backspace' && selectedNotesRef.current?.length && !noPointerEventsRef.current) {
        setNotes((notes) => notes.filter((note) => !selectedNotesRef.current.includes(note.id)))
        setSelectedNotes([])
        updateLaneStateRef.current()
      } else if (e.key === 'Shift') {
        shiftPressed.current = true
      }
    }
    function keyup(e) {
      if (e.key === 'Shift') {
        shiftPressed.current = false
      }
    }
    function selectNotes(e) {
      if (e.detail[id]) {
        setSelectedNotes(e.detail[id])
      } else {
        setSelectedNotes([])
      }
    }
    window.addEventListener('click', deselect)
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('selectNotes', selectNotes)
    window.addEventListener('mousemove', moveMouse)
    window.addEventListener('mousedown', mouseDown)
    return () => {
      window.removeEventListener('click', deselect)
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('selectNotes', selectNotes)
      window.removeEventListener('mousemove', moveMouse)
      window.removeEventListener('mousedown', mouseDown)
    }
  }, [id])

  // note creation

  const createNote = useGesture({
    onDragStart: ({ event, metaKey }) => {
      if (metaKey) {
        event.stopPropagation()
      }
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
        event.stopPropagation()
        // update note
        setNotes((notes) => {
          const notesCopy = notes.slice()
          notesCopy.find((note) => note.id === tempNote.current).width = Math.max(mx, 3)
          return notesCopy
        })
      }
    },
    onDragEnd: ({ event }) => {
      if (tempNote.current) {
        event.stopPropagation()
        setNoPointerEvents(false)
        updateLaneState()
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

  const onDragEnd = useCallback(
    (id, shiftKey) => {
      setNoPointerEvents(false)
      setGrabbing(false)
      if (!dragChanged.current && !shiftKey) {
        setSelectedNotes([id])
      } else if (dragChanged.current) {
        updateLaneState()
      }
      dragChanged.current = false
    },
    [updateLaneState]
  )

  const dragStart = useRef()
  const noteStart = useRef()
  const dragChanged = useRef(false)
  const dragNote = useGesture({
    onDragStart: ({ event }) => {
      event.stopPropagation()
      setNoPointerEvents(true)
      setGrabbing(true)
      addSelectedNotes(event.target?.id)
      dragStart.current = selectedNotesRef.current.map((id) => notes.find((note) => note.id === id).x)
      noteStart.current = selectedNotesRef.current.map((id) => notes.find((note) => note.id === id).midiNote)
    },
    onDrag: ({ movement: [mx, my], cancel, shiftKey, event }) => {
      event.stopPropagation()
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
      event.stopPropagation()
      onDragEnd(event.target?.id, shiftKey)
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
    onDrag: ({ movement: [mx], event }) => {
      event.stopPropagation()
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
      event.stopPropagation()
      onDragEnd(event.target?.parentElement?.id, shiftKey)
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
    onDrag: ({ movement: [mx], event }) => {
      event.stopPropagation()
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
      event.stopPropagation()
      onDragEnd(event.target?.parentElement?.id, shiftKey)
    },
  })

  // lane dragging

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

  // elements

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
    <div className="lane-container" style={{ '--lane-color': color }}>
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
  id: PropTypes.string,
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
