import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import Switch from 'react-switch'
import * as Tone from 'tone'
import NumInput from './ui/NumInput'
import Dropdown from './ui/Dropdown'
import Instrument from './ui/Instrument'
import RotaryKnob from './ui/RotaryKnob'
import { RATES, themedSwitch } from '../globals'
import { midiStartContinue, midiStop } from '../hooks/useMIDI'
import logo from '../assets/logo.png'
import logoDark from '../assets/logo-dark.png'
import play from '../assets/play.svg'
import playDark from '../assets/play-dark.svg'
import playHover from '../assets/play-hover.svg'
import stop from '../assets/stop.svg'
import stopDark from '../assets/stop-dark.svg'
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
  midiOutRef,
  midiInRef,
  midiOuts,
  midiOut,
  setMidiOut,
  midiIns,
  midiIn,
  setMidiIn,
  instrumentOn,
  setInstrumentOn,
  instrumentType,
  setInstrumentType,
  theme,
  openInstrumentModal,
  swing,
  setSwing,
  grabbing,
  setGrabbing,
  linearKnobs,
  playheadResetRef,
  playheadStartPosition,
  setModalType,
}) {
  const [hoverPlayStop, setHoverPlayStop] = useState(false)

  const playingRef = useRef(playing)
  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  const initialized = useRef()
  const playStop = useCallback(async () => {
    if (!playingRef.current) {
      if (!initialized.current) {
        await Tone.start()
        initialized.current = true
      }
      if (playheadResetRef.current) {
        playheadStartPosition.current = Tone.Transport.position
      }
      Tone.Transport.start()
      // MIDI out
      midiStartContinue(midiOutRef.current, midiInRef.current)
    } else {
      Tone.Transport.pause()
      if (playheadResetRef.current) {
        Tone.Transport.position = playheadStartPosition.current
      }
      // MIDI out
      midiStop(midiOutRef.current, midiInRef.current)
    }
    setPlaying((playing) => !playing)
    playingRef.current = !playingRef.current
  }, [midiInRef, midiOutRef, playheadResetRef, playheadStartPosition, setPlaying])

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

  const playGraphic = useMemo(() => {
    const playGraphic = theme === 'dark' ? playDark : play
    const stopGraphic = theme === 'dark' ? stopDark : stop
    return (
      <img
        src={playing ? (hoverPlayStop ? stopHover : stopGraphic) : hoverPlayStop ? playHover : playGraphic}
        alt="play/pause"
        id="play-pause"
        onMouseEnter={() => setHoverPlayStop(true)}
        onMouseLeave={() => setHoverPlayStop(false)}
        onClick={playStop}
      />
    )
  }, [hoverPlayStop, playStop, playing, theme])

  const snapOptions = useMemo(() => RATES.map((rate) => ({ value: rate, label: rate })), [])

  const offColor = useMemo(() => themedSwitch('offColor', theme), [theme])
  const onColor = useMemo(() => themedSwitch('onColor', theme), [theme])
  const offHandleColor = useMemo(() => themedSwitch('offHandleColor', theme, false), [theme])
  const onHandleColor = useMemo(() => themedSwitch('onHandleColor', theme), [theme])

  return (
    <div id="header">
      <img src={theme === 'dark' ? logoDark : logo} alt="Phrase Machine" id="logo" />
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
          offColor={offColor}
          onColor={onColor}
          offHandleColor={offHandleColor}
          onHandleColor={onHandleColor}
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
      <Instrument
        className="header-item channel-module"
        instrumentOn={instrumentOn}
        setInstrumentOn={setInstrumentOn}
        instrumentType={instrumentType}
        setInstrumentType={setInstrumentType}
        theme={theme}
        openInstrumentModal={openInstrumentModal}
        inModal={false}
      />
      <Dropdown
        className="header-item midi-dropdown"
        label="MIDI Out"
        options={midiOuts}
        setValue={setMidiOut}
        value={midiOut}
        placeholder="No MIDI Out"
        noOptions="MIDI only works in Google Chrome"
        small
      />
      <Dropdown
        className="header-item midi-dropdown"
        label="MIDI In"
        options={midiIns}
        setValue={setMidiIn}
        value={midiIn}
        placeholder="No MIDI In"
        noOptions="MIDI only works in Google Chrome"
        small
      />
      <RotaryKnob
        min={0}
        max={1}
        value={swing}
        setValue={setSwing}
        label="Swing"
        grabbing={grabbing}
        setGrabbing={setGrabbing}
        tiny
        mute={false}
        linearKnobs={linearKnobs}
        theme={theme}
      />
      <div className="header-aux">
        <div className="aux-item header-settings" onClick={() => setModalType('settings')} title="Settings"></div>
      </div>
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
  midiOutRef: PropTypes.object,
  midiInRef: PropTypes.object,
  midiOuts: PropTypes.array,
  midiOut: PropTypes.string,
  midiIns: PropTypes.array,
  midiIn: PropTypes.string,
  setMidiOut: PropTypes.func,
  setMidiIn: PropTypes.func,
  instrumentOn: PropTypes.bool,
  setInstrumentOn: PropTypes.func,
  instrumentType: PropTypes.string,
  setInstrumentType: PropTypes.func,
  theme: PropTypes.string,
  openInstrumentModal: PropTypes.func,
  swing: PropTypes.number,
  setSwing: PropTypes.func,
  grabbing: PropTypes.bool,
  setGrabbing: PropTypes.func,
  linearKnobs: PropTypes.bool,
  playheadResetRef: PropTypes.object,
  playheadStartPosition: PropTypes.object,
  setModalType: PropTypes.func,
}
