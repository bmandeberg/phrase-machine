import React, { useState, useMemo, useRef, useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { useGesture } from 'react-use-gesture'
import { NOTE_HEIGHT, MEASURE_WIDTH } from '../globals'
import './Lane.scss'

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
  const [creatingNote, setCreatingNote] = useState(false)

  useEffect(() => {
    selectedNotesRef.current = selectedNotes
  }, [selectedNotes])

  useEffect(() => {
    function deselect(e) {
      if (!e.target.classList.contains('note') && selectedNotesRef.current.length) {
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
    onDrag: ({ movement: [mx, my], initial: [ix, iy], event }) => {
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
          setCreatingNote(true)
        }
      } else if (tempNote.current) {
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
        setCreatingNote(false)
      }
    },
  })

  const keyEls = useMemo(
    () =>
      [...Array(maxNote - minNote + 1)].map((_d, i) => (
        <div
          key={uuid()}
          className={classNames('key', {
            'black-key': isBlackKey(i),
            'e-key': !isBlackKey(i) && nextKeyIsWhite(i),
          })}></div>
      )),
    [maxNote, minNote]
  )

  const noteEls = useMemo(
    () =>
      notes.map((note) => (
        <div
          key={note.x}
          className={classNames('note', { selected: selectedNotes.includes(note.id), 'no-pointer': creatingNote })}
          style={{ left: note.x, bottom: (note.midiNote - minNote) * NOTE_HEIGHT + 1, width: note.width }}
          onMouseDown={() => setSelectedNotes([note.id])}></div>
      )),
    [creatingNote, minNote, notes, selectedNotes]
  )

  return (
    <div className="lane-container" style={{ '--lane-color': color, '--note-height': NOTE_HEIGHT + 'px' }}>
      <div className="keys">{keyEls}</div>
      <div className="lane" ref={lane} style={{ width: measures * MEASURE_WIDTH }}>
        {[...Array(maxNote - minNote + 1)].map((_d, i) => (
          <div
            key={uuid()}
            {...createNote()}
            lane-num={i}
            className={classNames('note-lane', {
              'black-key': isBlackKey(i),
              'e-key': !isBlackKey(i) && nextKeyIsWhite(i),
            })}></div>
        ))}
        <div className="ticks">
          {[...Array(7 * measures)].map((_d, i) => (
            <div key={uuid()} className={classNames('tick')}></div>
          ))}
        </div>
      </div>
      <div className="notes">{noteEls}</div>
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
  return blackKeys[i]
}

function nextKeyIsWhite(i) {
  return !blackKeys[i + 1]
}
