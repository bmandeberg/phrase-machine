import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { v4 as uuid } from 'uuid'
import classNames from 'classnames'
import { NOTE_HEIGHT, EIGHTH_WIDTH, calcLaneLength, LANE_COLORS, RATE_MULTS, mapLaneLength } from '../globals'
import Ticks from './Ticks'
import useNoteDrag from '../hooks/useNoteDrag'
import useLaneDrag from '../hooks/useLaneDrag'
import { noteString } from '../util'
import './Lane.scss'

export default function Lane({
  id,
  laneNum,
  colorIndex,
  lanePreset,
  setLaneState,
  delimiters,
  beatsPerBar,
  beatValue,
  grid,
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
  longestLane,
  updateLongestLane,
  updateSelectedNotes,
  setSelectNotes,
  addLane,
  deleteLane,
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
    updateSelectedNotes(id, selectedNotes)
    if (selectedNotesRef.current !== selectedNotes) {
      selectedNotesRef.current = selectedNotes
    }
  }, [id, selectedNotes, updateSelectedNotes])

  useEffect(() => {
    noPointerEventsRef.current = noPointerEvents
  }, [noPointerEvents])

  // lane state management

  const updateLaneStateRef = useRef(() => {})
  const updateLaneState = useCallback(() => {
    setTimeout(() => {
      setLaneState({
        id,
        laneLength,
        notes,
        viewRange: { min: minNote, max: maxNote },
        colorIndex,
      })
    })
  }, [setLaneState, id, laneLength, notes, minNote, maxNote, colorIndex])
  useEffect(() => {
    updateLaneStateRef.current = updateLaneState
  }, [updateLaneState])

  // update lane length when notes change
  useEffect(() => {
    const farthestX = Math.max(...notes.map((note) => note.x + note.width))
    setLaneLength(Math.max(calcLaneLength(farthestX, 1), calcLaneLength(window.innerWidth - 30)))
  }, [notes])

  useEffect(() => {
    updateLongestLane(laneLength, laneNum)
  }, [laneLength, laneNum, updateLongestLane])

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
        setSelectedNotes((selectedNotes) => {
          const newSelectedNotes = shiftPressed.current
            ? selectedNotes
                .concat(selectNotes[id])
                .filter((noteID) => !(selectedNotes.includes(noteID) && selectNotes[id].includes(noteID)))
            : selectNotes[id]
          selectedNotesRef.current = newSelectedNotes
          return newSelectedNotes
        })
      } else if (!shiftPressed.current || !Object.keys(selectNotes).length) {
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

  const { createNote } = useNoteDrag(
    id,
    lane,
    maxNote,
    minNote,
    snap,
    notes,
    setNotes,
    setSelectedNotes,
    setNoPointerEvents,
    updateLaneState,
    selectedNotesRef,
    shiftPressed,
    altPressed,
    createdNote,
    dragChanged,
    noteDrag,
    startNoteDrag,
    setSelectNotes
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
    const cOccluded = maxNote - (minNote + (12 - (minNote % 12))) < 7
    return [...Array(numNotes)].map((_d, i) => (
      <div
        key={uuid()}
        className={classNames('key', {
          'black-key': isBlackKey(maxNote - minNote - i + minNote),
          'e-key': !isBlackKey(maxNote - minNote - i + minNote) && nextKeyIsWhite(maxNote - minNote - i + minNote),
        })}>
        {!noC && i >= 7 && numNotes - 1 - i + minNote >= 24 && (numNotes - 1 - i + minNote) % 12 === 0 && (
          <p className="note-name">C{(numNotes - 1 - i + minNote - 24) / 12 + 1}</p>
        )}
        {(noC || cOccluded) && i === numNotes - 1 && <p className="note-name">{noteString(minNote)}</p>}
      </div>
    ))
  }, [maxNote, minNote])

  const laneEl = useMemo(
    () => (
      <div
        className="lane"
        ref={lane}
        style={{ '--lane-width': mapLaneLength(longestLane, grid) * RATE_MULTS[grid] * EIGHTH_WIDTH + 'px' }}>
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
        <Ticks longestLane={longestLane} beatsPerBar={beatsPerBar} beatValue={beatValue} grid={grid} />
      </div>
    ),
    [beatValue, beatsPerBar, createNote, grid, longestLane, maxNote, minNote]
  )

  const laneControls = useMemo(
    () => (
      <div className="lane-controls">
        <div title="Mute lane" className="lane-action mute"></div>
        <div title="Solo lane" className="lane-action solo"></div>
        <div title="Delete lane" className="lane-action trash" onClick={() => deleteLane(id)}></div>
        <div title="Duplicate lane" className="lane-action duplicate" onClick={() => addLane(id)}></div>
      </div>
    ),
    [addLane, deleteLane, id]
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
          <div className={classNames('note-drag-left', { outside: note.width < minNoteWidth })}></div>
          <div className={classNames('note-drag-right', { outside: note.width < minNoteWidth })}></div>
        </div>
      ))
  }, [notes, minNote, maxNote, selectedNotes, noPointerEvents, grabbing])

  return (
    <div
      id={id}
      className={classNames('lane-container', { first: laneNum === 0 })}
      style={{
        '--lane-color': LANE_COLORS[colorIndex].base,
        '--lane-color-hover': LANE_COLORS[colorIndex].hover,
        '--lane-color-lane': LANE_COLORS[colorIndex].lane,
        '--lane-color-light': LANE_COLORS[colorIndex].light,
        '--lane-color-lightest': LANE_COLORS[colorIndex].lightest,
      }}>
      <div className={classNames('keys', { grabbing })} {...dragLane()}>
        {keyEls}
      </div>
      {laneEl}
      <div className="notes">{noteEls}</div>
      <div className={classNames('lane-expander', { active: !grabbing })} {...dragLaneStart()}></div>
      {laneControls}
    </div>
  )
}
Lane.propTypes = {
  id: PropTypes.string,
  laneNum: PropTypes.number,
  colorIndex: PropTypes.number,
  lanePreset: PropTypes.object,
  setLaneState: PropTypes.func,
  delimiters: PropTypes.array,
  beatsPerBar: PropTypes.number,
  beatValue: PropTypes.number,
  grid: PropTypes.string,
  snap: PropTypes.string,
  noPointerEvents: PropTypes.bool,
  setNoPointerEvents: PropTypes.func,
  grabbing: PropTypes.bool,
  setGrabbing: PropTypes.func,
  shiftPressed: PropTypes.object,
  altPressed: PropTypes.object,
  selectNotes: PropTypes.object,
  startNoteDrag: PropTypes.object,
  noteDrag: PropTypes.object,
  longestLane: PropTypes.number,
  updateLongestLane: PropTypes.func,
  updateSelectedNotes: PropTypes.func,
  setSelectNotes: PropTypes.func,
  addLane: PropTypes.func,
  deleteLane: PropTypes.func,
}

const blackKeys = [false, true, false, true, false, false, true, false, true, false, true, false]
function isBlackKey(i) {
  return blackKeys[i % 12]
}

function nextKeyIsWhite(i) {
  return blackKeys[(i % 12) + 1]
}
