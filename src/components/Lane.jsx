import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { v4 as uuid } from 'uuid'
import classNames from 'classnames'
import WebMidi from 'webmidi'
import * as Tone from 'tone'
import { NOTE_HEIGHT, EIGHTH_WIDTH, calcLaneLength, LANE_COLORS, RATE_MULTS, mapLaneLength } from '../globals'
import Ticks from './Ticks'
import useNoteDrag from '../hooks/useNoteDrag'
import useLaneDrag from '../hooks/useLaneDrag'
import { noteString, getDelimiterIndex, timeToPixels, pixelsToTime, scaleToRange } from '../util'
import './Lane.scss'

export default function Lane({
  id,
  laneNum,
  colorIndex,
  lanePreset,
  setLaneState,
  draggingDelimiter,
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
  changingProbability,
  setMuteSolo,
  anyLaneSoloed,
  chosen,
  playing,
  midiOutRef,
  instrumentOn,
  instrument,
  instrumentType,
  cancelClick,
  targetNoteStart,
  targetNoteUpdate,
  setTargetNoteUpdate,
  laneMinMax,
  onlyAudibleLane,
}) {
  const [laneLength, setLaneLength] = useState(lanePreset.laneLength)
  const [notes, updateNotes] = useState(lanePreset.notes)
  const [minNote, setMinNote] = useState(lanePreset.viewRange.min)
  const [maxNote, setMaxNote] = useState(lanePreset.viewRange.max)
  const [mute, setMute] = useState(lanePreset.mute)
  const [solo, setSolo] = useState(lanePreset.solo)
  const [midiChannels, setMidiChannels] = useState()
  const lane = useRef()
  const [selectedNotes, setSelectedNotes] = useState([]) // list of note IDs
  const [highlightNotes, setHighlightNotes] = useState([])
  const selectedNotesRef = useRef(selectedNotes)
  const noPointerEventsRef = useRef(noPointerEvents)
  const mouseMoved = useRef(false)
  const createdNote = useRef(false)
  const dragChanged = useRef(false)
  const delimiterProbabilities = useRef()

  const chosenRef = useRef(chosen)
  useEffect(() => {
    chosenRef.current = chosen
  }, [chosen])

  const midiChannelsRef = useRef(midiChannels)
  useEffect(() => {
    midiChannelsRef.current = midiChannels
  }, [midiChannels])

  const instrumentOnRef = useRef(instrumentOn)
  useEffect(() => {
    instrumentOnRef.current = instrumentOn
  }, [instrumentOn])

  const instrumentTypeRef = useRef(instrumentType)
  useEffect(() => {
    instrumentTypeRef.current = instrumentType
  }, [instrumentType])

  // notes loop

  // create the part
  const part = useMemo(
    () =>
      new Tone.Part((time, note) => {
        // play note if lane is chosen
        if (chosenRef.current?.lane === id) {
          // note data
          const channel = midiChannelsRef.current[note.midiNote] || 'all'
          const noteName = noteString(note.midiNote)
          const midiOutObj = midiOutRef.current ? WebMidi.getOutputByName(midiOutRef.current) : null
          const clockOffset = WebMidi.time - Tone.immediate() * 1000
          // note length
          const noteDuration = note.widthSnap ? { [note.widthSnap]: note.widthSnapNumber } : pixelsToTime(note.width)
          const noteDurationSeconds = new Tone.Time(noteDuration).toSeconds()
          // play instrument
          if (
            instrumentOnRef.current &&
            instrument.current &&
            (instrumentTypeRef.current === 'synth' || instrument.current.loaded)
          ) {
            instrument.current.triggerAttackRelease(noteName, noteDurationSeconds, time, note.velocity)
          }
          // play MIDI note
          if (midiOutObj) {
            midiOutObj.playNote(noteName, channel, {
              time: time * 1000 + clockOffset,
              velocity: note.velocity,
              duration: noteDurationSeconds,
            })
          }
          // highlight playing note
          setHighlightNotes((highlightNotes) => highlightNotes.concat([note.id]))
          setTimeout(() => {
            setHighlightNotes((highlightNotes) => highlightNotes.filter((noteID) => noteID !== note.id))
          }, 100)
        }
      }).start(0),
    [id, instrument, midiOutRef]
  )

  // update the part events when notes change
  useEffect(() => {
    part.clear()
    for (const note of notes) {
      part.add(note.xSnap ? { [note.xSnap]: note.xSnapNumber } : pixelsToTime(note.x), note)
    }
  }, [notes, part])

  useEffect(() => {
    updateSelectedNotes(id, selectedNotes)
    if (selectedNotesRef.current !== selectedNotes) {
      selectedNotesRef.current = selectedNotes
    }
  }, [id, selectedNotes, updateSelectedNotes])

  useEffect(() => {
    noPointerEventsRef.current = noPointerEvents
  }, [noPointerEvents])

  // play note instantaneously

  const playNote = useCallback(
    (note) => {
      // note data
      const channel = midiChannelsRef.current[note.midiNote] || 'all'
      const noteName = noteString(note.midiNote)
      const midiOutObj = midiOutRef.current ? WebMidi.getOutputByName(midiOutRef.current) : null
      const noteDurationSeconds = 0.2
      // play instrument
      if (
        instrumentOnRef.current &&
        instrument.current &&
        (instrumentTypeRef.current === 'synth' || instrument.current.loaded)
      ) {
        instrument.current.triggerAttackRelease(noteName, noteDurationSeconds, undefined, note.velocity)
      }
      // play MIDI note
      if (midiOutObj) {
        midiOutObj.playNote(noteName, channel, {
          velocity: note.velocity,
          duration: noteDurationSeconds,
        })
      }
    },
    [instrument, midiOutRef]
  )

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
        mute,
        solo,
        midiChannels,
      })
    })
  }, [setLaneState, id, laneLength, notes, minNote, maxNote, colorIndex, mute, solo, midiChannels])
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
      setMute(lanePreset.mute)
      setSolo(lanePreset.solo)
      setMidiChannels(lanePreset.midiChannels)
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

  useEffect(() => {
    if (laneMinMax?.id === id) {
      setMinNote(laneMinMax.minNote)
      setMaxNote(laneMinMax.maxNote)
    }
  }, [id, laneMinMax])

  const updateMuteSolo = useCallback(
    (id, update) => {
      if ('mute' in update) {
        setMute(update.mute)
      }
      if ('solo' in update) {
        setSolo(update.solo)
      }
      setMuteSolo(id, update)
    },
    [setMuteSolo]
  )

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
      part.clear()
      part.dispose()
      window.removeEventListener('click', deselect)
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('mousemove', moveMouse)
      window.removeEventListener('mousedown', mouseDown)
    }
  }, [id, part, setNotes])

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
    setSelectNotes,
    playNote,
    targetNoteStart,
    targetNoteUpdate,
    setTargetNoteUpdate
  )

  // lane dragging

  const { dragLaneStart } = useLaneDrag(
    minNote,
    setMinNote,
    maxNote,
    setMaxNote,
    setNoPointerEvents,
    setGrabbing,
    updateLaneState,
    dragChanged,
    cancelClick
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
        })}
        note={maxNote - minNote - i + minNote}
        onClick={() => {
          if (!cancelClick.current) {
            playNote({ midiNote: maxNote - minNote - i + minNote, velocity: 1 })
          } else {
            cancelClick.current = false
          }
        }}>
        {!noC && i >= 7 && numNotes - 1 - i + minNote >= 24 && (numNotes - 1 - i + minNote) % 12 === 0 && (
          <p className="note-name">C{(numNotes - 1 - i + minNote - 24) / 12 + 1}</p>
        )}
        {(noC || cOccluded) && i === numNotes - 1 && <p className="note-name">{noteString(minNote)}</p>}
      </div>
    ))
  }, [cancelClick, maxNote, minNote, playNote])

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
        <div
          title="Mute lane"
          className={classNames('lane-action mute', { active: mute })}
          onClick={() => updateMuteSolo(id, { mute: !mute })}></div>
        <div
          title="Solo lane"
          className={classNames('lane-action solo', { active: solo })}
          onClick={() => updateMuteSolo(id, { solo: !solo })}></div>
        <div title="Delete lane" className="lane-action trash" onClick={() => deleteLane(id)}></div>
        <div title="Duplicate lane" className="lane-action duplicate" onClick={() => addLane(id)}></div>
      </div>
    ),
    [addLane, deleteLane, id, mute, updateMuteSolo, solo]
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
            playing,
            highlight: highlightNotes.includes(note.id),
          })}
          style={{
            left: note.x,
            bottom: (note.midiNote - minNote) * NOTE_HEIGHT + 1,
            width: note.width + 1,
            opacity: scaleToRange(note.velocity, 0, 1, 0.5, 1),
          }}>
          <div className={classNames('note-drag-left', { outside: note.width < minNoteWidth })}></div>
          <div className={classNames('note-drag-right', { outside: note.width < minNoteWidth })}></div>
        </div>
      ))
  }, [notes, minNote, maxNote, selectedNotes, noPointerEvents, grabbing, playing, highlightNotes])

  const delimiterProbabilityEls = useMemo(() => {
    const laneHeight = (maxNote - minNote + 1) * NOTE_HEIGHT
    return delimiters.map((delimiter, i) => (
      <div
        key={uuid()}
        className={classNames('delimiter-probability', {
          disabled: draggingDelimiter,
          hidden: delimiter.hidden,
        })}
        style={{
          left: delimiter.snap ? timeToPixels({ [delimiter.snap]: delimiter.snapNumber }) : delimiter.x,
        }}>
        <div className="delimiter-probability-bar" style={{ height: laneHeight * delimiter.lanes[id] }}>
          <div
            className={classNames('delimiter-probability-number', {
              'number-below': (1 - delimiter.lanes[id]) * laneHeight <= 16,
            })}>
            {delimiter.lanes[id].toFixed(2)}
          </div>
          <div
            className={classNames('delimiter-probability-bar-drag', { disabled: onlyAudibleLane })}
            delimiter-index={i}
            lane-id={id}
            full-height={laneHeight}></div>
        </div>
      </div>
    ))
  }, [delimiters, draggingDelimiter, id, maxNote, minNote, onlyAudibleLane])

  useEffect(() => {
    const probabilityEls = delimiterProbabilities.current.querySelectorAll('.delimiter-probability')
    if (changingProbability !== null && delimiterProbabilities.current) {
      probabilityEls[changingProbability].classList.add('open')
    } else {
      for (const p of probabilityEls) {
        p.classList.remove('open')
      }
    }
  }, [changingProbability])

  const highlightDelimiter = useMemo(() => {
    if (chosen?.lane !== id) {
      return (
        <div className="delimiter-highlight-container">
          <div className="delimiter-highlight" style={{ left: 0, right: 14 }}></div>
        </div>
      )
    } else {
      const currentDelimiterIndex = getDelimiterIndex(delimiters)
      const leftCurtain =
        currentDelimiterIndex > 0 ? (
          <div className="delimiter-highlight" style={{ left: 0, width: delimiters[currentDelimiterIndex].x }}></div>
        ) : null
      const rightCurtain =
        currentDelimiterIndex < delimiters.length - 1 ? (
          <div
            className="delimiter-highlight"
            style={{
              left: delimiters[currentDelimiterIndex + 1].x,
              width: longestLane * EIGHTH_WIDTH - delimiters[currentDelimiterIndex + 1].x,
            }}></div>
        ) : null
      return (
        <div className="delimiter-highlight-container">
          {leftCurtain}
          {rightCurtain}
        </div>
      )
    }
  }, [chosen, delimiters, id, longestLane])

  return (
    <div
      id={'lane-' + id}
      className={classNames('lane-container', { first: laneNum === 0, mute: mute || (anyLaneSoloed && !solo) })}
      style={{
        '--lane-color': LANE_COLORS[colorIndex].base,
        '--lane-color-hover': LANE_COLORS[colorIndex].hover,
        '--lane-color-lane': LANE_COLORS[colorIndex].lane,
        '--lane-color-light': LANE_COLORS[colorIndex].light,
        '--lane-color-lightest': LANE_COLORS[colorIndex].lightest,
        '--lane-color-dark': LANE_COLORS[colorIndex].dark,
        '--lane-color-white': LANE_COLORS[colorIndex].white,
        '--lane-color-gray': LANE_COLORS[colorIndex].gray,
      }}>
      <div className={classNames('keys', { grabbing })} min-note={minNote} max-note={maxNote} lane-id={id}>
        {keyEls}
      </div>
      {laneEl}
      <div className="notes">{noteEls}</div>
      <div className="delimiter-probabilities" ref={delimiterProbabilities}>
        {delimiterProbabilityEls}
      </div>
      <div className={classNames('lane-expander', { active: !grabbing })} {...dragLaneStart()}></div>
      {laneControls}
      {playing && highlightDelimiter}
    </div>
  )
}
Lane.propTypes = {
  id: PropTypes.string,
  laneNum: PropTypes.number,
  colorIndex: PropTypes.number,
  lanePreset: PropTypes.object,
  setLaneState: PropTypes.func,
  draggingDelimiter: PropTypes.number,
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
  changingProbability: PropTypes.number,
  setMuteSolo: PropTypes.func,
  anyLaneSoloed: PropTypes.bool,
  chosen: PropTypes.object,
  playing: PropTypes.bool,
  midiOutRef: PropTypes.object,
  instrument: PropTypes.object,
  instrumentOn: PropTypes.bool,
  instrumentType: PropTypes.string,
  cancelClick: PropTypes.object,
  targetNoteStart: PropTypes.object,
  targetNoteUpdate: PropTypes.object,
  setTargetNoteUpdate: PropTypes.func,
  laneMinMax: PropTypes.object,
  onlyAudibleLane: PropTypes.bool,
}

const blackKeys = [false, true, false, true, false, false, true, false, true, false, true, false]
function isBlackKey(i) {
  return blackKeys[i % 12]
}

function nextKeyIsWhite(i) {
  return blackKeys[(i % 12) + 1]
}
