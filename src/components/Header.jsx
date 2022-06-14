import React, { useState, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import logo from '../assets/logo.png'
import './Header.scss'
import play from '../assets/play.svg'
import playHover from '../assets/play-hover.svg'
import stop from '../assets/stop.svg'
import stopHover from '../assets/stop-hover.svg'

export default function Header({ playing, setPlaying, tempo, setTempo }) {
  const [hoverPlayStop, setHoverPlayStop] = useState(false)

  const playStop = useCallback(() => {
    setPlaying((playing) => !playing)
  }, [setPlaying])

  const playGraphic = useMemo(
    () => (
      <img
        src={playing ? (hoverPlayStop ? stopHover : stop) : hoverPlayStop ? playHover : play}
        alt="play/pause"
        id="play-pause"
        onMouseEnter={() => setHoverPlayStop(true)}
        onMouseLeave={() => setHoverPlayStop(false)}
        onClick={playStop}
      />
    ),
    [hoverPlayStop, playStop, playing]
  )

  return (
    <div id="header">
      <img src={logo} alt="Phrase Machine" id="logo" />
      {playGraphic}
    </div>
  )
}
Header.propTypes = {
  playing: PropTypes.bool,
  setPlaying: PropTypes.func,
  tempo: PropTypes.number,
  setTempo: PropTypes.func,
}
