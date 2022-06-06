import React, { useState, useMemo, useRef } from 'react'
import { v4 as uuid } from 'uuid'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { useGesture } from 'react-use-gesture'
import { NOTE_HEIGHT } from '../globals'
import './Lane.scss'

export default function Lane({ id, color, laneNum, lanePreset, setLaneState }) {
  const [measures, setMeasures] = useState(lanePreset.measures)
  const [notes, setNotes] = useState(lanePreset.notes)
  const [minNote, setMinNote] = useState(lanePreset.viewRange.min)
  const [maxNote, setMaxNote] = useState(lanePreset.viewRange.max)
  const tempNote = useRef(null)
  const lane = useRef()

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
            notesCopy.push({
              id: tempNote.current,
              midiNote: laneNum + minNote,
              velocity: 1,
              x: ix - lane.current?.getBoundingClientRect().left,
              width: mx,
            })
            return notesCopy
          })
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
      }
    },
  })

  const measuresEls = useMemo(
    () =>
      measures.map((m) =>
        m ? (
          <div className="measure" key={uuid()}>
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
              {[...Array(7)].map((_d, i) => (
                <div key={uuid()} className={classNames('tick')}></div>
              ))}
            </div>
          </div>
        ) : (
          <div key={uuid()} className="empty-measure"></div>
        )
      ),
    [createNote, maxNote, measures, minNote]
  )

  return (
    <div className="lane" style={{ '--lane-color': color, '--note-height': NOTE_HEIGHT + 'px' }}>
      <div className="keys">
        {[...Array(maxNote - minNote + 1)].map((_d, i) => (
          <div
            key={uuid()}
            className={classNames('key', {
              'black-key': isBlackKey(i),
              'e-key': !isBlackKey(i) && nextKeyIsWhite(i),
            })}></div>
        ))}
      </div>
      <div className="measures" ref={lane}>
        {measuresEls}
      </div>
      <div className="notes">
        {notes.map((note) => (
          <div
            key={note.x}
            className="note"
            style={{ left: note.x, bottom: (note.midiNote - minNote) * NOTE_HEIGHT + 1, width: note.width }}></div>
        ))}
      </div>
    </div>
  )
}
Lane.propTypes = {
  color: PropTypes.string,
  laneNum: PropTypes.number,
  lanePreset: PropTypes.object,
  setLaneState: PropTypes.func,
}

const blackKeys = [false, true, false, true, false, false, true, false, true, false, true, false]
function isBlackKey(i) {
  return blackKeys[i]
}

function nextKeyIsWhite(i) {
  return !blackKeys[i + 1]
}
