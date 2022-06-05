import React, { useState } from 'react'
import { DEFAULT_PRESET, MEASURE_WIDTH } from './globals'

// load/set presets
if (!window.localStorage.getItem('phrasePresets')) {
  window.localStorage.setItem('phrasePresets', DEFAULT_PRESET)
}

export default function App() {
  const [uiState, setUIState] = useState(JSON.parse(window.localStorage.getItem('phrasePresets')))

  return (
    <div id="main-container" style={{ '--measure-width': MEASURE_WIDTH + 'px' }}>
      {!uiState.lanes.length && <div className="empty-lane"></div>}
    </div>
  )
}
