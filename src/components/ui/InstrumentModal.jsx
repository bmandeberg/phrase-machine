import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import Instrument from './Instrument'
import RotaryKnob from './RotaryKnob'
import Dropdown from './Dropdown'
import NumInput from './NumInput'
import Switch from 'react-switch'
import { SIGNAL_TYPES, EFFECTS, themedSwitch, RATES, SYNTH_TYPES, CHORUS_ENABLED } from '../../globals'
import * as Tone from 'tone'
import classNames from 'classnames'
import './InstrumentModal.scss'

const rolloffOptions = ['-12', '-24', '-48', '-96']
const oscModifiers = ['none', 'am', 'fm', 'fat']

export default function InstrumentModal({
  instrumentOn,
  setInstrumentOn,
  instrumentType,
  setInstrumentType,
  theme,
  instrumentParams,
  setInstrumentParams,
  instruments,
  gainNode,
  effects,
  grabbing,
  setGrabbing,
  linearKnobs,
}) {
  const [gain, setGain] = useState(instrumentParams.gain)
  // synth
  const [synthType, setSynthType] = useState(instrumentParams.synthType)
  const [oscModifier, setOscModifier] = useState(() => {
    for (let i = 1; i < oscModifiers.length; i++) {
      if (instrumentParams.synthType.startsWith(oscModifiers[i])) {
        return oscModifiers[i]
      }
    }
    return oscModifiers[0]
  })
  const [portamento, setPortamento] = useState(instrumentParams.portamento)
  const [modulationType, setModulationType] = useState(instrumentParams.modulationType)
  const [harmonicity, setHarmonicity] = useState(instrumentParams.harmonicity)
  const [fatSpread, setFatSpread] = useState(instrumentParams.fatSpread)
  const [fatCount, setFatCount] = useState(instrumentParams.fatCount)
  const [pulseWidth, setPulseWidth] = useState(instrumentParams.pulseWidth)
  const [pwmFreq, setPwmFreq] = useState(instrumentParams.pwmFreq)
  const [envAttack, setEnvAttack] = useState(instrumentParams.envAttack)
  const [envDecay, setEnvDecay] = useState(instrumentParams.envDecay)
  const [envSustain, setEnvSustain] = useState(instrumentParams.envSustain)
  const [envRelease, setEnvRelease] = useState(instrumentParams.envRelease)
  const [cutoff, setCutoff] = useState(instrumentParams.cutoff)
  const [resonance, setResonance] = useState(instrumentParams.resonance)
  const [rolloff, setRolloff] = useState(instrumentParams.rolloff)
  const [filterAttack, setFilterAttack] = useState(instrumentParams.filterAttack)
  const [filterDecay, setFilterDecay] = useState(instrumentParams.filterDecay)
  const [filterSustain, setFilterSustain] = useState(instrumentParams.filterSustain)
  const [filterRelease, setFilterRelease] = useState(instrumentParams.filterRelease)
  const [filterAmount, setFilterAmount] = useState(instrumentParams.filterAmount)
  // sampler
  const [samplerAttack, setSamplerAttack] = useState(instrumentParams.samplerAttack)
  const [samplerRelease, setSamplerRelease] = useState(instrumentParams.samplerRelease)
  // effects
  const [effectType, setEffectType] = useState(instrumentParams.effectType)
  const [effectWet, setEffectWet] = useState(instrumentParams.effectWet)
  const [chorusDepth, setChorusDepth] = useState(instrumentParams.chorusDepth)
  const [chorusDelayTime, setChorusDelayTime] = useState(instrumentParams.chorusDelayTime)
  const [chorusFreq, setChorusFreq] = useState(instrumentParams.chorusFreq)
  const [chorusSpread, setChorusSpread] = useState(instrumentParams.chorusSpread)
  const [distortion, setDistortion] = useState(instrumentParams.distortion)
  const [syncDelayTime, setSyncDelayTime] = useState(instrumentParams.syncDelayTime)
  const [delayTime, setDelayTime] = useState(instrumentParams.delayTime)
  const [delayFeedback, setDelayFeedback] = useState(instrumentParams.delayFeedback)
  const [reverbDecay, setReverbDecay] = useState(instrumentParams.reverbDecay)
  const [reverbPreDelay, setReverbPreDelay] = useState(instrumentParams.reverbPreDelay)
  const [vibratoDepth, setVibratoDepth] = useState(instrumentParams.vibratoDepth)
  const [vibratoFreq, setVibratoFreq] = useState(instrumentParams.vibratoFreq)

  const effectRef = useRef()

  const rolloffString = useMemo(() => `${rolloff}`, [rolloff])
  const updateRolloff = useCallback((r) => {
    setRolloff(+r)
  }, [])

  const setSyncedDelay = useCallback((rate) => {
    setDelayTime(Tone.Transport.toSeconds(rate))
  }, [])
  const syncedDelayOptions = useMemo(() => {
    return RATES.filter((rate) => Tone.Transport.toSeconds(rate) <= 1)
  }, [])
  const syncedDelay = useMemo(() => {
    for (let i = 0; i < RATES.length; i++) {
      if (delayTime === Tone.Transport.toSeconds(RATES[i])) {
        return RATES[i]
      }
    }
    return null
  }, [delayTime])

  const instrumentParamsDebounce = useRef()
  const updateInstrumentParams = useCallback(
    (param, value) => {
      clearTimeout(instrumentParamsDebounce.current)
      const debounceTime = 200
      instrumentParamsDebounce.current = setTimeout(() => {
        setInstrumentParams((instrumentParams) => Object.assign({}, instrumentParams, { [param]: value }))
      }, debounceTime)
    },
    [setInstrumentParams]
  )

  useEffect(() => {
    if (gainNode.current) {
      gainNode.current.set({ gain })
    }
    updateInstrumentParams('gain', gain)
  }, [gainNode, gain, updateInstrumentParams])

  // update synth params

  useEffect(() => {
    updateInstrumentParams('synthType', synthType)
  }, [synthType, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ portamento })
    }
    updateInstrumentParams('portamento', portamento)
  }, [instruments.synthInstrument, portamento, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ oscillator: { modulationType } })
    }
    updateInstrumentParams('modulationType', modulationType)
  }, [instruments.synthInstrument, modulationType, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ oscillator: { harmonicity } })
    }
    updateInstrumentParams('harmonicity', harmonicity)
  }, [harmonicity, instruments.synthInstrument, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ oscillator: { spread: fatSpread } })
    }
    updateInstrumentParams('fatSpread', fatSpread)
  }, [fatSpread, instruments.synthInstrument, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ oscillator: { count: fatCount } })
    }
    updateInstrumentParams('fatCount', fatCount)
  }, [fatCount, instruments.synthInstrument, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ oscillator: { width: pulseWidth } })
    }
    updateInstrumentParams('pulseWidth', pulseWidth)
  }, [instruments.synthInstrument, pulseWidth, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ oscillator: { modulationFrequency: pwmFreq } })
    }
    updateInstrumentParams('pwmFreq', pwmFreq)
  }, [instruments.synthInstrument, pwmFreq, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ envelope: { attack: envAttack } })
    }
    updateInstrumentParams('envAttack', envAttack)
  }, [envAttack, instruments.synthInstrument, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ envelope: { decay: envDecay } })
    }
    updateInstrumentParams('envDecay', envDecay)
  }, [envDecay, instruments.synthInstrument, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ envelope: { sustain: envSustain } })
    }
    updateInstrumentParams('envSustain', envSustain)
  }, [envSustain, instruments.synthInstrument, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ envelope: { release: envRelease } })
    }
    updateInstrumentParams('envRelease', envRelease)
  }, [envRelease, instruments.synthInstrument, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ filter: { Q: resonance } })
    }
    updateInstrumentParams('resonance', resonance)
  }, [instruments.synthInstrument, resonance, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ filter: { rolloff } })
    }
    updateInstrumentParams('rolloff', rolloff)
  }, [instruments.synthInstrument, rolloff, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ filterEnvelope: { baseFrequency: cutoff } })
    }
    updateInstrumentParams('cutoff', cutoff)
  }, [cutoff, instruments.synthInstrument, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ filterEnvelope: { attack: filterAttack } })
    }
    updateInstrumentParams('filterAttack', filterAttack)
  }, [filterAttack, instruments.synthInstrument, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ filterEnvelope: { decay: filterDecay } })
    }
    updateInstrumentParams('filterDecay', filterDecay)
  }, [filterDecay, instruments.synthInstrument, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ filterEnvelope: { sustain: filterSustain } })
    }
    updateInstrumentParams('filterSustain', filterSustain)
  }, [filterSustain, instruments.synthInstrument, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ filterEnvelope: { release: filterRelease } })
    }
    updateInstrumentParams('filterRelease', filterRelease)
  }, [filterRelease, instruments.synthInstrument, updateInstrumentParams])

  useEffect(() => {
    if (instruments.synthInstrument.current) {
      instruments.synthInstrument.current.set({ filterEnvelope: { octaves: filterAmount } })
    }
    updateInstrumentParams('filterAmount', filterAmount)
  }, [filterAmount, instruments.synthInstrument, updateInstrumentParams])

  // update sampler params

  useEffect(() => {
    if (instruments.pianoInstrument.current) {
      instruments.pianoInstrument.current.attack = samplerAttack
    }
    if (instruments.marimbaInstrument.current) {
      instruments.marimbaInstrument.current.attack = samplerAttack
    }
    if (instruments.bassInstrument.current) {
      instruments.bassInstrument.current.attack = samplerAttack
    }
    if (instruments.vibesInstrument.current) {
      instruments.vibesInstrument.current.attack = samplerAttack
    }
    if (instruments.harpInstrument.current) {
      instruments.harpInstrument.current.attack = samplerAttack
    }
    if (instruments.choralInstrument.current) {
      instruments.choralInstrument.current.attack = samplerAttack
    }
    if (instruments.drumsInstrument.current) {
      instruments.drumsInstrument.current.attack = samplerAttack
    }
    updateInstrumentParams('samplerAttack', samplerAttack)
  }, [instruments, samplerAttack, updateInstrumentParams])

  useEffect(() => {
    if (instruments.pianoInstrument.current) {
      instruments.pianoInstrument.current.release = samplerRelease
    }
    if (instruments.marimbaInstrument.current) {
      instruments.marimbaInstrument.current.release = samplerRelease
    }
    if (instruments.bassInstrument.current) {
      instruments.bassInstrument.current.release = samplerRelease
    }
    if (instruments.vibesInstrument.current) {
      instruments.vibesInstrument.current.release = samplerRelease
    }
    if (instruments.harpInstrument.current) {
      instruments.harpInstrument.current.release = samplerRelease
    }
    if (instruments.choralInstrument.current) {
      instruments.choralInstrument.current.release = samplerRelease
    }
    if (instruments.drumsInstrument.current) {
      instruments.drumsInstrument.current.release = samplerRelease
    }
    updateInstrumentParams('samplerRelease', samplerRelease)
  }, [instruments, samplerRelease, updateInstrumentParams])

  // update effect params

  useEffect(() => {
    if (CHORUS_ENABLED) {
      if (effectType === 'chorus') {
        effects.chorusEffect.current.start()
      } else {
        effects.chorusEffect.current.stop()
      }
    }
    let effect
    switch (effectType) {
      case 'chorus':
        effect = effects.chorusEffect.current
        break
      case 'distortion':
        effect = effects.distortionEffect.current
        break
      case 'delay':
        effect = effects.delayEffect.current
        break
      case 'reverb':
        effect = effects.reverbEffect.current
        break
      case 'vibrato':
        effect = effects.vibratoEffect.current
        break
      default:
        effect = gainNode.current
    }
    effect = effect || gainNode.current
    if (effectRef.current) {
      Object.values(instruments).forEach((instrument) => {
        if (instrument.current) {
          instrument.current.disconnect(effectRef.current)
        }
      })
    }
    effectRef.current = effect
    Object.values(instruments).forEach((instrument) => {
      if (instrument.current) {
        instrument.current.connect(effect)
      }
    })
    updateInstrumentParams('effectType', effectType)
  }, [effectType, effects, gainNode, instruments, updateInstrumentParams])

  useEffect(() => {
    Object.values(effects).forEach((effect) => {
      if (effect.current) {
        effect.current.set({ wet: effectWet })
      }
    })
    updateInstrumentParams('effectWet', effectWet)
  }, [effectWet, effects, updateInstrumentParams])

  useEffect(() => {
    if (effects.chorusEffect.current) {
      effects.chorusEffect.current.depth = chorusDepth
    }
    updateInstrumentParams('chorusDepth', chorusDepth)
  }, [chorusDepth, effects.chorusEffect, updateInstrumentParams])

  useEffect(() => {
    if (effects.chorusEffect.current) {
      effects.chorusEffect.current.delayTime = chorusDelayTime
    }
    updateInstrumentParams('chorusDelayTime', chorusDelayTime)
  }, [chorusDelayTime, effects.chorusEffect, updateInstrumentParams])

  useEffect(() => {
    if (effects.chorusEffect.current) {
      effects.chorusEffect.current.set({ frequency: chorusFreq })
    }
    updateInstrumentParams('chorusFreq', chorusFreq)
  }, [chorusFreq, effects.chorusEffect, updateInstrumentParams])

  useEffect(() => {
    if (effects.chorusEffect.current) {
      effects.chorusEffect.current.spread = chorusSpread
    }
    updateInstrumentParams('chorusSpread', chorusSpread)
  }, [chorusSpread, effects.chorusEffect, updateInstrumentParams])

  useEffect(() => {
    effects.distortionEffect.current.distortion = distortion
    updateInstrumentParams('distortion', distortion)
  }, [distortion, effects.distortionEffect, updateInstrumentParams])

  useEffect(() => {
    updateInstrumentParams('syncDelayTime', syncDelayTime)
  }, [syncDelayTime, updateInstrumentParams])

  useEffect(() => {
    effects.delayEffect.current.set({ delayTime })
    updateInstrumentParams('delayTime', delayTime)
  }, [delayTime, effects.delayEffect, updateInstrumentParams])

  useEffect(() => {
    effects.delayEffect.current.set({ feedback: delayFeedback })
    updateInstrumentParams('delayFeedback', delayFeedback)
  }, [delayFeedback, effects.delayEffect, updateInstrumentParams])

  useEffect(() => {
    effects.reverbEffect.current.decay = reverbDecay
    updateInstrumentParams('reverbDecay', reverbDecay)
  }, [effects.reverbEffect, reverbDecay, updateInstrumentParams])

  useEffect(() => {
    effects.reverbEffect.current.preDelay = reverbPreDelay
    updateInstrumentParams('reverbPreDelay', reverbPreDelay)
  }, [effects.reverbEffect, reverbPreDelay, updateInstrumentParams])

  useEffect(() => {
    effects.vibratoEffect.current.set({ depth: vibratoDepth })
    updateInstrumentParams('vibratoDepth', vibratoDepth)
  }, [effects.vibratoEffect, updateInstrumentParams, vibratoDepth])

  useEffect(() => {
    effects.vibratoEffect.current.set({ frequency: vibratoFreq })
    updateInstrumentParams('vibratoFreq', vibratoFreq)
  }, [effects.vibratoEffect, updateInstrumentParams, vibratoFreq])

  const signalTypeOptions = useMemo(
    () =>
      Object.keys(SIGNAL_TYPES).map((instr) => ({
        value: instr,
        label: SIGNAL_TYPES[instr](theme),
      })),
    [theme]
  )

  const synthTypeOptions = useMemo(
    () =>
      Object.keys(SYNTH_TYPES).map((type) => ({
        value: type,
        label: SYNTH_TYPES[type](theme),
      })),
    [theme]
  )
  const synthBase = useMemo(() => {
    for (let i = 1; i < oscModifiers.length; i++) {
      if (synthType.startsWith(oscModifiers[i])) {
        return synthType.substring(oscModifiers[i].length)
      }
    }
    return synthType
  }, [synthType])
  const updateSynthType = useCallback(
    (newType) => {
      const updatedType =
        oscModifier !== oscModifiers[0] && Object.keys(SIGNAL_TYPES).includes(newType) ? oscModifier + newType : newType
      setSynthType(updatedType)
      instruments.synthInstrument.current.set({ oscillator: { harmonicity, type: updatedType } })
    },
    [harmonicity, instruments.synthInstrument, oscModifier]
  )
  const updateOscModifier = useCallback(
    (modifier) => {
      const updatedModifier = modifier === oscModifiers[0] ? '' : modifier
      setSynthType(updatedModifier + synthBase)
      instruments.synthInstrument.current.set({ oscillator: { harmonicity, type: updatedModifier + synthBase } })
      setOscModifier(modifier)
    },
    [harmonicity, instruments.synthInstrument, synthBase]
  )

  const offColor = useMemo(() => themedSwitch('offColor', theme), [theme])
  const onColor = useMemo(() => themedSwitch('onColor', theme), [theme])
  const offHandleColor = useMemo(() => themedSwitch('offHandleColor', theme, false), [theme])
  const onHandleColor = useMemo(() => themedSwitch('onHandleColor', theme), [theme])

  const synthInstrumentControls = useMemo(
    () => (
      <div className="synth-controls">
        <div className="controls-row">
          <div className="controls-module">
            <p className="controls-label">Oscillator</p>
            <Dropdown
              className="instrument-item"
              label="Wave"
              options={synthTypeOptions}
              setValue={updateSynthType}
              value={synthBase}
            />
            {Object.keys(SIGNAL_TYPES).includes(synthBase) && (
              <Dropdown
                className="instrument-item"
                label="Modifier"
                options={oscModifiers}
                setValue={updateOscModifier}
                value={oscModifier}
              />
            )}
            <RotaryKnob
              className="instrument-item"
              min={0}
              max={1}
              value={portamento}
              setValue={setPortamento}
              label="Portamento"
              setGrabbing={setGrabbing}
              grabbing={grabbing}
              inline={false}
              mute={false}
              linearKnobs={linearKnobs}
              theme={theme}
            />
            {(synthType.startsWith('am') || synthType.startsWith('fm')) && (
              <div className="controls-aux">
                <Dropdown
                  className="instrument-item"
                  label="Modulation"
                  options={signalTypeOptions}
                  setValue={setModulationType}
                  value={modulationType}
                  minWidth={95}
                />
                <RotaryKnob
                  className="instrument-item"
                  min={0}
                  max={2}
                  value={harmonicity}
                  setValue={setHarmonicity}
                  label="Harmonicity"
                  detent
                  setGrabbing={setGrabbing}
                  grabbing={grabbing}
                  inline={false}
                  mute={false}
                  linearKnobs={linearKnobs}
                  theme={theme}
                />
              </div>
            )}
            {synthType.startsWith('fat') && (
              <div className="controls-aux">
                <RotaryKnob
                  className="instrument-item"
                  min={10}
                  max={40}
                  value={fatSpread}
                  setValue={setFatSpread}
                  label="Detune"
                  setGrabbing={setGrabbing}
                  grabbing={grabbing}
                  inline={false}
                  mute={false}
                  linearKnobs={linearKnobs}
                  theme={theme}
                />
                <NumInput
                  className="instrument-item fat-count"
                  value={fatCount}
                  setValue={setFatCount}
                  label="# Osc"
                  min={2}
                  max={5}
                  inline={false}
                  short={false}
                />
              </div>
            )}
            {synthType === 'pulse' && (
              <div className="controls-aux">
                <RotaryKnob
                  className="instrument-item"
                  min={-0.5}
                  max={0.5}
                  value={pulseWidth}
                  setValue={setPulseWidth}
                  label="Pulse Width"
                  setGrabbing={setGrabbing}
                  grabbing={grabbing}
                  inline={false}
                  mute={false}
                  linearKnobs={linearKnobs}
                  theme={theme}
                />
              </div>
            )}
            {synthType === 'pwm' && (
              <div className="controls-aux">
                <RotaryKnob
                  className="instrument-item"
                  min={0.1}
                  max={5}
                  value={pwmFreq}
                  setValue={setPwmFreq}
                  label="PWM Freq"
                  setGrabbing={setGrabbing}
                  grabbing={grabbing}
                  inline={false}
                  mute={false}
                  linearKnobs={linearKnobs}
                  theme={theme}
                />
              </div>
            )}
          </div>
        </div>
        <div className="controls-row">
          <div className="controls-module envelope-controls">
            <p className="controls-label">Envelope</p>
            <RotaryKnob
              className="instrument-item"
              min={0}
              max={1}
              value={envAttack}
              setValue={setEnvAttack}
              label="Attack"
              setGrabbing={setGrabbing}
              grabbing={grabbing}
              inline={false}
              mute={false}
              linearKnobs={linearKnobs}
              theme={theme}
            />
            <RotaryKnob
              className="instrument-item"
              min={0}
              max={1}
              value={envDecay}
              setValue={setEnvDecay}
              label="Decay"
              setGrabbing={setGrabbing}
              grabbing={grabbing}
              inline={false}
              mute={false}
              linearKnobs={linearKnobs}
              theme={theme}
            />
            <RotaryKnob
              className="instrument-item"
              min={0}
              max={1}
              value={envSustain}
              setValue={setEnvSustain}
              label="Sustain"
              setGrabbing={setGrabbing}
              grabbing={grabbing}
              inline={false}
              mute={false}
              linearKnobs={linearKnobs}
              theme={theme}
            />
            <RotaryKnob
              className="instrument-item"
              min={0}
              max={4}
              value={envRelease}
              setValue={setEnvRelease}
              label="Release"
              setGrabbing={setGrabbing}
              grabbing={grabbing}
              inline={false}
              mute={false}
              linearKnobs={linearKnobs}
              theme={theme}
            />
          </div>
        </div>
        <div className="controls-row">
          <div className="controls-module">
            <p className="controls-label">Filter</p>
            <RotaryKnob
              className="instrument-item"
              min={20}
              max={5000}
              value={cutoff}
              setValue={setCutoff}
              label="Cutoff"
              setGrabbing={setGrabbing}
              grabbing={grabbing}
              inline={false}
              mute={false}
              linearKnobs={linearKnobs}
              theme={theme}
              logarithmic
            />
            <RotaryKnob
              className="instrument-item"
              min={0}
              max={15}
              value={resonance}
              setValue={setResonance}
              label="Resonance"
              setGrabbing={setGrabbing}
              grabbing={grabbing}
              inline={false}
              mute={false}
              linearKnobs={linearKnobs}
              theme={theme}
            />
            <Dropdown
              className="instrument-item"
              label="Rolloff"
              options={rolloffOptions}
              setValue={updateRolloff}
              value={rolloffString}
            />
          </div>
          <div className="controls-module envelope-controls">
            <p className="controls-label">Filter Envelope</p>
            <RotaryKnob
              className="instrument-item"
              min={0}
              max={1}
              value={filterAttack}
              setValue={setFilterAttack}
              label="Attack"
              setGrabbing={setGrabbing}
              grabbing={grabbing}
              inline={false}
              mute={false}
              linearKnobs={linearKnobs}
              theme={theme}
            />
            <RotaryKnob
              className="instrument-item"
              min={0}
              max={1}
              value={filterDecay}
              setValue={setFilterDecay}
              label="Decay"
              setGrabbing={setGrabbing}
              grabbing={grabbing}
              inline={false}
              mute={false}
              linearKnobs={linearKnobs}
              theme={theme}
            />
            <RotaryKnob
              className="instrument-item"
              min={0}
              max={1}
              value={filterSustain}
              setValue={setFilterSustain}
              label="Sustain"
              setGrabbing={setGrabbing}
              grabbing={grabbing}
              inline={false}
              mute={false}
              linearKnobs={linearKnobs}
              theme={theme}
            />
            <RotaryKnob
              className="instrument-item"
              min={0}
              max={4}
              value={filterRelease}
              setValue={setFilterRelease}
              label="Release"
              setGrabbing={setGrabbing}
              grabbing={grabbing}
              inline={false}
              mute={false}
              linearKnobs={linearKnobs}
              theme={theme}
            />
            <RotaryKnob
              className="instrument-item"
              min={1}
              max={5}
              value={filterAmount}
              setValue={setFilterAmount}
              label="Amount"
              setGrabbing={setGrabbing}
              grabbing={grabbing}
              inline={false}
              mute={false}
              linearKnobs={linearKnobs}
              theme={theme}
            />
          </div>
        </div>
      </div>
    ),
    [
      cutoff,
      envAttack,
      envDecay,
      envRelease,
      envSustain,
      fatCount,
      fatSpread,
      filterAmount,
      filterAttack,
      filterDecay,
      filterRelease,
      filterSustain,
      grabbing,
      harmonicity,
      linearKnobs,
      modulationType,
      oscModifier,
      portamento,
      pulseWidth,
      pwmFreq,
      resonance,
      rolloffString,
      setGrabbing,
      signalTypeOptions,
      synthBase,
      synthType,
      synthTypeOptions,
      theme,
      updateOscModifier,
      updateRolloff,
      updateSynthType,
    ]
  )
  const samplerInstrumentControls = useMemo(
    () => (
      <div className="sampler-controls">
        <div className="controls-row">
          <div className="controls-module">
            <p className="controls-label">Envelope</p>
            <RotaryKnob
              className="instrument-item"
              min={0}
              max={1}
              value={samplerAttack}
              setValue={setSamplerAttack}
              label="Attack"
              setGrabbing={setGrabbing}
              grabbing={grabbing}
              inline={false}
              mute={false}
              linearKnobs={linearKnobs}
              theme={theme}
            />
            <RotaryKnob
              className="instrument-item"
              min={0}
              max={1}
              value={samplerRelease}
              setValue={setSamplerRelease}
              label="Release"
              setGrabbing={setGrabbing}
              grabbing={grabbing}
              inline={false}
              mute={false}
              linearKnobs={linearKnobs}
              theme={theme}
            />
          </div>
        </div>
      </div>
    ),
    [grabbing, linearKnobs, samplerAttack, samplerRelease, setGrabbing, theme]
  )
  const wetControl = useMemo(
    () => (
      <RotaryKnob
        className="instrument-item"
        min={0}
        max={1}
        value={effectWet}
        setValue={setEffectWet}
        label="Amount"
        setGrabbing={setGrabbing}
        grabbing={grabbing}
        inline={false}
        mute={false}
        linearKnobs={linearKnobs}
        theme={theme}
      />
    ),
    [effectWet, grabbing, linearKnobs, setGrabbing, theme]
  )
  const chorusControls = useMemo(
    () =>
      effects.chorusEffect.current ? (
        <div className="controls-aux">
          <RotaryKnob
            className="instrument-item"
            min={0}
            max={1}
            value={chorusDepth}
            setValue={setChorusDepth}
            label="Depth"
            setGrabbing={setGrabbing}
            grabbing={grabbing}
            inline={false}
            mute={false}
            linearKnobs={linearKnobs}
            theme={theme}
            logarithmic
          />
          <RotaryKnob
            className="instrument-item"
            min={0.1}
            max={10}
            value={chorusDelayTime}
            setValue={setChorusDelayTime}
            label="Delay"
            setGrabbing={setGrabbing}
            grabbing={grabbing}
            inline={false}
            mute={false}
            linearKnobs={linearKnobs}
            theme={theme}
          />
          <RotaryKnob
            className="instrument-item"
            min={1}
            max={20}
            value={chorusFreq}
            setValue={setChorusFreq}
            label="Freq"
            setGrabbing={setGrabbing}
            grabbing={grabbing}
            inline={false}
            mute={false}
            linearKnobs={linearKnobs}
            theme={theme}
            logarithmic
          />
          <RotaryKnob
            className="instrument-item"
            min={0}
            max={180}
            value={chorusSpread}
            setValue={setChorusSpread}
            label="Stereo"
            setGrabbing={setGrabbing}
            grabbing={grabbing}
            inline={false}
            mute={false}
            linearKnobs={linearKnobs}
            theme={theme}
          />
        </div>
      ) : (
        <div className="controls-aux">
          <p className="effect-disabled">Chorus doesn't work in Safari 😢</p>
        </div>
      ),
    [
      chorusDelayTime,
      chorusDepth,
      chorusFreq,
      chorusSpread,
      effects.chorusEffect,
      grabbing,
      linearKnobs,
      setGrabbing,
      theme,
    ]
  )
  const distortionControls = useMemo(
    () => (
      <div className="controls-aux">
        <RotaryKnob
          className="instrument-item"
          min={0}
          max={3}
          value={distortion}
          setValue={setDistortion}
          label="Distortion"
          setGrabbing={setGrabbing}
          grabbing={grabbing}
          inline={false}
          mute={false}
          linearKnobs={linearKnobs}
          theme={theme}
        />
      </div>
    ),
    [distortion, grabbing, linearKnobs, setGrabbing, theme]
  )
  const delayControls = useMemo(
    () => (
      <div className="controls-aux">
        <div className="switch-container instrument-item">
          <Switch
            className="switch"
            onChange={setSyncDelayTime}
            checked={syncDelayTime}
            uncheckedIcon={false}
            checkedIcon={false}
            offColor={offColor}
            onColor={onColor}
            offHandleColor={offHandleColor}
            onHandleColor={onHandleColor}
            width={48}
            height={24}
          />
          <p className="switch-label">Sync</p>
        </div>
        {!syncDelayTime && (
          <RotaryKnob
            className="instrument-item"
            min={0}
            max={1}
            value={delayTime}
            setValue={setDelayTime}
            label="Time"
            setGrabbing={setGrabbing}
            grabbing={grabbing}
            inline={false}
            mute={false}
            linearKnobs={linearKnobs}
            theme={theme}
          />
        )}
        {syncDelayTime && (
          <Dropdown
            className="instrument-item"
            label="Time"
            options={syncedDelayOptions}
            setValue={setSyncedDelay}
            value={syncedDelay}
            placeholder="Select Rate"
            noTextTransform
            container=".modal-content"
          />
        )}
        <RotaryKnob
          className="instrument-item"
          min={0}
          max={1}
          value={delayFeedback}
          setValue={setDelayFeedback}
          label="Feedback"
          setGrabbing={setGrabbing}
          grabbing={grabbing}
          inline={false}
          mute={false}
          linearKnobs={linearKnobs}
          theme={theme}
        />
      </div>
    ),
    [
      delayFeedback,
      delayTime,
      grabbing,
      linearKnobs,
      offColor,
      offHandleColor,
      onColor,
      onHandleColor,
      setGrabbing,
      setSyncedDelay,
      syncDelayTime,
      syncedDelay,
      syncedDelayOptions,
      theme,
    ]
  )
  const reverbControls = useMemo(
    () => (
      <div className="controls-aux">
        <RotaryKnob
          className="instrument-item"
          min={0}
          max={4}
          value={reverbDecay}
          setValue={setReverbDecay}
          label="Decay"
          setGrabbing={setGrabbing}
          grabbing={grabbing}
          inline={false}
          mute={false}
          linearKnobs={linearKnobs}
          theme={theme}
        />
        <RotaryKnob
          className="instrument-item"
          min={0}
          max={0.5}
          value={reverbPreDelay}
          setValue={setReverbPreDelay}
          label="Pre Delay"
          setGrabbing={setGrabbing}
          grabbing={grabbing}
          inline={false}
          mute={false}
          linearKnobs={linearKnobs}
          theme={theme}
        />
      </div>
    ),
    [grabbing, linearKnobs, reverbDecay, reverbPreDelay, setGrabbing, theme]
  )
  const vibratoControls = useMemo(
    () => (
      <div className="controls-aux">
        <RotaryKnob
          className="instrument-item"
          min={0}
          max={1}
          value={vibratoDepth}
          setValue={setVibratoDepth}
          label="Depth"
          setGrabbing={setGrabbing}
          grabbing={grabbing}
          inline={false}
          mute={false}
          linearKnobs={linearKnobs}
          theme={theme}
        />
        <RotaryKnob
          className="instrument-item"
          min={1}
          max={20}
          value={vibratoFreq}
          setValue={setVibratoFreq}
          label="Freq"
          setGrabbing={setGrabbing}
          grabbing={grabbing}
          inline={false}
          mute={false}
          linearKnobs={linearKnobs}
          theme={theme}
          logarithmic
        />
      </div>
    ),
    [grabbing, linearKnobs, setGrabbing, theme, vibratoDepth, vibratoFreq]
  )

  return (
    <div className={classNames('instrument-modal', { short: instrumentType !== 'synth' })}>
      <div className="instrument-type">
        <Instrument
          className="modal-instrument"
          instrumentOn={instrumentOn}
          setInstrumentOn={setInstrumentOn}
          instrumentType={instrumentType}
          setInstrumentType={setInstrumentType}
          small={false}
          theme={theme}
          mute={false}
          inModal={true}
        />
        <RotaryKnob
          className="instrument-item"
          min={0}
          max={1}
          value={gain}
          setValue={setGain}
          label="Volume"
          setGrabbing={setGrabbing}
          grabbing={grabbing}
          inline={true}
          mute={false}
          linearKnobs={linearKnobs}
          theme={theme}
        />
      </div>
      <div className="instrument-controls">
        {instrumentType === 'synth' && synthInstrumentControls}
        {instrumentType !== 'synth' && samplerInstrumentControls}
        <div className="controls-row">
          <div className="controls-module effects-controls">
            <p className="controls-label">Effects</p>
            <Dropdown
              className="instrument-item"
              label="Effect"
              options={EFFECTS}
              setValue={setEffectType}
              value={effectType}
              container=".modal-content"
            />
            {effectType !== 'none' && effects[effectType + 'Effect'].current && wetControl}
            {effectType === 'chorus' && chorusControls}
            {effectType === 'distortion' && distortionControls}
            {effectType === 'delay' && delayControls}
            {effectType === 'reverb' && reverbControls}
            {effectType === 'vibrato' && vibratoControls}
          </div>
        </div>
      </div>
    </div>
  )
}
InstrumentModal.propTypes = {
  instrumentOn: PropTypes.bool,
  setInstrumentOn: PropTypes.func,
  instrumentType: PropTypes.string,
  setInstrumentType: PropTypes.func,
  theme: PropTypes.string,
  instrumentParams: PropTypes.object,
  setInstrumentParams: PropTypes.func,
  instruments: PropTypes.object,
  gainNode: PropTypes.object,
  effects: PropTypes.object,
  grabbing: PropTypes.bool,
  setGrabbing: PropTypes.func,
  linearKnobs: PropTypes.bool,
}
