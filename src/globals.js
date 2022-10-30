import React from 'react'
import { v4 as uuid } from 'uuid'
import UAParser from 'ua-parser-js'
import sine from './assets/sine_wave.svg'
import lightSine from './assets/sine_wave_light.svg'
import darkSine from './assets/sine_wave_dark.svg'
import square from './assets/square_wave.svg'
import lightSquare from './assets/square_wave_light.svg'
import darkSquare from './assets/square_wave_dark.svg'
import triangle from './assets/triangle_wave.svg'
import lightTriangle from './assets/triangle_wave_light.svg'
import darkTriangle from './assets/triangle_wave_dark.svg'
import sawtooth from './assets/sawtooth_wave.svg'
import lightSawtooth from './assets/sawtooth_wave_light.svg'
import darkSawtooth from './assets/sawtooth_wave_dark.svg'
import pulse from './assets/pulse_wave.svg'
import lightPulse from './assets/pulse_wave_light.svg'
import darkPulse from './assets/pulse_wave_dark.svg'
import drums from './assets/samples-drums.svg'
import lightDrums from './assets/samples-drums-light.svg'
import darkDrums from './assets/samples-drums-dark.svg'
import drumMachine from './assets/samples-drum-machine.svg'
import lightDrumMachine from './assets/samples-drum-machine-light.svg'
import darkDrumMachine from './assets/samples-drum-machine-dark.svg'
import marimba from './assets/samples-marimba.svg'
import lightMarimba from './assets/samples-marimba-light.svg'
import darkMarimba from './assets/samples-marimba-dark.svg'
import piano from './assets/samples-piano.svg'
import lightPiano from './assets/samples-piano-light.svg'
import darkPiano from './assets/samples-piano-dark.svg'
import synth from './assets/samples-synth.svg'
import lightSynth from './assets/samples-synth-light.svg'
import darkSynth from './assets/samples-synth-dark.svg'
import bass from './assets/samples-bass.svg'
import lightBass from './assets/samples-bass-light.svg'
import darkBass from './assets/samples-bass-dark.svg'
import vibes from './assets/samples-vibes.svg'
import lightVibes from './assets/samples-vibes-light.svg'
import darkVibes from './assets/samples-vibes-dark.svg'
import harp from './assets/samples-harp.svg'
import lightHarp from './assets/samples-harp-light.svg'
import darkHarp from './assets/samples-harp-dark.svg'
import choral from './assets/samples-choral.svg'
import lightChoral from './assets/samples-choral-light.svg'
import darkChoral from './assets/samples-choral-dark.svg'

const uaParser = new UAParser()
export const BROWSER = uaParser.getBrowser()
const device = uaParser.getDevice()
if (device.type === 'mobile' || BROWSER.name.includes('Mobile')) {
  alert('🗣 sounds can only play if your device is not on silent')
}

export const LANE_COLORS = [
  {
    base: '#008dff',
    hover: '#33a4ff',
    lane: '#e6f3fc',
    light: '#8fd2ff',
    lightest: '#b3ddff',
    dark: '#0247aa',
    white: '#E6F3FC',
    gray: '#BFCED6',
  }, // blue
  {
    base: '#00DD69',
    hover: '#20f279',
    lane: '#e8f7eb',
    light: '#82f9b2',
    lightest: '#a2fcc7',
    dark: '#03843a',
    white: '#E8F7EB',
    gray: '#B8D1BC',
  }, // green
  {
    base: '#FF88E3',
    hover: '#ffabef',
    lane: '#ffeeff',
    light: '#f9c7ef',
    lightest: '#fcd4f4',
    dark: '#c4009f',
    white: '#FFEEFF',
    gray: '#D9C8DB',
  }, // pink
  {
    base: '#7C00FF',
    hover: '#994aff',
    lane: '#efeeff',
    light: '#c3a4ff',
    lightest: '#d4b8ff',
    dark: '#4600a0',
    white: '#EFEEFF',
    gray: '#C6C6E0',
  }, // purple
  {
    base: '#FF3154',
    hover: '#ff577b',
    lane: '#fff0f5',
    light: '#f99bbd',
    lightest: '#fcb4cb',
    dark: '#bf0029',
    white: '#FFF0F5',
    gray: '#DDCAD2',
  }, // red
  {
    base: '#FF9B00',
    hover: '#ffb452',
    lane: '#fff2e3',
    light: '#ffd0a6',
    lightest: '#ffdebb',
    dark: '#af5300',
    white: '#FFF2E3',
    gray: '#DDCFC3',
  }, // orange
  {
    base: '#d600a9',
    hover: '#ef48cf',
    lane: '#f9edf9',
    light: '#ff92f5',
    lightest: '#ffa9f3',
    dark: '#9b0085',
    white: '#F9EDF9',
    gray: '#D7CAD8',
  }, // magenta
  {
    base: '#00c6a9',
    hover: '#40e2c7',
    lane: '#e1f9f4',
    light: '#62efd4',
    lightest: '#80ffe7',
    dark: '#006b68',
    white: '#E1F9F4',
    gray: '#BAD1CB',
  }, // teal
]
export const EIGHTH_WIDTH = 24
export const NOTE_HEIGHT = 12
export const KEYS_WIDTH = 10
export const MIN_DELIMITER_WIDTH = 8
export const MAX_LANES = 8

export const MIN_MIDI_NOTE = 21
export const MAX_MIDI_NOTE = 127

export const KNOB_MAX = 1

export const EFFECTS = ['none', 'chorus', 'distortion', 'delay', 'reverb', 'vibrato']
export const CHORUS_ENABLED = !BROWSER.name.includes('Safari')

export function calcLaneLength(width, direction = -1) {
  const measures = width / (EIGHTH_WIDTH * 8)
  return (direction < 0 ? Math.floor(measures) : Math.ceil(measures)) * 8
}

const defaultLaneLength = calcLaneLength(window.innerWidth - 30)

const laneID = uuid()
export const DEFAULT_LANE = (id = laneID, laneLength = defaultLaneLength, colorIndex = 0) => ({
  id,
  laneLength,
  notes: [],
  viewRange: { min: 60, max: 71 },
  colorIndex,
  mute: false,
  solo: false,
  midiChannels: {},
})

export const DEFAULT_PRESET = JSON.stringify({
  id: uuid(),
  tempo: 120,
  snapToGrid: true,
  grid: '8n',
  beatsPerBar: 4,
  beatValue: 4,
  lanes: [DEFAULT_LANE()],
  delimiters: [
    {
      lanes: { [laneID]: 1 },
      x: 0,
      hidden: false,
    },
  ],
  end: {
    snap: '8n',
    snapNumber: defaultLaneLength,
    x: defaultLaneLength * EIGHTH_WIDTH,
  },
  swing: 0,
  instrumentOn: true,
  instrumentType: 'synth',
  instrumentParams: {
    gain: 1,
    synthType: 'triangle',
    portamento: 0,
    modulationType: 'square',
    harmonicity: 1,
    fatSpread: 20,
    fatCount: 3,
    pulseWidth: 0.2,
    pwmFreq: 0.4,
    envAttack: 0.05,
    envDecay: 0.1,
    envSustain: 0.9,
    envRelease: 1,
    cutoff: 3000,
    resonance: 1,
    rolloff: -24,
    filterAttack: 0.05,
    filterDecay: 0.2,
    filterSustain: 0.5,
    filterRelease: 2,
    filterAmount: 3,
    samplerAttack: 0,
    samplerRelease: 1,
    effectType: EFFECTS[0],
    effectWet: 1,
    chorusDepth: 0.5,
    chorusDelayTime: 2.5,
    chorusFreq: 4,
    chorusSpread: 0,
    distortion: 1,
    syncDelayTime: false,
    delayTime: 0.25,
    delayFeedback: 0.5,
    reverbDecay: 1.5,
    reverbPreDelay: 0.01,
    vibratoDepth: 0.1,
    vibratoFreq: 5,
  },
})

// rates, relative to an eighth note
export const RATE_MULTS = {
  '1n': 8,
  '1n.': 12,
  '2n': 4,
  '2n.': 6,
  '2t': 8 / 3,
  '4n': 2,
  '4n.': 3,
  '4t': 4 / 3,
  '8n': 1,
  '8n.': 1.5,
  '8t': 2 / 3,
  '16n': 0.5,
  '16n.': 0.75,
  '16t': 1 / 3,
  '32n': 0.25,
  '32n.': 0.375,
  '32t': 0.5 / 3,
  // '64n': 0.125,
  // '64n.': 0.1875,
  // '64t': 0.25 / 3,
}

export function mapLaneLength(laneLength, grid) {
  return Math.ceil(laneLength / RATE_MULTS[grid])
}

export const RATE_TICKS = {
  '1n': () => true,
  '1n.': () => true,
  '2n': () => true,
  '2n.': () => true,
  '2t': () => true,
  '4n': () => true,
  '4n.': () => true,
  '4t': (i) => i % 3 === 0,
  '8n': (i) => i % 2 === 0,
  '8n.': () => true,
  '8t': (i) => i % 3 === 0,
  '16n': (i) => i % 4 === 0,
  '16n.': () => true,
  '16t': (i) => i % 6 === 0,
  '32n': (i) => i % 8 === 0,
  '32n.': () => true,
  '32t': (i) => i % 12 === 0,
}

export const RATES = Object.keys(RATE_MULTS)

export const THEMES = ['dark', 'light']

function themedIcon(icon, theme) {
  switch (icon) {
    case 'sine':
      switch (theme) {
        case 'light':
          return sine
        case 'dark':
          return lightSine
        case 'contrast':
          return darkSine
        default:
          return sine
      }
    case 'square':
      switch (theme) {
        case 'light':
          return square
        case 'dark':
          return lightSquare
        case 'contrast':
          return darkSquare
        default:
          return square
      }
    case 'triangle':
      switch (theme) {
        case 'light':
          return triangle
        case 'dark':
          return lightTriangle
        case 'contrast':
          return darkTriangle
        default:
          return triangle
      }
    case 'sawtooth':
      switch (theme) {
        case 'light':
          return sawtooth
        case 'dark':
          return lightSawtooth
        case 'contrast':
          return darkSawtooth
        default:
          return sawtooth
      }
    case 'pulse':
      switch (theme) {
        case 'light':
          return pulse
        case 'dark':
          return lightPulse
        case 'contrast':
          return darkPulse
        default:
          return pulse
      }
    case 'drums':
      switch (theme) {
        case 'light':
          return drums
        case 'dark':
          return lightDrums
        case 'contrast':
          return darkDrums
        default:
          return drums
      }
    case 'drum-machine':
      switch (theme) {
        case 'light':
          return drumMachine
        case 'dark':
          return lightDrumMachine
        case 'contrast':
          return darkDrumMachine
        default:
          return drumMachine
      }
    case 'marimba':
      switch (theme) {
        case 'light':
          return marimba
        case 'dark':
          return lightMarimba
        case 'contrast':
          return darkMarimba
        default:
          return marimba
      }
    case 'piano':
      switch (theme) {
        case 'light':
          return piano
        case 'dark':
          return lightPiano
        case 'contrast':
          return darkPiano
        default:
          return piano
      }
    case 'synth':
      switch (theme) {
        case 'light':
          return synth
        case 'dark':
          return lightSynth
        case 'contrast':
          return darkSynth
        default:
          return synth
      }
    case 'bass':
      switch (theme) {
        case 'light':
          return bass
        case 'dark':
          return lightBass
        case 'contrast':
          return darkBass
        default:
          return bass
      }
    case 'vibes':
      switch (theme) {
        case 'light':
          return vibes
        case 'dark':
          return lightVibes
        case 'contrast':
          return darkVibes
        default:
          return vibes
      }
    case 'harp':
      switch (theme) {
        case 'light':
          return harp
        case 'dark':
          return lightHarp
        case 'contrast':
          return darkHarp
        default:
          return harp
      }
    case 'choral':
      switch (theme) {
        case 'light':
          return choral
        case 'dark':
          return lightChoral
        case 'contrast':
          return darkChoral
        default:
          return choral
      }
    default:
      return null
  }
}

export function themedSwitch(component, theme, mute) {
  switch (component) {
    case 'offColor':
      switch (theme) {
        case 'light':
          return '#a8d6ff'
        case 'dark':
          return '#45454c'
        case 'contrast':
          return '#45454C'
        default:
          return '#e6e6e6'
      }
    case 'onColor':
      switch (theme) {
        case 'light':
          return '#a8d6ff'
        case 'dark':
          return '#45454c'
        case 'contrast':
          return '#45454C'
        default:
          return '#e6e6e6'
      }
    case 'offHandleColor':
      switch (theme) {
        case 'light':
          return '#008dff'
        case 'dark':
          return '#a0a0b4'
        case 'contrast':
          return mute ? '#aab1cc' : '#CCD0FF'
        default:
          return '#666666'
      }
    case 'onHandleColor':
      switch (theme) {
        case 'light':
          return '#ff88e3'
        case 'dark':
          return '#00c591'
        case 'contrast':
          return '#33ff00'
        default:
          return '#33ff00'
      }
    default:
      return '#e6e6e6'
  }
}

export const SIGNAL_TYPES = {
  sine: (theme) => <img className="wave-icon" src={themedIcon('sine', theme)} alt="" />,
  square: (theme) => <img className="wave-icon" src={themedIcon('square', theme)} alt="" />,
  triangle: (theme) => <img className="wave-icon" src={themedIcon('triangle', theme)} alt="" />,
  sawtooth: (theme) => <img className="wave-icon" src={themedIcon('sawtooth', theme)} alt="" />,
}
export const SYNTH_TYPES = Object.assign({}, SIGNAL_TYPES, {
  pulse: (theme) => <img className="wave-icon" src={themedIcon('pulse', theme)} alt="" />,
  pwm: () => (
    <span className="wave-title" style={{ marginRight: 0 }}>
      pwm
    </span>
  ),
})

export const INSTRUMENT_TYPES = {
  synth: (theme) => <img className="wave-icon" style={{ height: 20 }} src={themedIcon('synth', theme)} alt="" />,
  bass: (theme) => <img className="wave-icon" style={{ height: 28 }} src={themedIcon('bass', theme)} alt="" />,
  piano: (theme) => <img className="wave-icon" style={{ height: 20 }} src={themedIcon('piano', theme)} alt="" />,
  marimba: (theme) => <img className="wave-icon" style={{ height: 18 }} src={themedIcon('marimba', theme)} alt="" />,
  vibes: (theme) => <img className="wave-icon" style={{ height: 20 }} src={themedIcon('vibes', theme)} alt="" />,
  harp: (theme) => <img className="wave-icon" style={{ height: 20 }} src={themedIcon('harp', theme)} alt="" />,
  choral: (theme) => <img className="wave-icon" style={{ height: 20 }} src={themedIcon('choral', theme)} alt="" />,
  drums: (theme) => <img className="wave-icon" style={{ height: 20 }} src={themedIcon('drums', theme)} alt="" />,
  'drum-machine': (theme) => (
    <img className="wave-icon" style={{ height: 20 }} src={themedIcon('drum-machine', theme)} alt="" />
  ),
}
