import { useState, useRef, useEffect } from 'react'
import WebMidi from 'webmidi'
import * as Tone from 'tone'

const MIDI_IO_CHANGED = {
  IN: 0,
  OUT: 0,
}

export default function useMIDI(setPlaying, resetTransport, playheadResetRef, playheadStartPosition) {
  const [midiEnabled, setMidiEnabled] = useState(false)
  const [midiOut, setMidiOut] = useState(null)
  const midiOutRef = useRef()
  const [midiOuts, setMidiOuts] = useState([])
  const [midiIn, setMidiIn] = useState(null)
  const midiInRef = useRef()
  const [midiIns, setMidiIns] = useState([])
  const [midiNoteOn, setMidiNoteOn] = useState(null)
  const [midiNoteOff, setMidiNoteOff] = useState(null)
  const [midiClockIn, setMidiClockIn] = useState(JSON.parse(window.localStorage.getItem('midiClockIn')) ?? true)
  const [midiClockOut, setMidiClockOut] = useState(JSON.parse(window.localStorage.getItem('midiClockOut')) ?? true)

  useEffect(() => {
    if (WebMidi.enabled) {
      window.localStorage.setItem('midiIn', midiIn)
    }
  }, [midiIn])

  useEffect(() => {
    if (WebMidi.enabled) {
      window.localStorage.setItem('midiOut', midiOut)
    }
  }, [midiOut])

  useEffect(() => {
    WebMidi.midiClockIn = midiClockIn
    window.localStorage.setItem('midiClockIn', midiClockIn)
  }, [midiClockIn])

  useEffect(() => {
    WebMidi.midiClockOut = midiClockOut
    window.localStorage.setItem('midiClockOut', midiClockOut)
  }, [midiClockOut])

  // init MIDI

  useEffect(() => {
    function connectMidi() {
      setMidiOuts(WebMidi.outputs.map((o) => o.name).concat(['(None)']))
      setMidiIns(WebMidi.inputs.map((i) => i.name).concat(['(None)']))
    }
    function disconnectMidi(e) {
      setMidiOuts(WebMidi.outputs.map((o) => o.name).concat(['(None)']))
      setMidiOut((midiOut) => (e.port.name === midiOut ? null : midiOut))
      setMidiIns(WebMidi.inputs.map((i) => i.name).concat(['(None)']))
      setMidiIn((midiIn) => (e.port.name === midiIn ? null : midiIn))
    }
    WebMidi.enable((err) => {
      if (err) {
        console.log(err)
      } else {
        // initialize MIDI I/O
        const mo = window.localStorage.getItem('midiOut')
        setMidiOut(() => (WebMidi.outputs.map((o) => o.name).includes(mo) && mo) || null)
        const mi = window.localStorage.getItem('midiIn')
        setMidiIn(() => (WebMidi.inputs.map((i) => i.name).includes(mi) && mi) || null)
        // schedule MIDI clock output
        Tone.Transport.midiContinue = false
        if (Tone.Transport.PPQ % 24 === 0) {
          Tone.Transport.scheduleRepeat((time) => {
            if (
              WebMidi.midiClockOut &&
              midiOutRef.current &&
              (!midiInRef.current || midiInRef.current.name !== midiOutRef.current)
            ) {
              const clockOffset = WebMidi.time - Tone.immediate() * 1000
              WebMidi.getOutputByName(midiOutRef.current).sendClock({
                time: time * 1000 + clockOffset + 10,
              })
            }
          }, Tone.Transport.PPQ / 24 + 'i')
        }
        setMidiEnabled(true)
        WebMidi.addListener('connected', connectMidi)
        WebMidi.addListener('disconnected', disconnectMidi)
      }
    })
    return () => {
      WebMidi.removeListener('connected', connectMidi)
      WebMidi.removeListener('disconnected', disconnectMidi)
    }
  }, [])

  // update MIDI ins and outs

  useEffect(() => {
    if (midiInRef.current) {
      midiInRef.current.removeListener()
    }
    if (midiIn) {
      if (midiIn === midiOutRef.current && MIDI_IO_CHANGED.IN > 2) {
        alert(
          'Setting MIDI input to current MIDI output - to avoid circular MIDI, the MIDI input will only receive MIDI clock, and the MIDI output will not send MIDI clock.'
        )
      }
      midiInRef.current = WebMidi.getInputByName(midiIn)
      // MIDI input listeners
      midiInRef.current.addListener('noteon', 'all', (e) => {
        if (midiIn !== midiOutRef.current) {
          setMidiNoteOn(e)
        }
      })
      midiInRef.current.addListener('noteoff', 'all', (e) => {
        if (midiIn !== midiOutRef.current) {
          setMidiNoteOff(e)
        }
      })
      midiInRef.current.addListener('start', 'all', (e) => {
        if (WebMidi.midiClockIn) {
          if (playheadResetRef.current) {
            playheadStartPosition.current = Tone.Transport.position
          }
          Tone.Transport.start()
          setPlaying(true)
          // MIDI out
          midiStartContinue(midiOutRef.current, midiIn)
        }
      })
      midiInRef.current.addListener('continue', 'all', (e) => {
        if (WebMidi.midiClockIn) {
          if (playheadResetRef.current) {
            playheadStartPosition.current = Tone.Transport.position
          }
          Tone.Transport.start()
          setPlaying(true)
          // MIDI out
          midiStartContinue(midiOutRef.current, midiIn)
        }
      })
      midiInRef.current.addListener('stop', 'all', (e) => {
        if (WebMidi.midiClockIn) {
          Tone.Transport.pause()
          if (playheadResetRef.current) {
            Tone.Transport.position = playheadStartPosition.current
          }
          setPlaying(false)
          // MIDI out
          midiStop(midiOutRef.current, midiIn)
        }
      })
      midiInRef.current.addListener('songposition', 'all', (e) => {
        if (WebMidi.midiClockIn && e.data && e.data[0] === 242 && e.data[1] === 0) {
          resetTransport()
          // MIDI out
          midiSongpositionReset(midiOutRef.current, midiIn)
        }
      })
    } else {
      midiInRef.current = null
    }
    MIDI_IO_CHANGED.IN++
  }, [midiIn, setPlaying, resetTransport, playheadResetRef, playheadStartPosition])

  useEffect(() => {
    if (midiOut && midiInRef.current && midiOut === midiInRef.current.name && MIDI_IO_CHANGED.OUT > 2) {
      alert(
        'Setting MIDI output to current MIDI input - to avoid circular MIDI, the MIDI input will only receive MIDI clock, and the MIDI output will not send MIDI clock.'
      )
    }
    midiOutRef.current = midiOut
    MIDI_IO_CHANGED.OUT++
  }, [midiOut])

  return {
    midiOutRef,
    midiInRef,
    midiOut,
    midiIn,
    midiNoteOn,
    midiNoteOff,
    midiOuts,
    midiIns,
    setMidiOut,
    setMidiIn,
    midiEnabled,
    midiClockIn,
    setMidiClockIn,
    midiClockOut,
    setMidiClockOut,
  }
}

// MIDI out

export function midiStartContinue(midiOut, midiIn) {
  if (WebMidi.midiClockOut && midiOut && midiOut !== midiIn) {
    const midiOutObj = WebMidi.getOutputByName(midiOut)
    if (Tone.Transport.midiContinue) {
      midiOutObj.sendContinue()
    } else {
      midiOutObj.sendStart()
      Tone.Transport.midiContinue = true
    }
  }
}

export function midiSongpositionReset(midiOut, midiIn) {
  if (WebMidi.midiClockOut && midiOut && midiOut !== midiIn) {
    WebMidi.getOutputByName(midiOut).sendSongPosition(0)
  }
}

export function midiStop(midiOut, midiIn, reset) {
  if (WebMidi.midiClockOut && midiOut && midiOut !== midiIn) {
    WebMidi.getOutputByName(midiOut).sendStop()
    if (reset) {
      midiSongpositionReset(midiOut, midiIn)
      Tone.Transport.midiContinue = false
    }
  }
}
