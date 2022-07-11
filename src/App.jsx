import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { useGesture } from 'react-use-gesture'
import classNames from 'classnames'
import { v4 as uuid } from 'uuid'
import {
  DEFAULT_PRESET,
  EIGHTH_WIDTH,
  NOTE_HEIGHT,
  KEYS_WIDTH,
  RATE_MULTS,
  MIN_DELIMITER_WIDTH,
  MAX_LANES,
  DEFAULT_LANE,
} from './globals'
import Lane from './components/Lane'
import Header from './components/Header'
import Delimiter from './components/Delimiter'
import Ticks from './components/Ticks'
import { boxesIntersect, timeToPixels, snapPixels, constrain } from './util'
import addIcon from './assets/add-icon.svg'
import addIconHover from './assets/add-icon-hover.svg'
import './App.scss'

// load/set presets
if (!window.localStorage.getItem('phrasePresets')) {
  window.localStorage.setItem('phrasePresets', DEFAULT_PRESET)
}

export default function App() {
  const [uiState, setUIState] = useState(JSON.parse(window.localStorage.getItem('phrasePresets')))
  const [delimiters, setDelimiters] = useState(uiState.delimiters)
  const [snap, setSnap] = useState(uiState.snap)
  const [beatsPerBar, setBeatsPerBar] = useState(uiState.beatsPerBar)
  const [beatValue, setBeatValue] = useState(uiState.beatValue)
  const [noPointerEvents, setNoPointerEvents] = useState(false)
  const [grabbing, setGrabbing] = useState(false)
  const [ewResizing, setEwResizing] = useState(false)
  const [selectNotes, setSelectNotes] = useState({})
  const [noteDrag, setNoteDrag] = useState({})
  const [startNoteDrag, setStartNoteDrag] = useState(null)
  const shiftPressed = useRef(false)
  const altPressed = useRef(false)
  const metaPressed = useRef(false)
  const mainContainerRef = useRef()
  const lanesRef = useRef()

  useEffect(() => {
    function keydown(e) {
      if (e.key === 'Shift') {
        shiftPressed.current = true
      } else if (e.key === 'Alt') {
        altPressed.current = true
      } else if (e.key === 'Meta') {
        metaPressed.current = true
      }
    }
    function keyup(e) {
      if (e.key === 'Shift') {
        shiftPressed.current = false
      } else if (e.key === 'Alt') {
        altPressed.current = false
      } else if (e.key === 'Meta') {
        metaPressed.current = false
      }
    }
    window.addEventListener('keyup', keyup)
    window.addEventListener('keydown', keydown)
    return () => {
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('keydown', keydown)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('phrasePresets', JSON.stringify(uiState))
  }, [uiState])

  useEffect(() => {
    setUIState((uiState) =>
      Object.assign({}, uiState, {
        snap,
        beatsPerBar,
        beatValue,
      })
    )
  }, [beatValue, beatsPerBar, snap])

  // transport

  const [playing, setPlaying] = useState(false)
  const [tempo, setTempo] = useState(uiState.tempo)
  useEffect(() => {
    if (Tone.Transport.bpm.value !== tempo) {
      Tone.Transport.bpm.value = tempo
    }
  }, [tempo])

  useEffect(() => {
    Tone.Transport.timeSignature = [beatsPerBar, beatValue]
  }, [beatValue, beatsPerBar])

  // global dragging

  const [selectingDimensions, setSelectingDimensions] = useState(null)
  const dragSelecting = useRef(false)
  const draggingNote = useRef(false)
  const [draggingDelimiter, setDraggingDelimiter] = useState(null)
  const wasDraggingDelimiter = useRef(null)
  const delimiterDragHover = useRef(null)
  const dragStart = useRef()
  const snapStart = useRef()
  const dragChanged = useRef()
  const dragDirection = useRef()
  const overrideDefault = useRef()
  const dragNotes = useGesture({
    onDragStart: ({ initial: [x, y], metaKey, event }) => {
      if (!metaKey && event.button === 0) {
        if (event.target.classList.contains('note')) {
          // dragging notes
          draggingNote.current = true
          setNoPointerEvents(true)
          setGrabbing(true)
          setSelectNotes({ [event.target.closest('.lane-container').id]: [event.target.id] })
          setStartNoteDrag(event.target.id)
        } else if (event.target.closest('.delimiter') && !event.target.classList.contains('delimiter-x')) {
          // dragging delimiters
          setNoPointerEvents(true)
          setEwResizing(true)
          setSelectNotes({})
          const delimiterIndex = +event.target.closest('.delimiter').getAttribute('index')
          setDraggingDelimiter(delimiterIndex)
          wasDraggingDelimiter.current = delimiterIndex
          const delimiter = delimiters[delimiterIndex]
          dragStart.current = delimiter.snap ? timeToPixels({ [delimiter.snap]: delimiter.snapNumber }) : delimiter.x
          snapStart.current = delimiter.snap
        } else {
          // drag selecting
          dragSelecting.current = true
          setSelectingDimensions({
            x,
            y,
            width: 0,
            height: 0,
          })
        }
      }
    },
    onDrag: ({ movement: [mx, my], direction: [dx], initial: [ix, iy], metaKey }) => {
      if (!metaKey) {
        if (dragSelecting.current) {
          // drag selecting
          const newDimensions = { width: Math.abs(mx), height: Math.abs(my) }
          newDimensions.x = (mx > 0 ? ix : ix - newDimensions.width) + mainContainerRef?.current?.scrollLeft
          newDimensions.y = (my > 0 ? iy : iy - newDimensions.height) + mainContainerRef?.current?.scrollTop
          setSelectingDimensions(newDimensions)
        } else if (draggingNote.current) {
          // dragging notes
          setNoteDrag({
            movement: [mx, my],
            direction: [dx],
          })
        } else if (draggingDelimiter !== null) {
          // dragging delimiters
          dragChanged.current = mx
          if (dragStart.current !== undefined && (Math.abs(mx) > 2 || overrideDefault.current)) {
            if (dx) {
              dragDirection.current = dx
            }
            const lowerSnapBound = snap && snapPixels(dragStart.current, snap, -1).px
            const upperSnapBound = snap && lowerSnapBound + EIGHTH_WIDTH * RATE_MULTS[snap]
            const realX = dragStart.current + mx
            if (snap && !snapStart.current && (realX < lowerSnapBound || realX > upperSnapBound)) {
              snapStart.current = snap
            }
            const direction = !snapStart.current ? dragDirection.current : 0
            const { px, snapNumber } = snapPixels(realX, snap, direction)
            const minX = draggingDelimiter * MIN_DELIMITER_WIDTH
            const maxX = longestLane * EIGHTH_WIDTH - (delimiters.length - draggingDelimiter) * MIN_DELIMITER_WIDTH
            let x = px
            let snapX = snap
            let snapNumberX = snapNumber
            if (x < minX || x > maxX) {
              snapX = null
              snapNumberX = null
            }
            x = constrain(x, minX, maxX)
            if (snap && x !== dragStart.current) {
              overrideDefault.current = true
            }
            // set delimiter positions
            if (x !== delimiters[draggingDelimiter].x) {
              const delimitersCopy = delimiters.slice()
              delimitersCopy[draggingDelimiter] = Object.assign(delimitersCopy[draggingDelimiter], {
                snap: snapX,
                snapNumber: snapNumberX,
                x,
              })
              // push other delimiters if this one is running up against them
              for (let i = draggingDelimiter - 1; i > 0; i--) {
                const maxX = x - (draggingDelimiter - i) * MIN_DELIMITER_WIDTH
                if (delimiters[i].x > maxX) {
                  delimiters[i].snap = null
                  delimiters[i].x = maxX
                }
              }
              for (let i = draggingDelimiter + 1; i < delimiters.length; i++) {
                const minX = x + (i - draggingDelimiter) * MIN_DELIMITER_WIDTH
                if (delimiters[i].x < minX) {
                  delimiters[i].snap = null
                  delimiters[i].x = minX
                }
              }
              setDelimiters(delimitersCopy)
            }
          }
        }
      }
    },
    onDragEnd: ({ event }) => {
      if (event.button === 0) {
        if (dragSelecting.current) {
          // drag selecting
          const selectedNotes = {}
          // gather notes that intersect with selection bounds
          mainContainerRef.current?.querySelectorAll('.lane-container').forEach((lane, i) => {
            const laneData = uiState.lanes[i]
            laneData.notes.forEach((note) => {
              const noteX = 34 + note.x + KEYS_WIDTH
              const noteY =
                lane.offsetTop + lane.parentElement.offsetTop + (laneData.viewRange.max - note.midiNote) * NOTE_HEIGHT
              if (
                boxesIntersect(
                  noteX,
                  noteX + note.width,
                  noteY,
                  noteY + NOTE_HEIGHT,
                  selectingDimensions.x,
                  selectingDimensions.x + selectingDimensions.width,
                  selectingDimensions.y,
                  selectingDimensions.y + selectingDimensions.height
                )
              ) {
                if (!selectedNotes[laneData.id]) {
                  selectedNotes[laneData.id] = [note.id]
                } else {
                  selectedNotes[laneData.id].push(note.id)
                }
              }
            })
          })
          setSelectNotes(selectedNotes)
          dragSelecting.current = false
          setSelectingDimensions(null)
        } else if (draggingNote.current) {
          // dragging notes
          setStartNoteDrag(null)
          setNoPointerEvents(false)
          setGrabbing(false)
          draggingNote.current = false
        } else if (draggingDelimiter !== null) {
          // dragging delimiters
          if (event.target.classList.contains('delimiter-grab')) {
            delimiterDragHover.current = draggingDelimiter
          }
          setNoPointerEvents(false)
          setEwResizing(false)
          setUIState((uiState) => Object.assign({}, uiState, { delimiters }))
          setDraggingDelimiter(null)
          dragChanged.current = false
          dragDirection.current = 0
          overrideDefault.current = false
        }
      }
    },
  })

  // create delimiter

  const topbarMousedown = useCallback(
    (e) => {
      if (metaPressed.current) {
        const realX = e.pageX - lanesRef.current?.getBoundingClientRect().left - 14
        let closest
        for (let i = 0; i < delimiters.length; i++) {
          const distanceToDelimiter = Math.abs(delimiters[i].x - realX)
          if (distanceToDelimiter < MIN_DELIMITER_WIDTH) {
            alert('Too close to another boundary!')
            return false
          }
          if (closest === undefined || distanceToDelimiter < Math.abs(delimiters[closest].x - realX)) {
            closest = i
          }
        }
        if (realX - delimiters[closest].x > 0) {
          closest += 1
        }
        wasDraggingDelimiter.current = null
        const delimitersCopy = delimiters.slice()
        const { px, snapNumber } = snapPixels(realX, snap)
        delimitersCopy.splice(closest, 0, {
          lanes: Object.assign({}, delimiters[closest - 1].lanes),
          snap,
          snapNumber,
          x: px,
        })
        setDelimiters(delimitersCopy)
        setUIState((uiState) => Object.assign({}, uiState, { delimiters: delimitersCopy }))
      }
    },
    [delimiters, snap]
  )

  const deleteDelimiter = useCallback(
    (i) => {
      const delimitersCopy = delimiters.slice()
      delimitersCopy.splice(i, 1)
      wasDraggingDelimiter.current = null
      setDelimiters(delimitersCopy)
      setUIState((uiState) => Object.assign({}, uiState, { delimiters: delimitersCopy }))
    },
    [delimiters]
  )

  const setLaneState = useCallback((state) => {
    setUIState((uiState) => {
      const uiStateCopy = deepStateCopy(uiState)
      const laneIndex = uiStateCopy.lanes.findIndex((l) => l.id === state.id)
      if (laneIndex !== -1) {
        uiStateCopy.lanes[laneIndex] = state
      }
      window.localStorage.setItem('phrasePresets', JSON.stringify(uiStateCopy))
      return uiStateCopy
    })
  }, [])

  // lane length

  const [laneLengths, setLaneLengths] = useState(uiState.lanes.map((lane) => lane.laneLength))

  const computeLongestLane = useCallback(() => {
    return Math.max(...laneLengths, ...delimiters.slice(1).map((d) => Math.round(d.x / EIGHTH_WIDTH)))
  }, [delimiters, laneLengths])

  const [longestLane, setLongestLane] = useState(computeLongestLane())

  useEffect(() => {
    setLongestLane(computeLongestLane())
  }, [computeLongestLane])

  const updateLongestLane = useCallback((length, i) => {
    setLaneLengths((laneLenghts) => {
      const laneLengthsCopy = laneLenghts.slice()
      laneLengthsCopy[i] = length
      return laneLengthsCopy
    })
  }, [])

  useEffect(() => {
    setLaneLengths(uiState.lanes.map((lane) => lane.laneLength))
  }, [uiState.lanes])

  // elements

  const lanes = useMemo(
    () =>
      uiState.lanes.map((lane, i) => (
        <Lane
          key={lane.id}
          id={lane.id}
          laneNum={i}
          lanePreset={lane}
          setLaneState={setLaneState}
          delimiters={delimiters}
          beatsPerBar={beatsPerBar}
          beatValue={beatValue}
          snap={snap}
          noPointerEvents={noPointerEvents}
          setNoPointerEvents={setNoPointerEvents}
          grabbing={grabbing}
          setGrabbing={setGrabbing}
          shiftPressed={shiftPressed}
          altPressed={altPressed}
          selectNotes={selectNotes}
          startNoteDrag={startNoteDrag}
          noteDrag={noteDrag}
          longestLane={longestLane}
          updateLongestLane={updateLongestLane}
        />
      )),
    [
      beatValue,
      beatsPerBar,
      delimiters,
      grabbing,
      longestLane,
      noPointerEvents,
      noteDrag,
      selectNotes,
      setLaneState,
      snap,
      startNoteDrag,
      uiState.lanes,
      updateLongestLane,
    ]
  )

  const delimiterEls = useMemo(
    () => (
      <div id="delimiters-container">
        <div id="delimiters">
          {delimiters.slice(1).map((delimiter, i) => (
            <Delimiter
              key={uuid()}
              delimiter={delimiter}
              i={i + 1}
              deleteDelimiter={deleteDelimiter}
              dragging={draggingDelimiter === i + 1}
              wasDragging={wasDraggingDelimiter}
              dragHover={delimiterDragHover}
            />
          ))}
        </div>
      </div>
    ),
    [deleteDelimiter, delimiters, draggingDelimiter]
  )

  // lane management

  const addLane = useCallback(() => {
    const laneID = uuid()
    // update delimiters
    const delimitersCopy = delimiters.map((d) => {
      for (const lane in d.lanes) {
        d.lanes[lane] = d.lanes[lane] * (uiState.lanes.length / (uiState.lanes.length + 1))
        d.lanes[laneID] = 1 / (uiState.lanes.length + 1)
      }
      return d
    })
    setDelimiters(delimitersCopy)
    // add new lane and update state
    setUIState((uiState) =>
      Object.assign({}, uiState, {
        lanes: uiState.lanes.concat([DEFAULT_LANE(laneID, longestLane)]),
        delimiters: delimitersCopy,
      })
    )
  }, [delimiters, longestLane, uiState.lanes.length])

  const [addLaneHover, setAddLaneHover] = useState(false)
  const addLaneButton = useMemo(
    () =>
      uiState.lanes.length < MAX_LANES ? (
        <div id="add-lane">
          <img
            src={addLaneHover ? addIconHover : addIcon}
            alt=""
            id="add-lane-button"
            onMouseEnter={() => setAddLaneHover(true)}
            onMouseLeave={() => setAddLaneHover(false)}
            onClick={addLane}
          />
        </div>
      ) : null,
    [addLane, addLaneHover, uiState.lanes.length]
  )

  return (
    <div
      id="main-container"
      className={classNames({ grabbing, 'ew-resizing': ewResizing })}
      ref={mainContainerRef}
      style={{
        '--eighth-width': EIGHTH_WIDTH + 'px',
        '--note-height': NOTE_HEIGHT + 'px',
        '--keys-width': KEYS_WIDTH + 'px',
      }}
      {...dragNotes()}>
      <Header
        playing={playing}
        setPlaying={setPlaying}
        tempo={tempo}
        setTempo={setTempo}
        snap={snap}
        setSnap={setSnap}
        beatsPerBar={beatsPerBar}
        setBeatsPerBar={setBeatsPerBar}
        beatValue={beatValue}
        setBeatValue={setBeatValue}
      />
      <div id="transport-topbar" style={{ width: longestLane * EIGHTH_WIDTH }} onMouseDown={topbarMousedown}>
        <Ticks longestLane={longestLane} beatsPerBar={beatsPerBar} beatValue={beatValue} showNumbers />
      </div>
      <div id="lanes-container" ref={lanesRef} style={{ width: longestLane * EIGHTH_WIDTH + 14 }}>
        {lanes}
        {delimiterEls}
        {!uiState.lanes.length && <div className="empty-lane"></div>}
        {addLaneButton}
      </div>
      {selectingDimensions && (!!selectingDimensions.width || !!selectingDimensions.height) && (
        <div
          id="drag-select"
          style={{
            top: selectingDimensions.y,
            left: selectingDimensions.x,
            width: selectingDimensions.width,
            height: selectingDimensions.height,
          }}></div>
      )}
      <div id="lane-overflow"></div>
    </div>
  )
}

function laneCopy(lane) {
  return Object.assign({}, lane, {
    notes: lane.notes.map((n) => Object.assign({}, n)),
    viewRange: Object.assign({}, lane.viewRange),
  })
}

function deepStateCopy(state) {
  return Object.assign({}, state, { lanes: state.lanes.map((l) => laneCopy(l)) })
}
