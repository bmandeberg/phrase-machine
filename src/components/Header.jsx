import React, { useState, useCallback, useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'
import NumInput from './ui/NumInput'
import Dropdown from './ui/Dropdown'
import { RATES } from '../globals'
import logo from '../assets/logo.png'
import play from '../assets/play.svg'
import playHover from '../assets/play-hover.svg'
import stop from '../assets/stop.svg'
import stopHover from '../assets/stop-hover.svg'
import './Header.scss'

export default function Header({ playing, setPlaying, tempo, setTempo, snap, setSnap }) {
  const [hoverPlayStop, setHoverPlayStop] = useState(false)

  const playStop = useCallback(() => {
    setPlaying((playing) => !playing)
  }, [setPlaying])

  useEffect(() => {
    function keydown(e) {
      if (
        e.key === ' ' &&
        document.activeElement?.nodeName !== 'TEXTAREA' &&
        document.activeElement?.nodeName !== 'INPUT'
      ) {
        playStop()
      }
    }
    window.addEventListener('keydown', keydown)
    return () => {
      window.removeEventListener('keydown', keydown)
    }
  }, [playStop])

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

  const snapOptions = useMemo(
    () => [{ value: null, label: 'NONE' }].concat(RATES.map((rate) => ({ value: rate, label: rate }))),
    []
  )

  return (
    <div id="header">
      <img src={logo} alt="Phrase Machine" id="logo" />
      {playGraphic}
      <NumInput className="header-item" label="Tempo" value={tempo} setValue={setTempo} min={0} max={300} small />
      <Dropdown className="header-item no-text-transform" label="Snap" value={snap} setValue={setSnap} options={snapOptions} small />
    </div>
  )
}
Header.propTypes = {
  playing: PropTypes.bool,
  setPlaying: PropTypes.func,
  tempo: PropTypes.number,
  setTempo: PropTypes.func,
  snap: PropTypes.bool,
  setSnap: PropTypes.func,
}
