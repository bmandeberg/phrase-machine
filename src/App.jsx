import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { useGesture } from 'react-use-gesture'
import { DEFAULT_PRESET, MEASURE_WIDTH, LANE_COLORS } from './globals'
import Lane from './components/Lane'
import Header from './components/Header'
import './App.scss'

// load/set presets
if (!window.localStorage.getItem('phrasePresets')) {
  window.localStorage.setItem('phrasePresets', DEFAULT_PRESET)
}

export default function App() {
  const [uiState, setUIState] = useState(JSON.parse(window.localStorage.getItem('phrasePresets')))
  const [snap, setSnap] = useState(uiState.snap)
  const mainContainerRef = useRef()

  // transport
  const [playing, setPlaying] = useState(false)
  const [tempo, setTempo] = useState(uiState.tempo)
  useEffect(() => {
    if (Tone.Transport.bpm.value !== tempo) {
      Tone.Transport.bpm.value = tempo
    }
  }, [tempo])

  const [selectingDimensions, setSelectingDimensions] = useState(null)
  const dragSelectNotes = useGesture({
    onDragStart: ({ initial: [x, y], metaKey }) => {
      if (!metaKey) {
        setSelectingDimensions({
          x,
          y,
          width: 0,
          height: 0,
        })
      }
    },
    onDrag: ({ movement: [mx, my], initial: [ix, iy], metaKey }) => {
      if (!metaKey) {
        const newDimensions = { width: Math.abs(mx), height: Math.abs(my) }
        newDimensions.x = (mx > 0 ? ix : ix - newDimensions.width) + mainContainerRef?.current?.scrollLeft
        newDimensions.y = (my > 0 ? iy : iy - newDimensions.height) + mainContainerRef?.current?.scrollTop
        setSelectingDimensions(newDimensions)
      }
    },
    onDragEnd: () => {
      setSelectingDimensions(null)
    },
  })

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

  const lanes = useMemo(
    () =>
      uiState.lanes.map((lane, i) => (
        <Lane
          key={lane.id}
          id={lane.id}
          color={LANE_COLORS[i]}
          laneNum={i}
          lanePreset={lane}
          setLaneState={setLaneState}
          mainContainerRef={mainContainerRef}
        />
      )),
    [setLaneState, uiState.lanes]
  )

  return (
    <div
      id="main-container"
      ref={mainContainerRef}
      style={{ '--measure-width': MEASURE_WIDTH + 'px' }}
      {...dragSelectNotes()}>
      <Header
        playing={playing}
        setPlaying={setPlaying}
        tempo={tempo}
        setTempo={setTempo}
        snap={snap}
        setSnap={setSnap}
      />
      {lanes}
      {!uiState.lanes.length && <div className="empty-lane"></div>}
      {selectingDimensions && (
        <div
          id="drag-select"
          style={{
            top: selectingDimensions.y,
            left: selectingDimensions.x,
            width: selectingDimensions.width,
            height: selectingDimensions.height,
          }}></div>
      )}
    </div>
  )
}

function laneCopy(lane) {
  return Object.assign({}, lane, {
    delimiters: lane.delimiters.map((d) => Object.assign({}, d)),
    notes: lane.notes.map((n) => Object.assign({}, n)),
    viewRange: Object.assign({}, lane.viewRange),
  })
}

function deepStateCopy(state) {
  return Object.assign({}, state, { lanes: state.lanes.map((l) => laneCopy(l)) })
}
