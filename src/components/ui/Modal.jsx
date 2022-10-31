import React, { useCallback, useRef, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import InstrumentModal from './InstrumentModal'
import classNames from 'classnames'
import './Modal.scss'
import Settings from './Settings'

export default function Modal({
  modalType,
  setModalType,
  modalContent,
  instrumentOn,
  setInstrumentOn,
  instrumentType,
  setInstrumentType,
  instrumentParams,
  setInstrumentParams,
  instruments,
  gainNode,
  effects,
  grabbing,
  setGrabbing,
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
  const modalTypeRef = useRef()

  const closeModal = useCallback(() => {
    setModalType(null)
  }, [setModalType])

  const clickScrim = useCallback(
    (e) => {
      if (e.target.classList.contains('modal-container')) {
        closeModal()
      }
    },
    [closeModal]
  )

  useEffect(() => {
    function keydown(e) {
      if (e.key === 'Escape') {
        closeModal()
      }
    }
    document.addEventListener('keydown', keydown)
    return () => {
      document.removeEventListener('keydown', keydown)
    }
  }, [closeModal])

  useEffect(() => {
    if (modalType) {
      modalTypeRef.current = modalType
    }
  }, [modalType])

  const settingsEl = useMemo(
    () => (
      <Settings
        linearKnobs={linearKnobs}
        setLinearKnobs={setLinearKnobs}
        theme={theme}
        setTheme={setTheme}
        midiClockIn={midiClockIn}
        setMidiClockIn={setMidiClockIn}
        midiClockOut={midiClockOut}
        setMidiClockOut={setMidiClockOut}
        playheadReset={playheadReset}
        setPlayheadReset={setPlayheadReset}
      />
    ),
    [
      linearKnobs,
      midiClockIn,
      midiClockOut,
      playheadReset,
      setLinearKnobs,
      setMidiClockIn,
      setMidiClockOut,
      setPlayheadReset,
      setTheme,
      theme,
    ]
  )

  const instrumentEl = useMemo(
    () => (
      <InstrumentModal
        instrumentOn={instrumentOn}
        setInstrumentOn={setInstrumentOn}
        instrumentType={instrumentType}
        setInstrumentType={setInstrumentType}
        instrumentParams={instrumentParams}
        setInstrumentParams={setInstrumentParams}
        instruments={instruments}
        gainNode={gainNode}
        effects={effects}
        theme={theme}
        grabbing={grabbing}
        setGrabbing={setGrabbing}
        linearKnobs={linearKnobs}
      />
    ),
    [
      effects,
      gainNode,
      grabbing,
      instrumentOn,
      instrumentParams,
      instrumentType,
      instruments,
      linearKnobs,
      setGrabbing,
      setInstrumentOn,
      setInstrumentParams,
      setInstrumentType,
      theme,
    ]
  )

  return (
    <div className="modal-container" onClick={clickScrim}>
      <div className={classNames('modal-buffer', { 'small-buffer': modalTypeRef.current === 'about' })}>
        <div className="modal-window">
          <div className="modal-header">
            <p>{modalTypeRef.current}</p>
            <div className="modal-close" onClick={closeModal}></div>
          </div>
          <div className={classNames('modal-content', { 'full-modal': modalTypeRef.current === 'about' })}>
            {modalTypeRef.current === 'instrument' && modalContent && instrumentEl}
            {modalTypeRef.current === 'settings' && modalContent && settingsEl}
          </div>
        </div>
      </div>
    </div>
  )
}
Modal.propTypes = {
  modalContent: PropTypes.bool,
  modalType: PropTypes.string,
  setModalType: PropTypes.func,
  showStepNumbers: PropTypes.bool,
  setShowStepNumbers: PropTypes.func,
  linearKnobs: PropTypes.bool,
  setLinearKnobs: PropTypes.func,
  defaultChannelModeKeybd: PropTypes.bool,
  setDefaultChannelModeKeybd: PropTypes.func,
  theme: PropTypes.string,
  setTheme: PropTypes.func,
  midiHold: PropTypes.bool,
  setMidiHold: PropTypes.func,
  customMidiOutChannel: PropTypes.bool,
  setCustomMidiOutChannel: PropTypes.func,
  channelNum: PropTypes.number,
  midiOutChannel: PropTypes.number,
  setMidiOutChannel: PropTypes.func,
  presets: PropTypes.array,
  importPresets: PropTypes.func,
  instrumentOn: PropTypes.bool,
  setInstrumentOn: PropTypes.func,
  instrumentType: PropTypes.string,
  setInstrumentType: PropTypes.func,
  instrumentParams: PropTypes.object,
  setInstrumentParams: PropTypes.func,
  instruments: PropTypes.object,
  gainNode: PropTypes.object,
  effects: PropTypes.object,
  grabbing: PropTypes.bool,
  setGrabbing: PropTypes.func,
  presetsRestartTransport: PropTypes.bool,
  setPresetsRestartTransport: PropTypes.func,
  midiClockIn: PropTypes.bool,
  setMidiClockIn: PropTypes.func,
  midiClockOut: PropTypes.bool,
  setMidiClockOut: PropTypes.func,
  ignorePresetsTempo: PropTypes.bool,
  setIgnorePresetsTempo: PropTypes.func,
  presetsStopTransport: PropTypes.bool,
  setPresetsStopTransport: PropTypes.func,
  playheadReset: PropTypes.bool,
  setPlayheadReset: PropTypes.func,
}
