import React, { useState } from 'react'

export default function App() {
  const [lanes, setLanes] = useState([])

  return <div id="main-container">
    <div className="empty-lane"></div>
  </div>
}