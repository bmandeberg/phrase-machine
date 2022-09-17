import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import * as Tone from 'tone'
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
import useGlobalDrag from './hooks/useGlobalDrag'
import { pixelsToTime, positionToPixels, snapPixels, chooseLane, getDelimiterIndex } from './util'
import addIcon from './assets/add-icon.svg'
import addIconHover from './assets/add-icon-hover.svg'
import playheadGraphic from './assets/playhead.svg'
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
  const [nsResizing, setNsResizing] = useState(false)
  const [selectNotes, setSelectNotes] = useState({})
  const [selectedNotes, setSelectedNotes] = useState({})
  const [noteDrag, setNoteDrag] = useState({})
  const [startNoteDrag, setStartNoteDrag] = useState(null)
  const [changingProbability, setChangingProbability] = useState(null)
  const [anyLaneSoloed, setAnyLaneSoloed] = useState(uiState.lanes.some((l) => l.solo))
  const [chosenLane, setChosenLane] = useState()
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

  const playhead = useRef()

  const setPlayheadPosition = useCallback((position) => {
    if (playhead.current) {
      playhead.current.style.left = 43 + position + 'px'
    }
  }, [])

  useEffect(() => {
    Tone.Transport.loop = true
    Tone.Transport.loopStart = 0
    // animation callback
    const animationRepeat = Tone.Transport.scheduleRepeat((time) => {
      Tone.Draw.schedule(() => {
        setPlayheadPosition(positionToPixels(Tone.Transport.position))
      }, time)
    }, 1 / 60)
    // cleanup
    return () => {
      Tone.Transport.clear(animationRepeat)
    }
  }, [setPlayheadPosition])

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

  // update Tone Transport loop length
  useEffect(() => {
    Tone.Transport.loopEnd = { '8n': windowLaneLength }
  }, [windowLaneLength])

  // check current delimiter and update chosen lane if we're in a new delimiter
  const updateChosenLane = useCallback(
    (x, newDelimiters) => {
      const d = newDelimiters ?? delimiters
      const newDelimiterIndex = getDelimiterIndex(d, x)
      if (newDelimiterIndex !== chosenLane.delimiterIndex) {
        setChosenLane({
          lane: chooseLane(d[newDelimiterIndex].lanes),
          delimiterIndex: newDelimiterIndex,
        })
      }
    },
    [chosenLane, delimiters]
  )

  // global dragging

  const [selectingDimensions, setSelectingDimensions] = useState(null)
  const [draggingDelimiter, setDraggingDelimiter] = useState(null)
  const wasDraggingDelimiter = useRef(null)
  const delimiterDragHover = useRef(null)
  const { globalDrag } = useGlobalDrag(
    delimiters,
    setNoPointerEvents,
    setGrabbing,
    setEwResizing,
    setStartNoteDrag,
    selectedNotes,
    setSelectNotes,
    setDraggingDelimiter,
    wasDraggingDelimiter,
    setNsResizing,
    setChangingProbability,
    snap,
    setSelectingDimensions,
    mainContainerRef,
    setNoteDrag,
    draggingDelimiter,
    windowLaneLength,
    setDelimiters,
    changingProbability,
    uiState,
    setPlayheadPosition,
    selectingDimensions,
    delimiterDragHover,
    setUIState,
    chosenLane,
    setChosenLane,
    updateChosenLane
  )

  // delimiters

  useEffect(() => {
    setChosenLane({ lane: chooseLane(delimiters[0].lanes), delimiterIndex: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const delimiterEvents = useMemo(
    () =>
      new Tone.Part((time, d) => {
        setChosenLane({ lane: chooseLane(d.delimiter.lanes), delimiterIndex: d.i })
      }).start(0),
    []
  )
  useEffect(() => {
    delimiterEvents.clear()
    for (const [i, delimiter] of delimiters.entries()) {
      delimiterEvents.add(delimiter.snap ? { [delimiter.snap]: delimiter.snapNumber } : pixelsToTime(delimiter.x), {
        delimiter,
        i,
      })
    }
  }, [delimiterEvents, delimiters])

  // set playhead or create delimiter
  const topbarMousedown = useCallback(
    (e) => {
      e.stopPropagation()
      const realX = e.pageX - lanesRef.current?.getBoundingClientRect().left - 14
      const { px, snapNumber } = snapPixels(realX, snap)
      if (metaPressed.current) {
        // create delimiter
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
        delimitersCopy.splice(closest, 0, {
          lanes: Object.assign({}, delimiters[closest - 1].lanes),
          snap,
          snapNumber,
          x: px,
        })
        setDelimiters(delimitersCopy)
        setUIState((uiState) => Object.assign({}, uiState, { delimiters: delimitersCopy }))
      } else {
        // set playhead
        Tone.Transport.position = new Tone.Time(pixelsToTime(px, snap)).toBarsBeatsSixteenths()
        setPlayheadPosition(px)
      }
      updateChosenLane()
    },
    [delimiters, setPlayheadPosition, snap, updateChosenLane]
  )

  const deleteDelimiter = useCallback(
    (i) => {
      const delimitersCopy = delimiters.slice()
      delimitersCopy.splice(i, 1)
      wasDraggingDelimiter.current = null
      setDelimiters(delimitersCopy)
      setUIState((uiState) => Object.assign({}, uiState, { delimiters: delimitersCopy }))
      updateChosenLane(null, delimitersCopy)
    },
    [delimiters, updateChosenLane]
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

  // lane management

  const nextAvailableColor = useMemo(
    () => LANE_COLORS.findIndex((_c, i) => !uiState.lanes.find((lane) => lane.colorIndex === i)) || 0,
    [uiState.lanes]
  )

  const lanesHeight = useMemo(() => {
    return Math.min(
      uiState.lanes.reduce((prev, curr) => prev + (curr.viewRange.max - curr.viewRange.min + 1) * 12 + 8, 0) + 1,
      window.innerHeight - 72
    )
  }, [uiState.lanes])

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

  // handle lane mute and solo probabilities at each delimiter
  const setMuteSolo = useCallback(
    (id, update) => {
      let anyLaneSoloedRef = anyLaneSoloed
      const uiStateCopy = deepStateCopy(uiState)
      const laneIndex = uiStateCopy.lanes.findIndex((l) => l.id === id)
      // total % of lanes that are muted
      function getTotalMuted(delimiter) {
        return Object.keys(delimiter.lanes).reduce((prev, curr) => {
          const lane = uiStateCopy.lanes.find((l) => l.id === curr)
          return (anyLaneSoloedRef && !lane.solo) || lane.mute ? prev + delimiter.lanes[curr] : prev
        }, 0)
      }
      // add solo or remove mute
      function addAudible(delimiters) {
        for (const delimiter of delimiters) {
          const totalMuted = getTotalMuted(delimiter)
          delimiter.lanes[id] /= 1 - totalMuted
          for (const laneID in delimiter.lanes) {
            const lane = uiStateCopy.lanes.find((l) => l.id === laneID)
            if (laneID !== id && !lane.mute && (lane.solo || !anyLaneSoloedRef)) {
              delimiter.lanes[laneID] *= 1 - delimiter.lanes[id]
            }
          }
        }
      }
      // remove solo or add mute
      function removeAudible(delimiters, delimiterTotalMuted, forceUseSolo) {
        delimiters.forEach((delimiter, i) => {
          const totalMuted = delimiterTotalMuted ? delimiterTotalMuted[i] : getTotalMuted(delimiter)
          for (const laneID in delimiter.lanes) {
            const lane = uiStateCopy.lanes.find((l) => l.id === laneID)
            if (laneID !== id && !lane.mute && (lane.solo || (!anyLaneSoloedRef && !forceUseSolo))) {
              delimiter.lanes[laneID] /= 1 - delimiter.lanes[id]
            }
          }
          delimiter.lanes[id] *= 1 - totalMuted
        })
      }
      function updateLane() {
        uiStateCopy.lanes[laneIndex] = { ...uiStateCopy.lanes[laneIndex], ...update }
        setUIState(uiStateCopy)
        if (uiStateCopy.lanes.some((l) => l.solo)) {
          anyLaneSoloedRef = true
          setAnyLaneSoloed(true)
        } else {
          anyLaneSoloedRef = false
          setAnyLaneSoloed(false)
        }
      }
      function handleSoloLanes(delimiters, add) {
        if (!anyLaneSoloedRef) {
          for (const delimiter of delimiters) {
            const totalMuted = getTotalMuted(delimiter)
            for (const laneID in delimiter.lanes) {
              const lane = uiStateCopy.lanes.find((l) => l.id === laneID)
              if (!lane.solo && !lane.mute && laneID !== id) {
                if (add) {
                  delimiter.lanes[laneID] *= 1 - totalMuted
                } else {
                  delimiter.lanes[laneID] /= 1 - totalMuted
                }
              }
            }
          }
        }
      }
      // pass if changing mute, but lane is already muted by a solo from another lane
      if (update.mute !== undefined && !update.solo && anyLaneSoloedRef && !uiStateCopy.lanes[laneIndex].solo) {
        return
      }
      // should only does one at a time, mune/unmute, solo/unsolo
      // adding a solo is similar to removing a mute, and vice versa
      const delimitersCopy = delimiters.slice()
      if (update.solo === true || update.mute === false) {
        // adding solo or removing mute
        if (update.solo === true) {
          // if no lanes already soloed, mute lanes that are not soloed and aren't already muted
          handleSoloLanes(delimitersCopy, true)
        }
        updateLane()
        // remove mute, or add solo if not muted
        if (update.mute === false || !uiStateCopy.lanes[laneIndex].mute) {
          addAudible(delimitersCopy)
        }
      } else if (update.solo === false || update.mute === true) {
        // removing solo or adding mute
        // get total previously muted before this change
        const delimiterTotalMuted = delimitersCopy.map((d) => getTotalMuted(d))
        updateLane()
        if (update.solo === false) {
          // if no lanes are now soloed, un-mute lanes that are not muted
          handleSoloLanes(delimitersCopy, false)
        }
        // add mute, or remove solo if not muted
        if (update.mute === true || !uiStateCopy.lanes[laneIndex].mute) {
          removeAudible(delimitersCopy, delimiterTotalMuted, update.solo === false)
        }
      }
      setDelimiters(delimitersCopy)
    },
    [anyLaneSoloed, delimiters, uiState]
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
          draggingDelimiter={draggingDelimiter}
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
          changingProbability={changingProbability}
          setMuteSolo={setMuteSolo}
          anyLaneSoloed={anyLaneSoloed}
          chosen={chosenLane}
          playing={playing}
        />
      )),
    [
      addLane,
      anyLaneSoloed,
      beatValue,
      beatsPerBar,
      changingProbability,
      chosenLane,
      deleteLane,
      delimiters,
      draggingDelimiter,
      grabbing,
      grid,
      noPointerEvents,
      noteDrag,
      playing,
      selectNotes,
      setLaneState,
      setMuteSolo,
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
              height={lanesHeight}
            />
          ))}
        </div>
      </div>
    ),
    [deleteDelimiter, delimiters, draggingDelimiter, lanesHeight]
  )

  const playheadEl = useMemo(
    () => (
      <div id="playhead" ref={playhead} style={{ height: lanesHeight }}>
        <img id="playhead-head" src={playheadGraphic} alt="" draggable="false" />
      </div>
    ),
    [lanesHeight]
  )

  return (
    <div
      id="main-container"
      className={classNames({ grabbing, 'ew-resizing': ewResizing, 'ns-resizing': nsResizing })}
      ref={mainContainerRef}
      style={{
        '--eighth-width': EIGHTH_WIDTH + 'px',
        '--note-height': NOTE_HEIGHT + 'px',
        '--keys-width': KEYS_WIDTH + 'px',
      }}
      {...globalDrag()}>
      <div id="header-background"></div>
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
      {playheadEl}
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
