import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import classNames from 'classnames'
import { CSSTransition } from 'react-transition-group'
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
import Tooltip from './components/ui/Tooltip'
import RangeSlider from './components/ui/RangeSlider'
import Dropdown from './components/ui/Dropdown'
import Modal from './components/ui/Modal'
import useGlobalDrag from './hooks/useGlobalDrag'
import useInstruments from './hooks/useInstruments'
import useMIDI from './hooks/useMIDI'
import {
  pixelsToTime,
  positionToPixels,
  snapPixels,
  chooseLane,
  getDelimiterIndex,
  timeToPixels,
  noteString,
} from './util'
import addIcon from './assets/add-icon.svg'
import addIconDark from './assets/add-icon-dark.svg'
import addIconHover from './assets/add-icon-hover.svg'
import playheadGraphic from './assets/playhead.svg'
import playheadGraphicDark from './assets/playhead-dark.svg'
import endGraphic from './assets/end-head.svg'
import endGraphicDark from './assets/end-head-dark.svg'
import './App.scss'
import './dark-theme.scss'

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
  const [swing, setSwing] = useState(uiState.swing)
  const [noPointerEvents, setNoPointerEvents] = useState(false)
  const [grabbing, setGrabbing] = useState(false)
  const [ewResizing, setEwResizing] = useState(false)
  const [nsResizing, setNsResizing] = useState(false)
  const [selectNotes, setSelectNotes] = useState({})
  const [selectedNotes, setSelectedNotes] = useState({})
  const [noteDrag, setNoteDrag] = useState({})
  const [startNoteDrag, setStartNoteDrag] = useState(null)
  const [targetNoteUpdate, setTargetNoteUpdate] = useState(null)
  const [laneMinMax, setLaneMinMax] = useState({})
  const [changingProbability, setChangingProbability] = useState(null)
  const [anyLaneSoloed, setAnyLaneSoloed] = useState(uiState.lanes.some((l) => l.solo))
  const [chosenLane, setChosenLane] = useState()
  const [tooltip, setTooltip] = useState()
  const shiftPressed = useRef(false)
  const altPressed = useRef(false)
  const metaPressed = useRef(false)
  const mainContainerRef = useRef()
  const lanesRef = useRef()
  const targetNoteStart = useRef()

  const [instrumentOn, setInstrumentOn] = useState(uiState.instrumentOn)
  const [instrumentType, setInstrumentType] = useState(uiState.instrumentType)
  const [instrumentParams, setInstrumentParams] = useState(uiState.instrumentParams)

  // settings

  const [linearKnobs, setLinearKnobs] = useState(JSON.parse(window.localStorage.getItem('linearKnobs')) ?? true)

  useEffect(() => {
    window.localStorage.setItem('linearKnobs', linearKnobs)
  }, [linearKnobs])

  const [theme, setTheme] = useState(window.localStorage.getItem('theme') ?? 'dark')

  useEffect(() => {
    window.localStorage.setItem('theme', theme)
  }, [theme])

  const playheadStartPosition = useRef(0)
  const [playheadReset, setPlayheadReset] = useState(JSON.parse(window.localStorage.getItem('playheadReset')) ?? true)
  const playheadResetRef = useRef(playheadReset)

  useEffect(() => {
    playheadResetRef.current = playheadReset
    window.localStorage.setItem('playheadReset', playheadReset)
  }, [playheadReset])

  const snap = useMemo(() => (snapToGrid ? grid : null), [grid, snapToGrid])

  const setPlayheadPosition = useCallback((position) => {
    if (playhead.current) {
      playhead.current.style.left = 43 + position + 'px'
    }
  }, [])

  const resetTransport = useCallback(() => {
    Tone.Transport.position = 0
    setPlayheadPosition(0)
  }, [setPlayheadPosition])

  const setEndPosition = useCallback((position) => {
    if (end.current) {
      end.current.style.left = 43 + position + 'px'
    }
  }, [])

  const uiStateRef = useRef()
  useEffect(() => {
    uiStateRef.current = uiState
  }, [uiState])

  // event handlers

  useEffect(() => {
    // event functions
    function keydown(e) {
      if (e.key === 'Shift') {
        shiftPressed.current = true
      } else if (e.key === 'Alt') {
        altPressed.current = true
      } else if (e.key === 'Meta') {
        metaPressed.current = true
      } else if (e.key === 'Enter') {
        resetTransport()
      } else if (e.key === 'a') {
        // select all notes
        if (metaPressed.current) {
          e.preventDefault()
          const allNotes = {}
          for (const lane of uiStateRef.current.lanes) {
            allNotes[lane.id] = lane.notes.map((note) => note.id)
          }
          setSelectNotes(allNotes)
        }
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
    function contextmenu(e) {
      if (e.target.closest('.note')) {
        e.preventDefault()
        setTooltip({
          x: e.pageX,
          y: e.pageY,
          content: {
            type: 'note',
            noteID: e.target.closest('.note').id,
            laneID: e.target.closest('.lane-container').id.slice(5),
          },
        })
      } else if (e.target.classList.contains('key')) {
        e.preventDefault()
        setTooltip({
          x: e.pageX,
          y: e.pageY,
          content: {
            type: 'key',
            note: +e.target.getAttribute('note'),
            laneID: e.target.closest('.lane-container').id.slice(5),
          },
        })
      } else if (e.target.classList.contains('delimiter-grab')) {
        e.preventDefault()
        const i = +e.target.parentElement.getAttribute('index')
        setDelimiters((delimiters) => {
          const delimitersCopy = delimiters.slice()
          delimitersCopy[i] = { ...delimitersCopy[i], hidden: !delimitersCopy[i].hidden }
          return delimitersCopy
        })
        setUIState((uiState) => {
          const uiStateCopy = deepStateCopy(uiState)
          uiStateCopy.delimiters[i] = { ...uiStateCopy.delimiters[i], hidden: !uiStateCopy.delimiters[i].hidden }
          return uiStateCopy
        })
      }
    }
    function focus() {
      shiftPressed.current = false
      altPressed.current = false
      metaPressed.current = false
    }
    // attach / clean up events
    window.addEventListener('keyup', keyup)
    window.addEventListener('keydown', keydown)
    document.addEventListener('contextmenu', contextmenu)
    window.onfocus = focus
    return () => {
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('keydown', keydown)
      document.removeEventListener('contextmenu', contextmenu)
      window.onfocus = null
    }
  }, [resetTransport, setPlayheadPosition])

  useEffect(() => {
    window.localStorage.setItem('phrasePresets', JSON.stringify(uiState))
  }, [uiState])

  useEffect(() => {
    setUIState((uiState) => Object.assign({}, uiState, { grid }))
  }, [grid])

  useEffect(() => {
    setUIState((uiState) => Object.assign({}, uiState, { snapToGrid }))
  }, [snapToGrid])

  useEffect(() => {
    setUIState((uiState) => Object.assign({}, uiState, { instrumentParams }))
  }, [instrumentParams])

  useEffect(() => {
    setUIState((uiState) => Object.assign({}, uiState, { instrumentType }))
  }, [instrumentType])

  useEffect(() => {
    setUIState((uiState) => Object.assign({}, uiState, { instrumentOn }))
  }, [instrumentOn])

  const updateSelectedNotes = useCallback((laneID, notes) => {
    setSelectedNotes((selectedNotes) => Object.assign({}, selectedNotes, { [laneID]: notes }))
  }, [])

  // transport

  const playhead = useRef()
  const end = useRef()

  // init
  const endPos = useRef(uiState.end)
  useEffect(() => {
    function onPause() {
      if (playheadResetRef.current) {
        setTimeout(() => {
          updateChosenLaneRef.current(null, null, true)
        })
      }
    }
    Tone.Transport.loop = true
    Tone.Transport.loopStart = 0
    Tone.Transport.on('pause', onPause)
    // animation callback
    const animationRepeat = Tone.Transport.scheduleRepeat((time) => {
      Tone.Draw.schedule(() => {
        setPlayheadPosition(positionToPixels(Tone.Transport.position))
      }, time)
    }, 1 / 60)
    Tone.Transport.loopEnd = endPos.current.snap
      ? { [endPos.current.snap]: endPos.current.snapNumber }
      : pixelsToTime(endPos.current.x)
    setEndPosition(
      endPos.current.snap ? timeToPixels({ [endPos.current.snap]: endPos.current.snapNumber }) : endPos.current.x
    )
    // cleanup
    return () => {
      Tone.Transport.clear(animationRepeat)
      Tone.Transport.off('pause', onPause)
    }
  }, [setEndPosition, setPlayheadPosition])

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

  useEffect(() => {
    Tone.Transport.swing = swing
    setUIState((uiState) => Object.assign({}, uiState, { swing }))
  }, [swing])

  // MIDI

  const {
    midiOutRef,
    midiInRef,
    midiOuts,
    midiOut,
    setMidiOut,
    midiIns,
    midiIn,
    setMidiIn,
    midiClockIn,
    setMidiClockIn,
    midiClockOut,
    setMidiClockOut,
  } = useMIDI(setPlaying, resetTransport, playheadResetRef, playheadStartPosition)

  // modal window

  const [modalType, setModalType] = useState('')
  const [modalContent, setModalContent] = useState(false)
  const showModal = useCallback(() => {
    setModalContent(true)
  }, [])
  const hideModal = useCallback(() => {
    setModalContent(false)
  }, [])

  // instruments

  const instrument = useRef()

  const cleanupInstruments = useCallback(() => {}, [])

  const { gainNode, openInstrumentModal, instruments, effects } = useInstruments(
    instrument,
    instrumentParams,
    instrumentType,
    cleanupInstruments,
    setModalType
  )

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

  const delimiterAudibleLanes = useCallback(
    (lanes) => {
      const audibleLanes = {}
      for (const lane in lanes) {
        const laneObj = uiState.lanes.find((l) => l.id === lane)
        if (!laneObj.mute && (!anyLaneSoloed || laneObj.solo)) {
          audibleLanes[lane] = lanes[lane]
        }
      }
      return audibleLanes
    },
    [anyLaneSoloed, uiState.lanes]
  )
  const delimiterAudibleLanesRef = useRef()
  useEffect(() => {
    delimiterAudibleLanesRef.current = delimiterAudibleLanes
  }, [delimiterAudibleLanes])

  // check current delimiter and update chosen lane if we're in a new delimiter
  const updateChosenLane = useCallback(
    (x, newDelimiters, forceUpdate) => {
      const d = newDelimiters ?? delimiters
      const newDelimiterIndex = getDelimiterIndex(d, x)
      if (newDelimiterIndex !== chosenLane.delimiterIndex || forceUpdate) {
        setChosenLane({
          lane: chooseLane(delimiterAudibleLanes(d[newDelimiterIndex].lanes)),
          delimiterIndex: newDelimiterIndex,
        })
      }
    },
    [chosenLane, delimiterAudibleLanes, delimiters]
  )

  const updateChosenLaneRef = useRef(updateChosenLane)
  useEffect(() => {
    updateChosenLaneRef.current = updateChosenLane
  }, [updateChosenLane])

  // global dragging

  const [selectingDimensions, setSelectingDimensions] = useState(null)
  const [draggingDelimiter, setDraggingDelimiter] = useState(null)
  const wasDraggingDelimiter = useRef(null)
  const delimiterDragHover = useRef(null)
  const cancelClick = useRef(false)
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
    updateChosenLane,
    cancelClick,
    setEndPosition,
    targetNoteStart,
    anyLaneSoloed,
    laneMinMax,
    setLaneMinMax,
    modalType
  )

  // delimiters

  useEffect(() => {
    setChosenLane({ lane: chooseLane(delimiterAudibleLanesRef.current(delimiters[0].lanes)), delimiterIndex: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const delimiterEvents = useMemo(
    () =>
      new Tone.Part((time, d) => {
        setChosenLane({ lane: chooseLane(delimiterAudibleLanesRef.current(d.delimiter.lanes)), delimiterIndex: d.i })
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
          hidden: false,
        })
        setDelimiters(delimitersCopy)
        setUIState((uiState) => Object.assign({}, uiState, { delimiters: delimitersCopy }))
      } else if (!cancelClick.current) {
        // set playhead
        Tone.Transport.position = new Tone.Time(pixelsToTime(px, snap)).toBarsBeatsSixteenths()
        setPlayheadPosition(px)
      } else {
        cancelClick.current = false
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
        if (anyLaneSoloed) {
          const newLanePct = 1 / (uiState.lanes.length + 1)
          // update each lane that is muted or not soloed
          for (const lane in d.lanes) {
            const laneObj = uiState.lanes.find((l) => l.id === lane)
            if (laneObj.mute || !laneObj.solo) {
              d.lanes[lane] *= uiState.lanes.length / (uiState.lanes.length + 1)
            }
          }
          d.lanes[laneID] = newLanePct
        } else {
          const numLanesNotMuted = uiState.lanes.filter((l) => !l.mute).length
          for (const lane in d.lanes) {
            if (lane !== laneID) {
              // update each lane that isn't muted
              if (!uiState.lanes.find((l) => l.id === lane).mute) {
                d.lanes[lane] *= numLanesNotMuted / (numLanesNotMuted + 1)
              }
            }
          }
          d.lanes[laneID] = 1 / (numLanesNotMuted + 1)
        }
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
    [anyLaneSoloed, delimiters, longestLane, nextAvailableColor, uiState]
  )

  const deleteLane = useCallback(
    (id) => {
      const deleteLane = uiState.lanes.find((l) => l.id === id)
      // update delimiters
      const delimitersCopy = delimiters.map((d) => {
        const removePct = d.lanes[id]
        delete d.lanes[id]
        if (removePct) {
          // if the lane is soloed
          if (deleteLane.solo) {
            const totalNotMuted = Object.keys(d.lanes).reduce((prev, curr) => {
              const laneObj = uiState.lanes.find((l) => l.id === curr)
              return !laneObj.mute ? prev + d.lanes[curr] : prev
            }, 0)
            if (uiState.lanes.every((l) => l.id === id || !l.solo)) {
              // if this is the only lane soloed
              for (const lane in d.lanes) {
                if (!uiState.lanes.find((l) => l.id === lane).mute) {
                  d.lanes[lane] /= totalNotMuted
                }
              }
              setAnyLaneSoloed(false)
            } else {
              // if there are others soloed
              for (const lane in d.lanes) {
                if (uiState.lanes.find((l) => l.id === lane).solo) {
                  d.lanes[lane] /= 1 - removePct
                }
              }
            }
          } else {
            // if the lane is muted via mute or another lane's solo
            if (deleteLane.mute || anyLaneSoloed) {
              for (const lane in d.lanes) {
                const laneObj = uiState.lanes.find((l) => l.id === lane)
                // each muted lane
                if ((anyLaneSoloed && !laneObj.solo) || laneObj.mute) {
                  const totalMuted = getTotalMuted(d, uiState, anyLaneSoloed)
                  d.lanes[lane] = (d.lanes[lane] / totalMuted) * (totalMuted + removePct)
                }
              }
            } else {
              // no lanes soloed, deleted lane not muted or soloed
              for (const lane in d.lanes) {
                if (!uiState.lanes.find((l) => l.id === lane).mute) {
                  d.lanes[lane] /= 1 - removePct
                }
              }
            }
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
      if (chosenLane.lane === id) {
        updateChosenLane(null, null, true)
      }
    },
    [anyLaneSoloed, chosenLane, delimiters, uiState, updateChosenLane]
  )

  const [addLaneHover, setAddLaneHover] = useState(false)
  const addLaneButton = useMemo(
    () =>
      uiState.lanes.length < MAX_LANES ? (
        <div id="add-lane">
          <img
            src={addLaneHover ? addIconHover : theme === 'dark' ? addIconDark : addIcon}
            alt=""
            id="add-lane-button"
            className={classNames({ 'no-lanes': !uiState.lanes.length })}
            onMouseEnter={() => setAddLaneHover(true)}
            onMouseLeave={() => setAddLaneHover(false)}
            onClick={() => addLane()}
          />
        </div>
      ) : null,
    [addLane, addLaneHover, theme, uiState.lanes.length]
  )

  // handle lane mute and solo probabilities at each delimiter
  const setMuteSolo = useCallback(
    (id, update) => {
      let anyLaneSoloedRef = anyLaneSoloed
      const uiStateCopy = deepStateCopy(uiState)
      const laneIndex = uiStateCopy.lanes.findIndex((l) => l.id === id)

      // total % of lanes that are audible
      function getTotalAudible(delimiter, excludeID) {
        return Object.keys(delimiter.lanes).reduce((prev, curr) => {
          const lane = uiStateCopy.lanes.find((l) => l.id === curr)
          return (!anyLaneSoloedRef || lane.solo) && !lane.mute && curr !== excludeID
            ? prev + delimiter.lanes[curr]
            : prev
        }, 0)
      }

      // add solo or remove mute
      function addAudible(delimiters, onlySoloLane) {
        for (const delimiter of delimiters) {
          const totalMuted = getTotalMuted(delimiter, uiStateCopy, anyLaneSoloedRef)
          if (onlySoloLane) {
            delimiter.lanes[id] = 1
          } else {
            delimiter.lanes[id] /= 1 - totalMuted
          }
          for (const laneID in delimiter.lanes) {
            const lane = uiStateCopy.lanes.find((l) => l.id === laneID)
            if (laneID !== id && !lane.mute && (lane.solo || !anyLaneSoloedRef)) {
              delimiter.lanes[laneID] *= 1 - delimiter.lanes[id]
            }
          }
        }
      }

      // remove solo or add mute
      function removeAudible(delimiters, delimiterTotalMuted, forceUseSolo, onlySolo) {
        delimiters.forEach((delimiter, i) => {
          const totalMuted = delimiterTotalMuted
            ? delimiterTotalMuted[i]
            : getTotalMuted(delimiter, uiStateCopy, anyLaneSoloedRef)
          for (const laneID in delimiter.lanes) {
            const lane = uiStateCopy.lanes.find((l) => l.id === laneID)
            if (laneID !== id && !lane.mute && (lane.solo || (!anyLaneSoloedRef && !forceUseSolo))) {
              delimiter.lanes[laneID] /= 1 - delimiter.lanes[id]
            }
          }
          if (onlySolo) {
            delimiter.lanes[id] = 1 - getTotalAudible(delimiter, id)
          } else {
            delimiter.lanes[id] *= 1 - totalMuted
          }
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
            const totalMuted = getTotalMuted(delimiter, uiStateCopy, anyLaneSoloedRef)
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
        updateLane()
        return
      }
      // should only do one at a time, mune/unmute, solo/unsolo
      // adding a solo is similar to removing a mute, and vice versa
      const delimitersCopy = delimiters.slice()
      if (update.solo === true || update.mute === false) {
        // adding solo or removing mute
        let onlySoloLane = update.solo === true && !anyLaneSoloedRef && !uiStateCopy.lanes[laneIndex].mute
        if (update.solo === true) {
          // if no lanes already soloed, mute lanes that are not soloed and aren't already muted
          handleSoloLanes(delimitersCopy, true)
        }
        updateLane()
        // remove mute, or add solo if not muted
        if (update.mute === false || !uiStateCopy.lanes[laneIndex].mute) {
          addAudible(delimitersCopy, onlySoloLane)
        }
        // choose a new lane if the current chosen lane isn't soloed (chosen meaning playing)
        if (update.solo === true && chosenLane?.id !== id) {
          const chosenLaneObj = chosenLane.lane && uiState.lanes.find((l) => l.id === chosenLane.lane)
          if (chosenLaneObj && !chosenLaneObj.solo) {
            const audibleLanes = {}
            for (const lane in delimitersCopy[chosenLane.delimiterIndex].lanes) {
              const laneObj = uiState.lanes.find((l) => l.id === lane)
              if (!laneObj.mute && (laneObj.solo || lane === id)) {
                audibleLanes[lane] = delimitersCopy[chosenLane.delimiterIndex].lanes[lane]
              }
            }
            setChosenLane((chosenLane) => ({
              lane: chooseLane(audibleLanes),
              delimiterIndex: chosenLane.delimiterIndex,
            }))
          }
        }
      } else if (update.solo === false || update.mute === true) {
        // removing solo or adding mute
        // get total previously muted before this change
        const delimiterTotalMuted = delimitersCopy.map((d) => getTotalMuted(d, uiStateCopy, anyLaneSoloedRef))
        let onlySoloLane = false
        updateLane()
        if (update.solo === false) {
          if (!anyLaneSoloedRef && !uiStateCopy.lanes[laneIndex].mute) {
            onlySoloLane = true
          }
          // if no lanes are now soloed, un-mute lanes that are not muted
          handleSoloLanes(delimitersCopy, false)
        }
        // add mute, or remove solo if not muted
        if (update.mute === true || !uiStateCopy.lanes[laneIndex].mute) {
          removeAudible(delimitersCopy, delimiterTotalMuted, update.solo === false, onlySoloLane)
        }
        // choose a new lane if we are muting the current chosen lane
        if (update.mute === true && chosenLane?.lane === id) {
          const audibleLanes = {}
          for (const lane in delimitersCopy[chosenLane.delimiterIndex].lanes) {
            const laneObj = uiState.lanes.find((l) => l.id === lane)
            if (!laneObj.mute && (!anyLaneSoloed || laneObj.solo) && lane !== id) {
              audibleLanes[lane] = delimitersCopy[chosenLane.delimiterIndex].lanes[lane]
            }
          }
          setChosenLane((chosenLane) => ({
            lane: chooseLane(audibleLanes),
            delimiterIndex: chosenLane.delimiterIndex,
          }))
        }
      }
      setDelimiters(delimitersCopy)
    },
    [anyLaneSoloed, chosenLane, delimiters, uiState]
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
          midiOutRef={midiOutRef}
          instrument={instrument}
          instrumentOn={instrumentOn}
          instrumentType={instrumentType}
          cancelClick={cancelClick}
          targetNoteStart={targetNoteStart}
          targetNoteUpdate={targetNoteUpdate}
          setTargetNoteUpdate={setTargetNoteUpdate}
          laneMinMax={laneMinMax}
          onlyAudibleLane={uiState.lanes.every((l) => l.id === lane.id || l.mute || (lane.solo && !l.solo))}
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
      instrumentOn,
      instrumentType,
      laneMinMax,
      midiOutRef,
      noPointerEvents,
      noteDrag,
      playing,
      selectNotes,
      setLaneState,
      setMuteSolo,
      snap,
      startNoteDrag,
      targetNoteUpdate,
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
              theme={theme}
            />
          ))}
        </div>
      </div>
    ),
    [deleteDelimiter, delimiters, draggingDelimiter, lanesHeight, theme]
  )

  const playheadEl = useMemo(
    () => (
      <div id="playhead" ref={playhead} style={{ height: lanesHeight }}>
        <img
          id="playhead-head"
          src={theme === 'dark' ? playheadGraphicDark : playheadGraphic}
          alt=""
          draggable="false"
        />
      </div>
    ),
    [lanesHeight, theme]
  )

  const endEl = useMemo(
    () => (
      <div id="end" ref={end} style={{ height: lanesHeight }}>
        <img id="end-head" src={theme === 'dark' ? endGraphicDark : endGraphic} alt="" draggable="false" />
      </div>
    ),
    [lanesHeight, theme]
  )

  const tooltipEl = useMemo(() => {
    if (tooltip) {
      if (tooltip.content.type === 'note') {
        // note velocity slider
        return (
          <Tooltip x={tooltip.x} y={tooltip.y} setTooltip={setTooltip}>
            <RangeSlider
              value={
                uiState.lanes
                  .find((l) => l.id === tooltip.content.laneID)
                  .notes.find((n) => n.id === tooltip.content.noteID).velocity
              }
              setValue={(value) => {
                setUIState((uiState) => {
                  const uiStateCopy = deepStateCopy(uiState)
                  uiStateCopy.lanes
                    .find((l) => l.id === tooltip.content.laneID)
                    .notes.find((n) => n.id === tooltip.content.noteID).velocity = value
                  return uiStateCopy
                })
              }}
              setNsResizing={setNsResizing}
              setGrabbing={setGrabbing}
              grabbing={grabbing}
            />
            <p className="slider-label">
              VELOCITY
              <br />
              RANGE
            </p>
          </Tooltip>
        )
      } else if (tooltip.content.type === 'key') {
        // note lane MIDI channel out
        const lane = uiState.lanes.find((l) => l.id === tooltip.content.laneID)
        return (
          <Tooltip x={tooltip.x} y={tooltip.y} setTooltip={setTooltip} minWidth={100}>
            <p>{noteString(tooltip.content.note)} - MIDI CHANNEL OUT</p>
            <Dropdown
              value={lane.midiChannels[tooltip.content.note] || 'all'}
              setValue={(value) => {
                setUIState((uiState) => {
                  const uiStateCopy = deepStateCopy(uiState)
                  uiStateCopy.lanes.find((l) => l.id === tooltip.content.laneID).midiChannels[tooltip.content.note] =
                    value
                  return uiStateCopy
                })
              }}
              options={['all'].concat([...Array(16).keys()].map((n) => n + 1))}
              small
              noMinWidth
            />
          </Tooltip>
        )
      }
    }
    return null
  }, [grabbing, tooltip, uiState.lanes])

  const header = useMemo(
    () => (
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
        midiOutRef={midiOutRef}
        midiInRef={midiInRef}
        midiOuts={midiOuts}
        midiOut={midiOut}
        setMidiOut={setMidiOut}
        midiIns={midiIns}
        midiIn={midiIn}
        setMidiIn={setMidiIn}
        instrumentOn={instrumentOn}
        setInstrumentOn={setInstrumentOn}
        instrumentType={instrumentType}
        setInstrumentType={setInstrumentType}
        theme={theme}
        openInstrumentModal={openInstrumentModal}
        swing={swing}
        setSwing={setSwing}
        grabbing={grabbing}
        setGrabbing={setGrabbing}
        linearKnobs={linearKnobs}
        playheadResetRef={playheadResetRef}
        playheadStartPosition={playheadStartPosition}
        setModalType={setModalType}
      />
    ),
    [
      beatValue,
      beatsPerBar,
      grabbing,
      grid,
      instrumentOn,
      instrumentType,
      linearKnobs,
      midiIn,
      midiInRef,
      midiIns,
      midiOut,
      midiOutRef,
      midiOuts,
      openInstrumentModal,
      playing,
      setMidiIn,
      setMidiOut,
      snapToGrid,
      swing,
      tempo,
      theme,
    ]
  )

  return (
    <div
      id="main-container"
      className={classNames({
        grabbing,
        'ew-resizing': ewResizing,
        'ns-resizing': nsResizing,
        'dark-theme': theme === 'dark',
      })}
      ref={mainContainerRef}
      style={{
        '--eighth-width': EIGHTH_WIDTH + 'px',
        '--note-height': NOTE_HEIGHT + 'px',
        '--keys-width': KEYS_WIDTH + 'px',
      }}
      {...globalDrag()}>
      <div id="header-background"></div>
      {header}
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
      {tooltipEl}
      <div id="lane-overflow"></div>
      {endEl}
      {playheadEl}
      <CSSTransition in={!!modalType} timeout={300} classNames="show" onEnter={showModal} onExited={hideModal}>
        <Modal
          modalContent={modalContent}
          modalType={modalType}
          setModalType={setModalType}
          theme={theme}
          setTheme={setTheme}
          instrumentOn={instrumentOn}
          setInstrumentOn={setInstrumentOn}
          instrumentType={instrumentType}
          setInstrumentType={setInstrumentType}
          instrumentParams={instrumentParams}
          setInstrumentParams={setInstrumentParams}
          instruments={instruments}
          gainNode={gainNode}
          effects={effects}
          grabbing={grabbing}
          setGrabbing={setGrabbing}
          linearKnobs={linearKnobs}
          setLinearKnobs={setLinearKnobs}
          midiClockIn={midiClockIn}
          setMidiClockIn={setMidiClockIn}
          midiClockOut={midiClockOut}
          setMidiClockOut={setMidiClockOut}
          playheadReset={playheadReset}
          setPlayheadReset={setPlayheadReset}
        />
      </CSSTransition>
    </div>
  )
}

function laneCopy(lane, id, updateNoteIDs) {
  return Object.assign({}, lane, {
    id: id || lane.id,
    notes: lane.notes.map((n) => Object.assign({}, n, { id: updateNoteIDs ? uuid() : n.id })),
    viewRange: { ...lane.viewRange },
    midiChannels: { ...lane.midiChannels },
  })
}

function deepStateCopy(state) {
  return Object.assign({}, state, {
    lanes: state.lanes.map((l) => laneCopy(l)),
    delimiters: state.delimiters.slice(),
    instrumentParams: { ...state.instrumentParams },
    end: { ...state.end },
  })
}

// total % of lanes that are muted
function getTotalMuted(delimiter, uiState, anyLaneSoloed) {
  return Object.keys(delimiter.lanes).reduce((prev, curr) => {
    const lane = uiState.lanes.find((l) => l.id === curr)
    return (anyLaneSoloed && !lane.solo) || lane.mute ? prev + delimiter.lanes[curr] : prev
  }, 0)
}
