import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import Switch from 'react-switch'
import Dropdown from './Dropdown'
import { THEMES, themedSwitch } from '../../globals'
import './Settings.scss'

export default function Settings({
  linearKnobs,
  setLinearKnobs,
  theme,
  setTheme,
  midiClockIn,
  setMidiClockIn,
  midiClockOut,
  setMidiClockOut,
  playheadReset,
  setPlayheadReset,
}) {
  const setKnobType = useCallback(
    (knobType) => {
      setLinearKnobs(knobType === 'Linear')
    },
    [setLinearKnobs]
  )

  const knobsDropdownValue = useMemo(() => (linearKnobs ? 'Linear' : 'Relative Circular'), [linearKnobs])

  const offColor = useMemo(() => themedSwitch('offColor', theme), [theme])
  const onColor = useMemo(() => themedSwitch('onColor', theme), [theme])
  const offHandleColor = useMemo(() => themedSwitch('offHandleColor', theme, false), [theme])
  const onHandleColor = useMemo(() => themedSwitch('onHandleColor', theme), [theme])

  const clearLocalStorage = useCallback(() => {
    const confirmClear = window.confirm('Are you sure you want to delete all presets and settings ⁉️')
    if (confirmClear) {
      localStorage.clear()
      window.location.reload()
    }
  }, [])

  return (
    <div className="settings">
      <div className="settings-item">
        <p className="settings-label">Playhead reset</p>
        <Switch
          className="instrument-switch"
          onChange={setPlayheadReset}
          checked={playheadReset}
          uncheckedIcon={false}
          checkedIcon={false}
          offColor={offColor}
          onColor={onColor}
          offHandleColor={offHandleColor}
          onHandleColor={onHandleColor}
          width={48}
          height={24}
        />
      </div>
      <div className="settings-item">
        <p className="settings-label">MIDI clock in</p>
        <Switch
          className="instrument-switch"
          onChange={setMidiClockIn}
          checked={midiClockIn}
          uncheckedIcon={false}
          checkedIcon={false}
          offColor={offColor}
          onColor={onColor}
          offHandleColor={offHandleColor}
          onHandleColor={onHandleColor}
          width={48}
          height={24}
        />
      </div>
      <div className="settings-item">
        <p className="settings-label">MIDI clock out</p>
        <Switch
          className="instrument-switch"
          onChange={setMidiClockOut}
          checked={midiClockOut}
          uncheckedIcon={false}
          checkedIcon={false}
          offColor={offColor}
          onColor={onColor}
          offHandleColor={offHandleColor}
          onHandleColor={onHandleColor}
          width={48}
          height={24}
        />
      </div>
      <div className="settings-item dropdown">
        <p className="settings-label">Theme</p>
        <Dropdown options={THEMES} value={theme} setValue={setTheme} capitalize />
      </div>
      <div className="settings-item dropdown">
        <p className="settings-label">Knob type</p>
        <Dropdown
          options={['Linear', 'Relative Circular']}
          value={knobsDropdownValue}
          setValue={setKnobType}
          noTextTransform
          container=".settings"
        />
      </div>
      <div className="settings-item" style={{ marginTop: 24 }}>
        <button onClick={clearLocalStorage} className="button red-button">
          Delete Presets and Settings
        </button>
      </div>
    </div>
  )
}
Settings.propTypes = {
  linearKnobs: PropTypes.bool,
  setLinearKnobs: PropTypes.func,
  theme: PropTypes.string,
  setTheme: PropTypes.func,
  midiClockIn: PropTypes.bool,
  setMidiClockIn: PropTypes.func,
  midiClockOut: PropTypes.bool,
  setMidiClockOut: PropTypes.func,
  playheadReset: PropTypes.bool,
  setPlayheadReset: PropTypes.func,
}
