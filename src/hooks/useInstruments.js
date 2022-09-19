import { useRef, useEffect, useCallback, useMemo } from 'react'
import { CHORUS_ENABLED } from '../globals'
import * as Tone from 'tone'

export default function useInstruments(instrument, instrumentParams, instrumentType, cleanup, setModalType) {
  const instrumentParamsRef = useRef(instrumentParams)
  useEffect(() => {
    instrumentParamsRef.current = instrumentParams
  }, [instrumentParams])

  const cleanupRef = useRef(cleanup)
  useEffect(() => {
    cleanupRef.current = cleanup
  }, [cleanup])

  const getCurrentEffect = useCallback(() => {
    let effect
    switch (instrumentParamsRef.current.effectType) {
      case 'chorus':
        effect = chorusEffect.current
        break
      case 'distortion':
        effect = distortionEffect.current
        break
      case 'delay':
        effect = delayEffect.current
        break
      case 'reverb':
        effect = reverbEffect.current
        break
      case 'vibrato':
        effect = vibratoEffect.current
        break
      default:
        effect = gainNode.current
    }
    return effect || gainNode.current
  }, [])

  // instrument

  const initInstrumentType = useRef(instrumentType)
  const gainNode = useRef()
  const synthInstrument = useRef()
  const drumsInstrument = useRef()
  const drumMachineInstrument = useRef()
  const pianoInstrument = useRef()
  const marimbaInstrument = useRef()
  const bassInstrument = useRef()
  const vibesInstrument = useRef()
  const harpInstrument = useRef()
  const choralInstrument = useRef()
  const chorusEffect = useRef()
  const distortionEffect = useRef()
  const delayEffect = useRef()
  const reverbEffect = useRef()
  const vibratoEffect = useRef()

  const initSynthInstrument = useCallback(() => {
    if (!synthInstrument.current) {
      synthInstrument.current = new Tone.MonoSynth({
        portamento: instrumentParamsRef.current.portamento,
        volume: -8,
        oscillator: {
          type: instrumentParamsRef.current.synthType,
          modulationType: instrumentParamsRef.current.modulationType,
          harmonicity: instrumentParamsRef.current.harmonicity,
          spread: instrumentParamsRef.current.fatSpread,
          count: instrumentParamsRef.current.fatCount,
          width: instrumentParamsRef.current.pulseWidth,
          modulationFrequency: instrumentParamsRef.current.pwmFreq,
        },
        envelope: {
          attack: instrumentParamsRef.current.envAttack,
          decay: instrumentParamsRef.current.envDecay,
          sustain: instrumentParamsRef.current.envSustain,
          release: instrumentParamsRef.current.envRelease,
        },
        filter: {
          Q: instrumentParamsRef.current.resonance,
          rolloff: instrumentParamsRef.current.rolloff,
        },
        filterEnvelope: {
          baseFrequency: instrumentParamsRef.current.cutoff,
          attack: instrumentParamsRef.current.filterAttack,
          decay: instrumentParamsRef.current.filterDecay,
          sustain: instrumentParamsRef.current.filterSustain,
          release: instrumentParamsRef.current.filterRelease,
          octaves: instrumentParamsRef.current.filterAmount,
        },
      })
      synthInstrument.current.connect(getCurrentEffect())
    }
  }, [getCurrentEffect])

  const initPianoInstrument = useCallback(() => {
    if (!pianoInstrument.current) {
      pianoInstrument.current = new Tone.Sampler({
        urls: {
          C1: 'Piano_C1.mp3',
          C2: 'Piano_C2.mp3',
          C3: 'Piano_C3.mp3',
          C4: 'Piano_C4.mp3',
          C5: 'Piano_C5.mp3',
          C6: 'Piano_C6.mp3',
          C7: 'Piano_C7.mp3',
          C8: 'Piano_C8.mp3',
        },
        baseUrl: window.location.origin + '/samples/piano/',
      })
      pianoInstrument.current.set({
        attack: instrumentParamsRef.current.samplerAttack,
        release: instrumentParamsRef.current.samplerRelease,
        volume: -5,
      })
      pianoInstrument.current.connect(getCurrentEffect())
    }
  }, [getCurrentEffect])

  const initMarimbaInstrument = useCallback(() => {
    if (!marimbaInstrument.current) {
      marimbaInstrument.current = new Tone.Sampler({
        urls: {
          // C1: 'Marimba_C1.mp3',
          // C2: 'Marimba_C2.mp3',
          // C3: 'Marimba_C3.mp3',
          C4: 'Marimba_C4.mp3',
          C5: 'Marimba_C5.mp3',
          C6: 'Marimba_C6.mp3',
          C7: 'Marimba_C7.mp3',
          C8: 'Marimba_C8.mp3',
        },
        baseUrl: window.location.origin + '/samples/marimba/',
      })
      marimbaInstrument.current.set({
        attack: instrumentParamsRef.current.samplerAttack,
        release: instrumentParamsRef.current.samplerRelease,
        volume: -6,
      })
      marimbaInstrument.current.connect(getCurrentEffect())
    }
  }, [getCurrentEffect])

  const initBassInstrument = useCallback(() => {
    if (!bassInstrument.current) {
      bassInstrument.current = new Tone.Sampler({
        urls: {
          C1: 'Bass_C1.mp3',
          C2: 'Bass_C2.mp3',
          C3: 'Bass_C3.mp3',
          C4: 'Bass_C4.mp3',
          C5: 'Bass_C5.mp3',
          C6: 'Bass_C6.mp3',
          C7: 'Bass_C7.mp3',
          C8: 'Bass_C8.mp3',
        },
        baseUrl: window.location.origin + '/samples/bass/',
      })
      bassInstrument.current.set({
        attack: instrumentParamsRef.current.samplerAttack,
        release: instrumentParamsRef.current.samplerRelease,
        volume: -4,
      })
      bassInstrument.current.connect(getCurrentEffect())
    }
  }, [getCurrentEffect])

  const initVibesInstrument = useCallback(() => {
    if (!vibesInstrument.current) {
      vibesInstrument.current = new Tone.Sampler({
        urls: {
          // C1: 'Vibraphone_C1.mp3',
          // C2: 'Vibraphone_C2.mp3',
          // C3: 'Vibraphone_C3.mp3',
          C4: 'Vibraphone_C4.mp3',
          C5: 'Vibraphone_C5.mp3',
          C6: 'Vibraphone_C6.mp3',
          C7: 'Vibraphone_C7.mp3',
          C8: 'Vibraphone_C8.mp3',
        },
        baseUrl: window.location.origin + '/samples/vibes/',
      })
      vibesInstrument.current.set({
        attack: instrumentParamsRef.current.samplerAttack,
        release: instrumentParamsRef.current.samplerRelease,
        volume: -4,
      })
      vibesInstrument.current.connect(getCurrentEffect())
    }
  }, [getCurrentEffect])

  const initHarpInstrument = useCallback(() => {
    if (!harpInstrument.current) {
      harpInstrument.current = new Tone.Sampler({
        urls: {
          C1: 'Harp_C1.mp3',
          C2: 'Harp_C2.mp3',
          C3: 'Harp_C3.mp3',
          C4: 'Harp_C4.mp3',
          C5: 'Harp_C5.mp3',
          C6: 'Harp_C6.mp3',
          C7: 'Harp_C7.mp3',
          C8: 'Harp_C8.mp3',
        },
        baseUrl: window.location.origin + '/samples/harp/',
      })
      harpInstrument.current.set({
        attack: instrumentParamsRef.current.samplerAttack,
        release: instrumentParamsRef.current.samplerRelease,
        volume: -6,
      })
      harpInstrument.current.connect(getCurrentEffect())
    }
  }, [getCurrentEffect])

  const initChoralInstrument = useCallback(() => {
    if (!choralInstrument.current) {
      choralInstrument.current = new Tone.Sampler({
        urls: {
          C1: 'Choir_C1.mp3',
          C2: 'Choir_C2.mp3',
          C3: 'Choir_C3.mp3',
          C4: 'Choir_C4.mp3',
          C5: 'Choir_C5.mp3',
          C6: 'Choir_C6.mp3',
          C7: 'Choir_C7.mp3',
          C8: 'Choir_C8.mp3',
        },
        baseUrl: window.location.origin + '/samples/choral/',
      })
      choralInstrument.current.set({
        attack: instrumentParamsRef.current.samplerAttack,
        release: instrumentParamsRef.current.samplerRelease,
        volume: -6,
      })
      choralInstrument.current.connect(getCurrentEffect())
    }
  }, [getCurrentEffect])

  const initDrumsInstrument = useCallback(() => {
    if (!drumsInstrument.current) {
      drumsInstrument.current = new Tone.Sampler({
        urls: {
          C1: 'Korg-N1R-Bass-Drum-2.mp3',
          Db1: 'Korg-N1R-Bass-Drum.mp3',
          D1: 'Korg-N1R-Side-Stick.mp3',
          Eb1: 'Korg-N1R-Snare-Drum.mp3',
          E1: 'Korg-N1R-Clap.mp3',
          F1: 'Korg-N1R-Snare-Drum-2.mp3',
          Gb1: 'Korg-N1R-Low-Tom-2.mp3',
          G1: 'Korg-N1R-Closed-Hi-Hat.mp3',
          Ab1: 'Korg-N1R-Low-Tom.mp3',
          A1: 'Korg-N1R-Pedal-Hi-Hat.mp3',
          Bb1: 'Korg-N1R-Mid-Tom-2.mp3',
          B1: 'Korg-N1R-Open-Hi-Hat.mp3',
          C2: 'Korg-N1R-Mid-Tom.mp3',
          Db2: 'Korg-N1R-High-Tom-2.mp3',
          D2: 'Korg-N1R-Crash-Cymbal.mp3',
          Eb2: 'Korg-N1R-High-Tom.mp3',
          E2: 'Korg-N1R-Ride-Cymbal.mp3',
          F2: 'Korg-N1R-Chinese-Cymbal.mp3',
          Gb2: 'Korg-N1R-Ride-Bell.mp3',
          G2: 'Korg-N1R-Tambourine.mp3',
          Ab2: 'Korg-N1R-Splash-Cymbal.mp3',
          A2: 'Korg-N1R-Cowbell.mp3',
          Bb2: 'Korg-N1R-Crash-Cymbal-2.mp3',
          B2: 'Korg-N1R-Vibraslap.mp3',
          C3: 'Korg-N1R-Ride-Cymbal-2.mp3',
          Db3: 'Korg-N1R-High-Bongo.mp3',
          D3: 'Korg-N1R-Low-Bongo.mp3',
          Eb3: 'Roland-SC-88-Mute-High-Conga.mp3',
          E3: 'Roland-SC-88-Open-High-Conga.mp3',
          F3: 'Roland-SC-88-Low-Conga.mp3',
          Gb3: 'Korg-N1R-High-Timbale.mp3',
          G3: 'Korg-N1R-Low-Timbale.mp3',
          Ab3: 'Korg-N1R-High-Agogo.mp3',
          A3: 'Korg-N1R-Low-Agogo.mp3',
          Bb3: 'Korg-N1R-Cabasa.mp3',
          B3: 'Korg-N1R-Maracas.mp3',
          C4: 'Korg-N1R-Short-Whistle.mp3',
          Db4: 'Korg-N1R-Long-Whistle.mp3',
          D4: 'Korg-N1R-Short-Guiro.mp3',
          Eb4: 'Korg-N1R-Long-Guiro.mp3',
          E4: 'Korg-N1R-Claves.mp3',
          F4: 'Korg-N1R-High-Wood-Block.mp3',
          Gb4: 'Korg-N1R-Low-Wood-Block.mp3',
          G4: 'Roland-SC-88-Mute-Cuica.mp3',
          Ab4: 'Roland-SC-88-Open-Cuica.mp3',
          A4: 'Korg-N1R-Mute-Triangle.mp3',
          Bb4: 'Korg-N1R-Open-Triangle.mp3',
          B4: 'Korg-N1R-Shaker.mp3',
          C5: 'Korg-N1R-Jingle-Bell.mp3',
          Db5: 'Korg-N1R-Belltree.mp3',
          D5: 'Korg-N1R-Castanets.mp3',
          Eb5: 'Korg-N1R-Mute-Surdo.mp3',
          E5: 'Korg-N1R-Open-Surdo.mp3',
          F5: 'Korg-N1R-High-Q.mp3',
          Gb5: 'Korg-N1R-Slap.mp3',
          G5: 'Korg-N1R-Scratch-Push.mp3',
          Ab5: 'Korg-N1R-Scratch-Pull.mp3',
          A5: 'Korg-N1R-Sticks.mp3',
          Bb5: 'Korg-N1R-Square-Click.mp3',
          B5: 'Korg-N1R-Metronome-Click.mp3',
          C6: 'Korg-N1R-Metronome-Bell.mp3',
        },
        baseUrl: window.location.origin + '/samples/drums/',
      })
      drumsInstrument.current.set({
        attack: instrumentParamsRef.current.samplerAttack,
        release: instrumentParamsRef.current.samplerRelease,
        volume: -6,
      })
      drumsInstrument.current.connect(getCurrentEffect())
    }
  }, [getCurrentEffect])

  const initDrumMachineInstrument = useCallback(() => {
    if (!drumMachineInstrument.current) {
      drumMachineInstrument.current = new Tone.Sampler({
        urls: {
          C1: 'korg_kr55_1.mp3',
          Db1: 'korg_kr55_2.mp3',
          D1: 'korg_kr55_3.mp3',
          Eb1: 'korg_kr55_4.mp3',
          E1: 'korg_kr55_5.mp3',
          F1: 'korg_kr55_6.mp3',
          Gb1: 'korg_kr55_7.mp3',
          G1: 'korg_kr55_8.mp3',
          Ab1: 'korg_kr55_9.mp3',
          A1: 'korg_kr55_10.mp3',
          Bb1: 'tr808_1.mp3',
          B1: 'tr808_2.mp3',
          C2: 'tr808_3.mp3',
          Db2: 'tr808_4.mp3',
          D2: 'tr808_5.mp3',
          Eb2: 'tr808_6.mp3',
          E2: 'tr808_7.mp3',
          F2: 'tr808_8.mp3',
          Gb2: 'tr808_9.mp3',
          G2: 'tr808_10.mp3',
          Ab2: 'tr808_11.mp3',
          A2: 'tr808_12.mp3',
          Bb2: 'tr808_13.mp3',
          B2: 'tr808_14.mp3',
          C3: 'tr808_15.mp3',
          Db3: 'tr808_16.mp3',
          D3: 'roland_cr80_1.mp3',
          Eb3: 'roland_cr80_2.mp3',
          E3: 'roland_cr80_3.mp3',
          F3: 'roland_cr80_4.mp3',
          Gb3: 'roland_cr80_5.mp3',
          G3: 'roland_cr80_6.mp3',
          Ab3: 'roland_cr80_7.mp3',
          A3: 'roland_cr80_8.mp3',
          Bb3: 'roland_cr80_9.mp3',
          B3: 'roland_cr80_10.mp3',
          C4: 'roland_cr80_11.mp3',
          Db4: 'roland_cr80_12.mp3',
          D4: 'roland_cr80_13.mp3',
          Eb4: 'tr909_1.mp3',
          E4: 'tr909_2.mp3',
          F4: 'tr909_3.mp3',
          Gb4: 'tr909_4.mp3',
          G4: 'tr909_5.mp3',
          Ab4: 'tr909_6.mp3',
          A4: 'tr909_7.mp3',
          Bb4: 'tr909_8.mp3',
          B4: 'tr909_9.mp3',
          C5: 'tr909_10.mp3',
          Db5: 'tr909_11.mp3',
          D5: 'tr909_12.mp3',
          Eb5: 'tr909_13.mp3',
          E5: 'tr909_14.mp3',
          F5: 'tr909_15.mp3',
          Gb5: 'tr909_16.mp3',
          G5: 'tr909_17.mp3',
          Ab5: 'tr909_18.mp3',
          A5: 'tr909_19.mp3',
          Bb5: 'tr909_20.mp3',
          B5: 'alesis_hr16a_1.mp3',
          C6: 'alesis_hr16a_2.mp3',
          Db6: 'alesis_hr16a_3.mp3',
          D6: 'alesis_hr16a_4.mp3',
          Eb6: 'alesis_hr16a_5.mp3',
          E6: 'alesis_hr16a_6.mp3',
          F6: 'alesis_hr16a_7.mp3',
          Gb6: 'alesis_hr16a_8.mp3',
          G6: 'alesis_hr16a_9.mp3',
          Ab6: 'alesis_hr16a_10.mp3',
          A6: 'alesis_hr16a_11.mp3',
          Bb6: 'alesis_hr16a_12.mp3',
          B6: 'alesis_hr16a_13.mp3',
          C7: 'alesis_hr16a_14.mp3',
          Db7: 'alesis_hr16a_15.mp3',
          D7: 'alesis_hr16a_16.mp3',
          Eb7: 'alesis_hr16a_17.mp3',
          E7: 'alesis_hr16a_18.mp3',
          F7: 'alesis_hr16a_19.mp3',
          Gb7: 'alesis_hr16a_20.mp3',
          G7: 'alesis_hr16a_21.mp3',
          Ab7: 'alesis_hr16a_22.mp3',
          A7: 'alesis_hr16a_23.mp3',
          Bb7: 'alesis_hr16a_24.mp3',
          B7: 'alesis_hr16a_25.mp3',
          C8: 'alesis_hr16a_26.mp3',
          Db8: 'alesis_hr16a_27.mp3',
          D8: 'alesis_hr16a_28.mp3',
          Eb8: 'alesis_hr16a_29.mp3',
          E8: 'alesis_hr16a_30.mp3',
          F8: 'alesis_hr16a_31.mp3',
          Gb8: 'alesis_hr16a_32.mp3',
          G8: 'alesis_hr16a_33.mp3',
          Ab8: 'alesis_hr16a_34.mp3',
          A8: 'alesis_hr16a_35.mp3',
          Bb8: 'alesis_hr16a_36.mp3',
          B8: 'alesis_hr16a_37.mp3',
        },
        baseUrl: window.location.origin + '/samples/drum-machine/',
      })
      drumMachineInstrument.current.set({
        attack: instrumentParamsRef.current.samplerAttack,
        release: instrumentParamsRef.current.samplerRelease,
        volume: -6,
      })
      drumMachineInstrument.current.connect(getCurrentEffect())
    }
  }, [getCurrentEffect])

  // initialize instruments

  useEffect(() => {
    gainNode.current = new Tone.Gain(instrumentParamsRef.current.gain).toDestination()
    if (CHORUS_ENABLED) {
      chorusEffect.current = new Tone.Chorus(
        instrumentParamsRef.current.chorusFreq,
        instrumentParamsRef.current.chorusDelayTime,
        instrumentParamsRef.current.chorusDepth
      ).connect(gainNode.current)
      chorusEffect.current.set({
        wet: instrumentParamsRef.current.effectWet,
        spread: instrumentParamsRef.current.chorusSpread,
      })
      if (instrumentParamsRef.current.effectType === 'chorus') {
        chorusEffect.current.start()
      }
    }
    distortionEffect.current = new Tone.Distortion(instrumentParamsRef.current.distortion).connect(gainNode.current)
    distortionEffect.current.set({ wet: instrumentParamsRef.current.effectWet })
    delayEffect.current = new Tone.FeedbackDelay(
      instrumentParamsRef.current.delayTime,
      instrumentParamsRef.current.delayFeedback
    ).connect(gainNode.current)
    delayEffect.current.set({ wet: instrumentParamsRef.current.effectWet })
    reverbEffect.current = new Tone.Reverb(instrumentParamsRef.current.reverbDecay).connect(gainNode.current)
    reverbEffect.current.set({
      wet: instrumentParamsRef.current.effectWet,
      preDelay: instrumentParamsRef.current.reverbPreDelay,
    })
    vibratoEffect.current = new Tone.Vibrato(
      instrumentParamsRef.current.vibratoFreq,
      instrumentParamsRef.current.vibratoDepth
    ).connect(gainNode.current)
    vibratoEffect.current.set({
      wet: instrumentParamsRef.current.effectWet,
    })
    switch (initInstrumentType.current) {
      case 'piano':
        initPianoInstrument()
        instrument.current = pianoInstrument.current
        break
      case 'marimba':
        initMarimbaInstrument()
        instrument.current = marimbaInstrument.current
        break
      case 'bass':
        initBassInstrument()
        instrument.current = bassInstrument.current
        break
      case 'vibes':
        initVibesInstrument()
        instrument.current = vibesInstrument.current
        break
      case 'harp':
        initHarpInstrument()
        instrument.current = harpInstrument.current
        break
      case 'choral':
        initChoralInstrument()
        instrument.current = choralInstrument.current
        break
      case 'drums':
        initDrumsInstrument()
        instrument.current = drumsInstrument.current
        break
      case 'drum-machine':
        initDrumMachineInstrument()
        instrument.current = drumMachineInstrument.current
        break
      case 'synth':
        initSynthInstrument()
        instrument.current = synthInstrument.current
        break
      default:
        initSynthInstrument()
        instrument.current = synthInstrument.current
    }
    instrument.current.connect(getCurrentEffect())

    // cleanup instruments
    return () => {
      console.log('hmmm')
      cleanupRef.current()
      if (synthInstrument.current) {
        synthInstrument.current.dispose()
      }
      if (marimbaInstrument.current) {
        marimbaInstrument.current.dispose()
      }
      if (pianoInstrument.current) {
        pianoInstrument.current.dispose()
      }
      if (bassInstrument.current) {
        bassInstrument.current.dispose()
      }
      if (vibesInstrument.current) {
        vibesInstrument.current.dispose()
      }
      if (harpInstrument.current) {
        harpInstrument.current.dispose()
      }
      if (choralInstrument.current) {
        choralInstrument.current.dispose()
      }
      if (drumsInstrument.current) {
        drumsInstrument.current.dispose()
      }
      if (drumMachineInstrument.current) {
        drumMachineInstrument.current.dispose()
      }
      if (chorusEffect.current) {
        chorusEffect.current.dispose()
      }
      distortionEffect.current.dispose()
      delayEffect.current.dispose()
      reverbEffect.current.dispose()
      vibratoEffect.current.dispose()
      if (gainNode.current) {
        gainNode.current.dispose()
      }
      instrument.current = null
    }
  }, [
    getCurrentEffect,
    initBassInstrument,
    initChoralInstrument,
    initDrumMachineInstrument,
    initDrumsInstrument,
    initHarpInstrument,
    initMarimbaInstrument,
    initPianoInstrument,
    initSynthInstrument,
    initVibesInstrument,
    instrument,
  ])

  useEffect(() => {
    if (instrument.current) {
      instrument.current.triggerRelease()
    }
    switch (instrumentType) {
      case 'piano':
        initPianoInstrument()
        instrument.current = pianoInstrument.current
        break
      case 'marimba':
        initMarimbaInstrument()
        instrument.current = marimbaInstrument.current
        break
      case 'bass':
        initBassInstrument()
        instrument.current = bassInstrument.current
        break
      case 'vibes':
        initVibesInstrument()
        instrument.current = vibesInstrument.current
        break
      case 'harp':
        initHarpInstrument()
        instrument.current = harpInstrument.current
        break
      case 'choral':
        initChoralInstrument()
        instrument.current = choralInstrument.current
        break
      case 'drums':
        initDrumsInstrument()
        instrument.current = drumsInstrument.current
        break
      case 'drum-machine':
        initDrumMachineInstrument()
        instrument.current = drumMachineInstrument.current
        break
      case 'synth':
        initSynthInstrument()
        instrument.current = synthInstrument.current
        break
      default:
        initSynthInstrument()
        instrument.current = synthInstrument.current
    }
  }, [
    initBassInstrument,
    initChoralInstrument,
    initDrumMachineInstrument,
    initDrumsInstrument,
    initHarpInstrument,
    initMarimbaInstrument,
    initPianoInstrument,
    initSynthInstrument,
    initVibesInstrument,
    instrument,
    instrumentType,
  ])

  const openInstrumentModal = useCallback(() => {
    setModalType('instrument')
  }, [setModalType])

  const instruments = useMemo(
    () => ({
      synthInstrument,
      pianoInstrument,
      marimbaInstrument,
      bassInstrument,
      vibesInstrument,
      harpInstrument,
      choralInstrument,
      drumsInstrument,
      drumMachineInstrument,
    }),
    [
      bassInstrument,
      choralInstrument,
      drumMachineInstrument,
      drumsInstrument,
      harpInstrument,
      marimbaInstrument,
      pianoInstrument,
      synthInstrument,
      vibesInstrument,
    ]
  )
  const effects = useMemo(
    () => ({
      chorusEffect,
      distortionEffect,
      delayEffect,
      reverbEffect,
      vibratoEffect,
    }),
    [chorusEffect, delayEffect, distortionEffect, reverbEffect, vibratoEffect]
  )

  return {
    gainNode,
    synthInstrument,
    pianoInstrument,
    marimbaInstrument,
    drumsInstrument,
    drumMachineInstrument,
    bassInstrument,
    vibesInstrument,
    harpInstrument,
    choralInstrument,
    chorusEffect,
    distortionEffect,
    delayEffect,
    reverbEffect,
    vibratoEffect,
    getCurrentEffect,
    openInstrumentModal,
    instruments,
    effects,
  }
}

export function updateInstruments(
  gainNode,
  synthInstrument,
  samplerInstruments,
  chorusEffect,
  distortionEffect,
  delayEffect,
  reverbEffect,
  vibratoEffect,
  instrumentParams,
  currentEffect
) {
  gainNode.set({ gain: instrumentParams.gain })
  if (CHORUS_ENABLED) {
    chorusEffect.set({
      wet: instrumentParams.effectWet,
      depth: instrumentParams.chorusDepth,
      delayTime: instrumentParams.chorusDelayTime,
      frequency: instrumentParams.chorusFreq,
      spread: instrumentParams.chorusSpread,
    })
  }
  distortionEffect.set({
    wet: instrumentParams.effectWet,
    distortion: instrumentParams.distortion,
  })
  delayEffect.set({
    wet: instrumentParams.effectWet,
    delayTime: instrumentParams.delayTime,
    feedback: instrumentParams.delayFeedback,
  })
  reverbEffect.set({
    wet: instrumentParams.effectWet,
    decay: instrumentParams.reverbDecay,
    preDelay: instrumentParams.reverbPreDelay,
  })
  vibratoEffect.set({
    wet: instrumentParams.effectWet,
    depth: instrumentParams.vibratoDepth,
    frequency: instrumentParams.vibratoFreq,
  })
  let effect
  switch (instrumentParams.effectType) {
    case 'chorus':
      effect = chorusEffect
      if (CHORUS_ENABLED) chorusEffect.start()
      break
    case 'distortion':
      effect = distortionEffect
      break
    case 'delay':
      effect = delayEffect
      break
    case 'reverb':
      effect = reverbEffect
      break
    case 'vibrato':
      effect = vibratoEffect
      break
    default:
      effect = gainNode
  }
  effect = effect || gainNode
  if (CHORUS_ENABLED && instrumentParams.effectType !== 'chorus') {
    chorusEffect.stop()
  }
  if (synthInstrument) {
    synthInstrument.set({
      portamento: instrumentParams.portamento,
      oscillator: {
        type: instrumentParams.synthType,
        modulationType: instrumentParams.modulationType,
        harmonicity: instrumentParams.harmonicity,
        spread: instrumentParams.fatSpread,
        count: instrumentParams.fatCount,
        width: instrumentParams.pulseWidth,
        modulationFrequency: instrumentParams.pwmFreq,
      },
      envelope: {
        attack: instrumentParams.envAttack,
        decay: instrumentParams.envDecay,
        sustain: instrumentParams.envSustain,
        release: instrumentParams.envRelease,
      },
      filter: {
        Q: instrumentParams.resonance,
        rolloff: instrumentParams.rolloff,
      },
      filterEnvelope: {
        baseFrequency: instrumentParams.cutoff,
        attack: instrumentParams.filterAttack,
        decay: instrumentParams.filterDecay,
        sustain: instrumentParams.filterSustain,
        release: instrumentParams.filterRelease,
        octaves: instrumentParams.filterAmount,
      },
    })
    if (currentEffect) {
      synthInstrument.disconnect(currentEffect)
    }
    synthInstrument.connect(effect)
  }
  samplerInstruments.forEach((sampler) => {
    if (sampler) {
      sampler.set({
        attack: instrumentParams.samplerAttack,
        release: instrumentParams.samplerRelease,
      })
      if (currentEffect) {
        sampler.disconnect(currentEffect)
      }
      sampler.connect(effect)
    }
  })
}
