import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { v4 as uuid } from 'uuid'
import classNames from 'classnames'
import { NOTE_HEIGHT, EIGHTH_WIDTH, calcLaneLength, LANE_COLORS } from '../globals'
import useNoteDrag from '../hooks/useNoteDrag'
import useLaneDrag from '../hooks/useLaneDrag'
import { noteString } from '../util'
import './Lane.scss'

export default function Lane({
  id,
  laneNum,
  lanePreset,
  setLaneState,
  delimiters,
  beatsPerBar,
  beatValue,
  snap,
  noPointerEvents,
  setNoPointerEvents,
  grabbing,
  setGrabbing,
  shiftPressed,
  altPressed,
  selectNotes,
  startNoteDrag,
  noteDrag,
}) {
  const [laneLength, setLaneLength] = useState(lanePreset.laneLength)
  const [notes, updateNotes] = useState(lanePreset.notes)
  const [minNote, setMinNote] = useState(lanePreset.viewRange.min)
  const [maxNote, setMaxNote] = useState(lanePreset.viewRange.max)
  const lane = useRef()
  const [selectedNotes, setSelectedNotes] = useState([]) // list of note IDs
  const selectedNotesRef = useRef(selectedNotes)
  const noPointerEventsRef = useRef(noPointerEvents)
  const mouseMoved = useRef(false)
  const createdNote = useRef(false)
  const dragChanged = useRef(false)

  useEffect(() => {
    if (selectedNotesRef.current !== selectedNotes) {
      selectedNotesRef.current = selectedNotes
    }
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
      notes,
      viewRange: { min: minNote, max: maxNote },
    })
  }, [id, maxNote, laneLength, minNote, notes, setLaneState])
  useEffect(() => {
    updateLaneStateRef.current = updateLaneState
  }, [updateLaneState])

  // update lane length when notes change
  useEffect(() => {
    const farthestX = Math.max(...notes.map((note) => note.x + note.width))
    setLaneLength(Math.max(calcLaneLength(farthestX, 1), calcLaneLength(window.innerWidth - 30)))
  }, [notes])

  // sort notes while setting them
  const setNotes = useCallback((update) => {
    const notesSort = (a, b) => a.x - b.x
    if (typeof update === 'function') {
      updateNotes((notes) => {
        const newNotes = update(notes)
        return newNotes.sort(notesSort)
      })
    } else if (typeof update === 'object' && update.sort) {
      updateNotes(update.sort(notesSort))
    }
  }, [])

  useEffect(() => {
    if (lanePreset) {
      setLaneLength(lanePreset.laneLength)
      setNotes(lanePreset.notes)
      setMinNote(lanePreset.viewRange.min)
      setMaxNote(lanePreset.viewRange.max)
    }
  }, [lanePreset, setNotes])

  useEffect(() => {
    if (selectNotes) {
      if (selectNotes[id]) {
        if (!(selectNotes[id].length === 1 && selectedNotesRef.current.includes(selectNotes[id][0]))) {
          setSelectedNotes((selectedNotes) => {
            const newSelectedNotes = shiftPressed.current ? selectedNotes.concat(selectNotes[id]) : selectNotes[id]
            selectedNotesRef.current = newSelectedNotes
            return newSelectedNotes
          })
        }
      } else {
        selectedNotesRef.current = []
        setSelectedNotes([])
      }
    }
  }, [id, selectNotes, shiftPressed])

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
      }
    }
    window.addEventListener('click', deselect)
    window.addEventListener('keydown', keydown)
    window.addEventListener('mousemove', moveMouse)
    window.addEventListener('mousedown', mouseDown)
    return () => {
      window.removeEventListener('click', deselect)
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('mousemove', moveMouse)
      window.removeEventListener('mousedown', mouseDown)
    }
  }, [id, setNotes, shiftPressed])

  // note creation + dragging

  const { createNote, dragNoteLeft, dragNoteRight } = useNoteDrag(
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
    altPressed,
    createdNote,
    dragChanged,
    noteDrag,
    startNoteDrag
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
          {[...Array(laneLength)].map((_d, i) => {
            const eighthsPerMeasure = beatsPerBar * (beatValue === 4 ? 2 : 1)
            const major = i % eighthsPerMeasure === 0
            return (
              <div
                key={uuid()}
                className={classNames('tick', {
                  minor: beatValue === 4 && i % 2 === 0,
                  major,
                })}>
                {major && <div className="tick-measure-num">{Math.floor(i / eighthsPerMeasure) + 1}</div>}
              </div>
            )
          })}
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
  }, [notes, minNote, maxNote, selectedNotes, noPointerEvents, grabbing, dragNoteLeft, dragNoteRight])

  return (
    <div
      id={id}
      className={classNames('lane-container', { first: laneNum === 0 })}
      style={{
        '--lane-color': LANE_COLORS[laneNum].base,
        '--lane-color-hover': LANE_COLORS[laneNum].hover,
        '--lane-color-lane': LANE_COLORS[laneNum].lane,
        '--lane-color-light': LANE_COLORS[laneNum].light,
        '--lane-color-lightest': LANE_COLORS[laneNum].lightest,
      }}>
      <div className={classNames('keys', { grabbing })} {...dragLane()}>
        {keyEls}
      </div>
      {laneEl}
      <div className="notes">{noteEls}</div>
      <div className={classNames('lane-expander', { active: !grabbing })} {...dragLaneStart()}></div>
    </div>
  )
}
Lane.propTypes = {
  id: PropTypes.string,
  laneNum: PropTypes.number,
  lanePreset: PropTypes.object,
  setLaneState: PropTypes.func,
  delimiters: PropTypes.array,
  beatsPerBar: PropTypes.number,
  beatValue: PropTypes.number,
  snap: PropTypes.string,
  noPointerEvents: PropTypes.bool,
  setNoPointerEvents: PropTypes.func,
  grabbing: PropTypes.bool,
  setGrabbing: PropTypes.func,
  shiftPressed: PropTypes.object,
  altPressed: PropTypes.object,
  selectNotes: PropTypes.object,
  startNoteDrag: PropTypes.string,
  noteDrag: PropTypes.object,
}

const blackKeys = [false, true, false, true, false, false, true, false, true, false, true, false]
function isBlackKey(i) {
  return blackKeys[i % 12]
}

function nextKeyIsWhite(i) {
  return blackKeys[(i % 12) + 1]
}
