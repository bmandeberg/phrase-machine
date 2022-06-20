import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { useGesture } from 'react-use-gesture'
import { DEFAULT_PRESET, MEASURE_WIDTH, LANE_COLORS, NOTE_HEIGHT, KEYS_WIDTH } from './globals'
import Lane from './components/Lane'
import Header from './components/Header'
import './App.scss'
import { boxesIntersect } from './util'

// load/set presets
if (!window.localStorage.getItem('phrasePresets')) {
  window.localStorage.setItem('phrasePresets', DEFAULT_PRESET)
}

export default function App() {
  const [uiState, setUIState] = useState(JSON.parse(window.localStorage.getItem('phrasePresets')))
  const [snap, setSnap] = useState(uiState.snap)
  const [beatsPerBar, setBeatsPerBar] = useState(uiState.beatsPerBar)
  const [beatValue, setBeatValue] = useState(uiState.beatValue)
  const mainContainerRef = useRef()

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

  const [selectingDimensions, setSelectingDimensions] = useState(null)
  const dragSelecting = useRef(false)
  const dragSelectNotes = useGesture({
    onDragStart: ({ initial: [x, y], metaKey, event }) => {
      if (!metaKey && event.button === 0) {
        dragSelecting.current = true
        setSelectingDimensions({
          x,
          y,
          width: 0,
          height: 0,
        })
      }
    },
    onDrag: ({ movement: [mx, my], initial: [ix, iy], metaKey }) => {
      if (!metaKey && dragSelecting.current) {
        const newDimensions = { width: Math.abs(mx), height: Math.abs(my) }
        newDimensions.x = (mx > 0 ? ix : ix - newDimensions.width) + mainContainerRef?.current?.scrollLeft
        newDimensions.y = (my > 0 ? iy : iy - newDimensions.height) + mainContainerRef?.current?.scrollTop
        setSelectingDimensions(newDimensions)
      }
    },
    onDragEnd: ({ event }) => {
      if (event.button === 0) {
        const selectedNotes = {}
        // gather notes that intersect with selection bounds
        mainContainerRef.current?.querySelectorAll('.lane-container').forEach((lane, i) => {
          const laneData = uiState.lanes[i]
          laneData.notes.forEach((note) => {
            const noteX = lane.offsetLeft + note.x + KEYS_WIDTH
            const noteY = lane.offsetTop + (laneData.viewRange.max - note.midiNote) * NOTE_HEIGHT
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
        // broadcast selected notes
        window.dispatchEvent(
          new CustomEvent('selectNotes', {
            detail: selectedNotes,
          })
        )
        dragSelecting.current = false
        setSelectingDimensions(null)
      }
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
          mainContainer={mainContainerRef}
          beatsPerBar={beatsPerBar}
          beatValue={beatValue}
        />
      )),
    [beatValue, beatsPerBar, setLaneState, uiState.lanes]
  )

  return (
    <div
      id="main-container"
      ref={mainContainerRef}
      style={{
        '--measure-width': MEASURE_WIDTH + 'px',
        '--note-height': NOTE_HEIGHT + 'px',
        '--keys-width': KEYS_WIDTH + 'px',
      }}
      {...dragSelectNotes()}>
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
      {lanes}
      {!uiState.lanes.length && <div className="empty-lane"></div>}
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
