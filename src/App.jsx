import React, { useState, useCallback, useMemo, useRef } from 'react'
import { DEFAULT_PRESET, MEASURE_WIDTH, LANE_COLORS } from './globals'
import Lane from './components/Lane'

// load/set presets
if (!window.localStorage.getItem('phrasePresets')) {
  window.localStorage.setItem('phrasePresets', DEFAULT_PRESET)
}

export default function App() {
  const [uiState, setUIState] = useState(JSON.parse(window.localStorage.getItem('phrasePresets')))
  const [snap, setSnap] = useState(null)
  const mainContainer = useRef()

  const setLaneState = useCallback(
    (id, state) => {
      setUIState((uiState) => {
        const uiStateCopy = deepStateCopy(uiState)
        const laneIndex = uiStateCopy.lanes.findIndex((l) => l.id === id)
        if (laneIndex !== -1) {
          uiStateCopy.lanes[laneIndex] = state
        }
        return uiStateCopy
      })
    },
    [setUIState]
  )

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
          mainContainer={mainContainer}
        />
      )),
    [setLaneState, uiState.lanes]
  )

  return (
    <div id="main-container" ref={mainContainer} style={{ '--measure-width': MEASURE_WIDTH + 'px' }}>
      {lanes}
      {!uiState.lanes.length && <div className="empty-lane"></div>}
    </div>
  )
}

function laneCopy(lane) {
  return Object.assign({}, lane, {
    measures: lane.measures.map((m) => Object.assign({}, m)),
    viewRange: Object.assign({}, lane.viewRange),
  })
}

function deepStateCopy(state) {
  return Object.assign({}, state, { lanes: state.lanes.map((l) => laneCopy(l)) })
}
