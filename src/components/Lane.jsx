import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { v4 as uuid } from 'uuid'
import classNames from 'classnames'
import { NOTE_HEIGHT, EIGHTH_WIDTH } from '../globals'
import useNoteDrag from '../hooks/useNoteDrag'
import useLaneDrag from '../hooks/useLaneDrag'
import { noteString } from '../util'
import './Lane.scss'

export default function Lane({ id, color, laneNum, lanePreset, setLaneState, beatsPerBar, beatValue, snap }) {
  const [laneLength, setLaneLength] = useState(lanePreset.laneLength)
  const [delimiters, setDelimiters] = useState(lanePreset.delimiters)
  const [notes, setNotes] = useState(lanePreset.notes)
  const [minNote, setMinNote] = useState(lanePreset.viewRange.min)
  const [maxNote, setMaxNote] = useState(lanePreset.viewRange.max)
  const lane = useRef()
  const [selectedNotes, setSelectedNotes] = useState([]) // list of note IDs
  const selectedNotesRef = useRef(selectedNotes)
  const [noPointerEvents, setNoPointerEvents] = useState(false)
  const noPointerEventsRef = useRef(noPointerEvents)
  const [grabbing, setGrabbing] = useState(false)
  const shiftPressed = useRef(false)
  const mouseMoved = useRef(false)
  const createdNote = useRef(false)
  const dragChanged = useRef(false)

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
      laneLength,
      delimiters,
      notes,
      viewRange: { min: minNote, max: maxNote },
    })
  }, [delimiters, id, maxNote, laneLength, minNote, notes, setLaneState])
  useEffect(() => {
    updateLaneStateRef.current = updateLaneState
  }, [updateLaneState])

  useEffect(() => {
    setLaneLength(lanePreset.laneLength)
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
        !e.target.parentElement?.classList.contains('note') &&
        selectedNotesRef.current.length &&
        !mouseMoved.current &&
        !createdNote.current
      ) {
        setSelectedNotes([])
      }
      createdNote.current = false
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

  // note creation + dragging

  const { createNote, dragNote, dragNoteLeft, dragNoteRight } = useNoteDrag(
    lane,
    maxNote,
    minNote,
    snap,
    notes,
    setNotes,
    setSelectedNotes,
    setNoPointerEvents,
    setGrabbing,
    updateLaneState,
    selectedNotesRef,
    shiftPressed,
    createdNote,
    dragChanged
  )

  // lane dragging

  const { dragLaneStart, dragLane } = useLaneDrag(
    minNote,
    setMinNote,
    maxNote,
    setMaxNote,
    setNoPointerEvents,
    setGrabbing,
    updateLaneState,
    dragChanged
  )

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

  const laneEl = useMemo(
    () => (
      <div className="lane" ref={lane} style={{ '--lane-width': laneLength * EIGHTH_WIDTH + 'px' }}>
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
          {[...Array(laneLength)].map((_d, i) => (
            <div
              key={uuid()}
              className={classNames('tick', {
                minor: beatValue === 4 && i % 2 === 0,
                major: i % (beatsPerBar * (beatValue === 4 ? 2 : 1)) === 0,
              })}></div>
          ))}
        </div>
      </div>
    ),
    [beatValue, beatsPerBar, createNote, laneLength, maxNote, minNote]
  )

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
      {laneEl}
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
  beatsPerBar: PropTypes.number,
  beatValue: PropTypes.number,
  snap: PropTypes.string,
}

const blackKeys = [false, true, false, true, false, false, true, false, true, false, true, false]
function isBlackKey(i) {
  return blackKeys[i % 12]
}

function nextKeyIsWhite(i) {
  return blackKeys[(i % 12) + 1]
}
