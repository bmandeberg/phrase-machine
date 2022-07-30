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
  LANE_COLORS,
  calcLaneLength,
  mapLaneLength,
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
  const [snapToGrid, setSnapToGrid] = useState(uiState.snapToGrid)
  const [grid, setGrid] = useState(uiState.grid)
  const [beatsPerBar, setBeatsPerBar] = useState(uiState.beatsPerBar)
  const [beatValue, setBeatValue] = useState(uiState.beatValue)
  const [noPointerEvents, setNoPointerEvents] = useState(false)
  const [grabbing, setGrabbing] = useState(false)
  const [ewResizing, setEwResizing] = useState(false)
  const [selectNotes, setSelectNotes] = useState({})
  const [selectedNotes, setSelectedNotes] = useState({})
  const [noteDrag, setNoteDrag] = useState({})
  const [startNoteDrag, setStartNoteDrag] = useState(null)
  const shiftPressed = useRef(false)
  const altPressed = useRef(false)
  const metaPressed = useRef(false)
  const mainContainerRef = useRef()
  const lanesRef = useRef()

  const snap = useMemo(() => (snapToGrid ? grid : null), [grid, snapToGrid])

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
    setUIState((uiState) => Object.assign({}, uiState, { grid }))
  }, [grid])

  useEffect(() => {
    setUIState((uiState) => Object.assign({}, uiState, { snapToGrid }))
  }, [snapToGrid])

  const updateSelectedNotes = useCallback((id, notes) => {
    setSelectedNotes((selectedNotes) => Object.assign({}, selectedNotes, { [id]: notes }))
  }, [])

  // transport

  const [playing, setPlaying] = useState(false)
  const [tempo, setTempo] = useState(uiState.tempo)
  useEffect(() => {
    if (Tone.Transport.bpm.value !== tempo) {
      Tone.Transport.bpm.value = tempo
    }
    setUIState((uiState) => Object.assign({}, uiState, { tempo }))
  }, [tempo])

  useEffect(() => {
    Tone.Transport.timeSignature = [beatsPerBar, beatValue]
    setUIState((uiState) => Object.assign({}, uiState, { beatsPerBar, beatValue }))
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
        if (
          event.target.classList.contains('note') ||
          event.target.classList.contains('note-drag-right') ||
          event.target.classList.contains('note-drag-left')
        ) {
          // dragging notes
          draggingNote.current = true
          setNoPointerEvents(true)
          let note, type
          if (event.target.classList.contains('note')) {
            note = event.target.id
            type = 'drag'
            setGrabbing(true)
          } else {
            note = event.target.parentElement.id
            setEwResizing(true)
            type = event.target.classList.contains('note-drag-right') ? 'drag-right' : 'drag-left'
          }
          setStartNoteDrag({
            note,
            type,
            preselected: Object.values(selectedNotes).flat().includes(note),
          })
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
          setEwResizing(false)
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
    return Math.max(...laneLengths, ...delimiters.slice(1).map((d) => Math.round(d.x / EIGHTH_WIDTH)), 0)
  }, [delimiters, laneLengths])

  const [longestLane, setLongestLane] = useState(computeLongestLane())

  useEffect(() => {
    const newLongestLane = computeLongestLane()
    setLongestLane((longestLane) => (startNoteDrag ? Math.max(longestLane, newLongestLane) : newLongestLane))
  }, [computeLongestLane, startNoteDrag])

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

  const windowLaneLength = useMemo(() => Math.max(calcLaneLength(window.innerWidth - 30), longestLane), [longestLane])

  // lane management

  const nextAvailableColor = useMemo(
    () => LANE_COLORS.findIndex((_c, i) => !uiState.lanes.find((lane) => lane.colorIndex === i)) || 0,
    [uiState.lanes]
  )

  const addLane = useCallback(
    (duplicateID) => {
      const laneID = uuid()
      // update delimiters
      const delimitersCopy = delimiters.map((d) => {
        for (const lane in d.lanes) {
          d.lanes[lane] = d.lanes[lane] * (uiState.lanes.length / (uiState.lanes.length + 1))
        }
        d.lanes[laneID] = 1 / (uiState.lanes.length + 1)
        return d
      })
      setDelimiters(delimitersCopy)
      // add new lane and update state

      const newLane = duplicateID
        ? Object.assign(
            {},
            laneCopy(
              uiState.lanes.find((lane) => lane.id === duplicateID),
              laneID,
              true
            ),
            { colorIndex: nextAvailableColor }
          )
        : DEFAULT_LANE(laneID, longestLane, nextAvailableColor)
      setUIState((uiState) =>
        Object.assign({}, uiState, {
          lanes: uiState.lanes.concat([newLane]),
          delimiters: delimitersCopy,
        })
      )
    },
    [delimiters, longestLane, nextAvailableColor, uiState.lanes]
  )

  const deleteLane = useCallback(
    (id) => {
      // update delimiters
      const delimitersCopy = delimiters.map((d) => {
        const removePct = d.lanes[id]
        delete d.lanes[id]
        if (removePct) {
          for (const lane in d.lanes) {
            d.lanes[lane] = d.lanes[lane] / (1 - removePct)
          }
        }
        return d
      })
      setDelimiters(delimitersCopy)
      // remove lane and update state
      setUIState((uiState) =>
        Object.assign({}, uiState, {
          lanes: uiState.lanes.filter((lane) => lane.id !== id),
          delimiters: delimitersCopy,
        })
      )
    },
    [delimiters]
  )

  const [addLaneHover, setAddLaneHover] = useState(false)
  const addLaneButton = useMemo(
    () =>
      uiState.lanes.length < MAX_LANES ? (
        <div id="add-lane">
          <img
            src={addLaneHover ? addIconHover : addIcon}
            alt=""
            id="add-lane-button"
            className={classNames({ 'no-lanes': !uiState.lanes.length })}
            onMouseEnter={() => setAddLaneHover(true)}
            onMouseLeave={() => setAddLaneHover(false)}
            onClick={() => addLane()}
          />
        </div>
      ) : null,
    [addLane, addLaneHover, uiState.lanes.length]
  )

  // elements

  const lanes = useMemo(
    () =>
      uiState.lanes.map((lane, i) => (
        <Lane
          key={lane.id}
          id={lane.id}
          laneNum={i}
          colorIndex={lane.colorIndex}
          lanePreset={lane}
          setLaneState={setLaneState}
          delimiters={delimiters}
          beatsPerBar={beatsPerBar}
          beatValue={beatValue}
          grid={grid}
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
          longestLane={windowLaneLength}
          updateLongestLane={updateLongestLane}
          updateSelectedNotes={updateSelectedNotes}
          setSelectNotes={setSelectNotes}
          addLane={addLane}
          deleteLane={deleteLane}
        />
      )),
    [
      addLane,
      beatValue,
      beatsPerBar,
      deleteLane,
      delimiters,
      grabbing,
      grid,
      noPointerEvents,
      noteDrag,
      selectNotes,
      setLaneState,
      snap,
      startNoteDrag,
      uiState.lanes,
      updateLongestLane,
      updateSelectedNotes,
      windowLaneLength,
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
              height={Math.min(
                uiState.lanes.reduce((prev, curr) => prev + (curr.viewRange.max - curr.viewRange.min + 1) * 12 + 8, 0) +
                  1,
                window.innerHeight - 72
              )}
            />
          ))}
        </div>
      </div>
    ),
    [deleteDelimiter, delimiters, draggingDelimiter, uiState.lanes]
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
        snapToGrid={snapToGrid}
        setSnapToGrid={setSnapToGrid}
        grid={grid}
        setGrid={setGrid}
        beatsPerBar={beatsPerBar}
        setBeatsPerBar={setBeatsPerBar}
        beatValue={beatValue}
        setBeatValue={setBeatValue}
      />
      <div
        id="transport-topbar"
        style={{ width: mapLaneLength(windowLaneLength, grid) * RATE_MULTS[grid] * EIGHTH_WIDTH }}>
        <Ticks
          longestLane={windowLaneLength}
          beatsPerBar={beatsPerBar}
          beatValue={beatValue}
          grid={grid}
          showNumbers
          click={topbarMousedown}
        />
        <div className="lane-overflow"></div>
        <div className="lane-overflow hide-overflow"></div>
      </div>
      <div
        id="lanes-container"
        ref={lanesRef}
        style={{
          width:
            mapLaneLength(!uiState.lanes.length ? longestLane : windowLaneLength, grid) *
              RATE_MULTS[grid] *
              EIGHTH_WIDTH +
            14,
        }}>
        {lanes}
        {delimiterEls}
        {!uiState.lanes.length && (
          <div
            className="empty-lane"
            onClick={() => addLane()}
            style={{ width: mapLaneLength(windowLaneLength, grid) * RATE_MULTS[grid] * EIGHTH_WIDTH + 14 }}>
            😴
          </div>
        )}
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

function laneCopy(lane, id, updateNoteIDs) {
  return Object.assign({}, lane, {
    id: id || lane.id,
    notes: lane.notes.map((n) => Object.assign({}, n, { id: updateNoteIDs ? uuid() : n.id })),
    viewRange: Object.assign({}, lane.viewRange),
  })
}

function deepStateCopy(state) {
  return Object.assign({}, state, { lanes: state.lanes.map((l) => laneCopy(l)) })
}
