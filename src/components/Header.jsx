import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import Switch from 'react-switch'
import * as Tone from 'tone'
import NumInput from './ui/NumInput'
import Dropdown from './ui/Dropdown'
import { RATES } from '../globals'
import logo from '../assets/logo.png'
import play from '../assets/play.svg'
import playHover from '../assets/play-hover.svg'
import stop from '../assets/stop.svg'
import stopHover from '../assets/stop-hover.svg'
import './Header.scss'

const BEATS_PER_BAR_OPTIONS = [
  { value: 4, label: '4' },
  { value: 8, label: '8' },
]

export default function Header({
  playing,
  setPlaying,
  tempo,
  setTempo,
  snapToGrid,
  setSnapToGrid,
  grid,
  setGrid,
  beatsPerBar,
  setBeatsPerBar,
  beatValue,
  setBeatValue,
}) {
  const [hoverPlayStop, setHoverPlayStop] = useState(false)

  const playingRef = useRef()
  const initialized = useRef()
  const playStop = useCallback(async () => {
    if (!playingRef.current) {
      if (!initialized.current) {
        await Tone.start()
        initialized.current = true
      }
      Tone.Transport.start()
    } else {
      Tone.Transport.pause()
    }
    setPlaying((playing) => !playing)
    playingRef.current = !playingRef.current
  }, [setPlaying])

  useEffect(() => {
    function keydown(e) {
      if (
        e.key === ' ' &&
        document.activeElement?.nodeName !== 'TEXTAREA' &&
        document.activeElement?.nodeName !== 'INPUT'
      ) {
        e.preventDefault()
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

  const snapOptions = useMemo(() => RATES.map((rate) => ({ value: rate, label: rate })), [])

  return (
    <div id="header">
      <img src={logo} alt="Phrase Machine" id="logo" />
      {playGraphic}
      <NumInput className="header-item" label="Tempo" value={tempo} setValue={setTempo} min={0} max={300} small />
      <NumInput
        className="header-item"
        label="Time Signature"
        value={beatsPerBar}
        setValue={setBeatsPerBar}
        min={1}
        max={15}
        small
      />
      <div className="divided-by"></div>
      <Dropdown
        className="header-item"
        value={beatValue}
        setValue={setBeatValue}
        options={BEATS_PER_BAR_OPTIONS}
        small
      />
      <div className="switch-container header-item">
        <Switch
          className="instrument-switch"
          onChange={setSnapToGrid}
          checked={snapToGrid}
          uncheckedIcon={false}
          checkedIcon={false}
          offColor={'#a8d6ff'}
          onColor={'#a8d6ff'}
          offHandleColor={'#008dff'}
          onHandleColor={'#ff88e3'}
          width={48}
          height={24}
        />
        <p className="header-label">Snap</p>
      </div>
      <Dropdown
        className="header-item no-text-transform"
        label="Grid"
        value={grid}
        setValue={setGrid}
        options={snapOptions}
        small
      />
    </div>
  )
}
Header.propTypes = {
  playing: PropTypes.bool,
  setPlaying: PropTypes.func,
  tempo: PropTypes.number,
  setTempo: PropTypes.func,
  snapToGrid: PropTypes.bool,
  setSnapToGrid: PropTypes.func,
  grid: PropTypes.string,
  setGrid: PropTypes.func,
  beatsPerBar: PropTypes.number,
  setBeatsPerBar: PropTypes.func,
  beatValue: PropTypes.number,
  setBeatValue: PropTypes.func,
}
