import React, { useCallback, useMemo, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { Knob } from 'react-rotary-knob'
import LinearKnob from './LinearKnob'
import { KNOB_MAX } from '../../globals'
import { expInterpolate } from '../../util'
import './RotaryKnob.scss'

const AXIS_LINE_SIZE = 270
const RANDOM_RANGE = 10000000

export default function RotaryKnob({
  value,
  setValue,
  min,
  max,
  label,
  grabbing,
  setGrabbing,
  className,
  axisKnob,
  axisKnobLarge,
  turningAxisKnob,
  startChangingAxis,
  stopChangingAxis,
  squeeze,
  inline,
  tiny,
  detent,
  mute,
  linearKnobs,
  theme,
  rangeMode,
  logarithmic,
  updateOnce,
}) {
  const minVal = useMemo(() => min || 0, [min])
  const maxVal = useMemo(() => (axisKnob ? 24 : max || KNOB_MAX), [axisKnob, max])

  const [internalValue, setInternalValue] = useState(logarithmic ? expInterpolate(minVal, maxVal, value, true) : value)

  const updateValue = useCallback(
    (val) => {
      let newValue
      if (axisKnob) {
        const roundedVal = Math.round(val) % 12
        if (roundedVal !== value) {
          newValue = roundedVal
        }
      } else {
        const mid = (maxVal - minVal) / 2 + minVal
        const range = maxVal - minVal
        const maxDistance = (maxVal - minVal) / 5
        let distance = Math.abs(val - value)
        if (!linearKnobs && distance > maxDistance) {
          if (val - value > 0 && value !== minVal) {
            newValue = minVal
          } else if (val - value < 0 && value !== maxVal) {
            newValue = maxVal
          }
          return
        } else {
          if (detent && val > mid - range * 0.05 && val < mid + range * 0.05) {
            newValue = mid
          } else {
            newValue = val
          }
        }
      }
      if (newValue != null) {
        setInternalValue(newValue)
        if (logarithmic) {
          newValue = expInterpolate(minVal, maxVal, newValue)
        }
        setValue(newValue)
      }
    },
    [axisKnob, logarithmic, setValue, value, maxVal, minVal, linearKnobs, detent]
  )

  useEffect(() => {
    if (updateOnce) {
      setInternalValue(logarithmic ? expInterpolate(minVal, maxVal, value, true) : value)
    }
  }, [logarithmic, maxVal, minVal, updateOnce, value])

  const startTurningKnob = useCallback(() => {
    setGrabbing(true)
  }, [setGrabbing])

  const stopTurningKnob = useCallback(() => {
    setGrabbing(false)
  }, [setGrabbing])

  const knobSize = useMemo(() => {
    if (axisKnobLarge) {
      return {
        width: '60px',
        height: '60px',
        position: 'absolute',
        top: 84,
        left: 119,
      }
    }
    if (axisKnob) {
      return {
        width: '42px',
        height: '42px',
      }
    }
    if (inline) {
      return {
        width: '39px',
        height: '35px',
      }
    }
    if (tiny) {
      return {
        width: '34px',
        height: '30px',
      }
    }
    return {}
  }, [axisKnob, axisKnobLarge, inline, tiny])

  const knobColor = useMemo(() => {
    switch (theme) {
      case 'light':
        return mute ? 'D8D8D8' : 'a8d6ff'
      case 'dark':
        return mute ? '39393f' : '45454c'
      case 'contrast':
        return mute ? 'aab1cc' : 'CCD0FF'
      default:
        return mute ? 'D8D8D8' : 'E6E6E6'
    }
  }, [mute, theme])

  const knobInnerStroke = useMemo(() => {
    switch (theme) {
      case 'light':
        return 'FFFFFF'
      case 'dark':
        return '090c10'
      case 'contrast':
        return '090C10'
      default:
        return 'FFFFFF'
    }
  }, [theme])

  const knobOuterStroke = useMemo(() => {
    switch (theme) {
      case 'light':
        return '33a4ff'
      case 'dark':
        return '23232b'
      case 'contrast':
        return mute ? '454C60' : '757CA0'
      default:
        return 'CCCCCC'
    }
  }, [mute, theme])

  const knobIndicator = useMemo(() => {
    switch (theme) {
      case 'light':
        return '0247aa'
      case 'dark':
        return 'a0a0b4'
      case 'contrast':
        return mute ? '1C1C23' : '383842'
      default:
        return '666666'
    }
  }, [mute, theme])

  const knobTicks = useMemo(() => {
    switch (theme) {
      case 'light':
        return '999999'
      case 'dark':
        return '666666'
      case 'contrast':
        return 'CCD0FF'
      default:
        return '999999'
    }
  }, [theme])

  const skin = useMemo(() => {
    const st0 = Math.round(Math.random() * RANDOM_RANGE)
    const st1 = Math.round(Math.random() * RANDOM_RANGE)
    const st2 = Math.round(Math.random() * RANDOM_RANGE)
    const st3 = Math.round(Math.random() * RANDOM_RANGE)
    const st4 = Math.round(Math.random() * RANDOM_RANGE)
    return {
      knobX: 55,
      knobY: 55.5,
      svg: `
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 110.6 97.5" style="enable-background:new 0 0 110.6 97.5;" xml:space="preserve">
<style type="text/css">
	.st${st0}{fill:#${knobColor};}
	.st${st1}{fill:#${knobOuterStroke};}
	.st${st2}{fill:#${knobInnerStroke};}
	.st${st3}{fill:#${knobIndicator};}
	.st${st4}{fill:none;stroke:#${knobTicks};stroke-miterlimit:10;}
</style>
<desc>Created with Sketch.</desc>
<g id="knob">
	<circle class="st${st0}" cx="55" cy="55.5" r="41"/>
	<path class="st${st1}" d="M26.7,27.2c15.6-15.6,40.9-15.6,56.6,0s15.6,40.9,0,56.6s-40.9,15.6-56.6,0S11.1,42.9,26.7,27.2 M25.3,25.8
		c-16.4,16.4-16.4,43,0,59.4s43,16.4,59.4,0s16.4-43,0-59.4S41.7,9.4,25.3,25.8L25.3,25.8z"/>
	<path class="st${st2}" d="M27.4,27.9c15.2-15.2,39.9-15.2,55.2,0s15.2,39.9,0,55.2s-39.9,15.2-55.2,0S12.2,43.1,27.4,27.9 M26.7,27.2
		c-15.6,15.6-15.6,40.9,0,56.6s40.9,15.6,56.6,0s15.6-40.9,0-56.6S42.3,11.6,26.7,27.2L26.7,27.2z"/>
	<g>
		<rect x="53" y="15.5" class="st${st3}" width="4" height="28.1"/>
	</g>
</g>
<g>
	<line class="st${st4}" x1="8" y1="55.3" x2="0" y2="55.3"/>
	<line class="st${st4}" x1="110.6" y1="55.3" x2="102.6" y2="55.3"/>
	<line class="st${st4}" x1="55.3" y1="0" x2="55.3" y2="8"/>
	<line class="st${st4}" x1="88.8" y1="88.8" x2="94.4" y2="94.4"/>
	<line class="st${st4}" x1="16.2" y1="16.2" x2="21.9" y2="21.9"/>
	<line class="st${st4}" x1="88.8" y1="21.9" x2="94.4" y2="16.2"/>
	<line class="st${st4}" x1="16.2" y1="94.4" x2="21.9" y2="88.8"/>
</g>
</svg>
`,
    }
  }, [knobColor, knobIndicator, knobInnerStroke, knobOuterStroke, knobTicks])

  const detentSkin = useMemo(() => {
    const st0 = Math.round(Math.random() * RANDOM_RANGE)
    const st1 = Math.round(Math.random() * RANDOM_RANGE)
    const st2 = Math.round(Math.random() * RANDOM_RANGE)
    const st3 = Math.round(Math.random() * RANDOM_RANGE)
    const st4 = Math.round(Math.random() * RANDOM_RANGE)
    const st5 = Math.round(Math.random() * RANDOM_RANGE)
    return {
      knobX: 55,
      knobY: 55.5,
      svg: `
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 110.6 97.5" style="enable-background:new 0 0 110.6 97.5;" xml:space="preserve">
<style type="text/css">
	.st${st0}{fill:#${knobColor};}
	.st${st1}{fill:#${knobOuterStroke};}
	.st${st2}{fill:#${knobInnerStroke};}
	.st${st3}{fill:#${knobIndicator};}
	.st${st4}{fill:none;stroke:#${knobTicks};stroke-miterlimit:10;}
  .st${st5}{fill:none;stroke:#${knobTicks};stroke-width:2;stroke-miterlimit:10;}
</style>
<desc>Created with Sketch.</desc>
<g id="knob">
	<circle class="st${st0}" cx="55" cy="55.5" r="41"/>
	<path class="st${st1}" d="M26.7,27.2c15.6-15.6,40.9-15.6,56.6,0s15.6,40.9,0,56.6s-40.9,15.6-56.6,0S11.1,42.9,26.7,27.2 M25.3,25.8
		c-16.4,16.4-16.4,43,0,59.4s43,16.4,59.4,0s16.4-43,0-59.4S41.7,9.4,25.3,25.8L25.3,25.8z"/>
	<path class="st${st2}" d="M27.4,27.9c15.2-15.2,39.9-15.2,55.2,0s15.2,39.9,0,55.2s-39.9,15.2-55.2,0S12.2,43.1,27.4,27.9 M26.7,27.2
		c-15.6,15.6-15.6,40.9,0,56.6s40.9,15.6,56.6,0s15.6-40.9,0-56.6S42.3,11.6,26.7,27.2L26.7,27.2z"/>
	<g>
		<rect x="53" y="15.5" class="st${st3}" width="4" height="28.1"/>
	</g>
</g>
<g>
	<line class="st${st4}" x1="8" y1="55.3" x2="0" y2="55.3"/>
	<line class="st${st4}" x1="110.6" y1="55.3" x2="102.6" y2="55.3"/>
	<line class="st${st4}" x1="88.8" y1="88.8" x2="94.4" y2="94.4"/>
	<line class="st${st4}" x1="16.2" y1="16.2" x2="21.9" y2="21.9"/>
	<line class="st${st4}" x1="88.8" y1="21.9" x2="94.4" y2="16.2"/>
	<line class="st${st4}" x1="16.2" y1="94.4" x2="21.9" y2="88.8"/>
  <polyline class="st${st5}" points="61,0 55.3,8 49.6,0 	"/>
</g>
</svg>
`,
    }
  }, [knobColor, knobIndicator, knobInnerStroke, knobOuterStroke, knobTicks])

  const axisSkin = useMemo(() => {
    const st0 = Math.round(Math.random() * RANDOM_RANGE)
    const st1 = Math.round(Math.random() * RANDOM_RANGE)
    const st2 = Math.round(Math.random() * RANDOM_RANGE)
    const st3 = Math.round(Math.random() * RANDOM_RANGE)
    return {
      knobX: 42,
      knobY: 42,
      svg: `
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 84 84" style="enable-background:new 0 0 84 84;" xml:space="preserve">
<style type="text/css">
	.st${st0}{fill:#${knobColor};}
	.st${st1}{fill:#${knobOuterStroke};}
	.st${st2}{fill:#${knobInnerStroke};}
	.st${st3}{fill:#${knobIndicator};}
</style>
<desc>Created with Sketch.</desc>
<g id="knob">
	<g>
		<path class="st${st0}" d="M42,83c-11,0-21.2-4.3-29-12C-3,55-3,29,13,13C20.8,5.3,31,1,42,1c11,0,21.2,4.3,29,12c16,16,16,42,0,58
			C63.2,78.7,53,83,42,83z"/>
		<path class="st${st1}" d="M42,2c10.2,0,20.5,3.9,28.3,11.7c15.6,15.6,15.6,40.9,0,56.6C62.5,78.1,52.2,82,42,82s-20.5-3.9-28.3-11.7
			c-15.6-15.6-15.6-40.9,0-56.6C21.5,5.9,31.8,2,42,2 M42,0C30.8,0,20.2,4.4,12.3,12.3C4.4,20.2,0,30.8,0,42
			c0,11.2,4.4,21.8,12.3,29.7C20.2,79.6,30.8,84,42,84c11.2,0,21.8-4.4,29.7-12.3C79.6,63.8,84,53.2,84,42
			c0-11.2-4.4-21.8-12.3-29.7C63.8,4.4,53.2,0,42,0L42,0z"/>
	</g>
	<g>
		<path class="st${st2}" d="M42,3c10.4,0,20.2,4.1,27.6,11.4c15.2,15.2,15.2,39.9,0,55.2C62.2,76.9,52.4,81,42,81
			c-10.4,0-20.2-4.1-27.6-11.4c-15.2-15.2-15.2-39.9,0-55.2C21.8,7.1,31.6,3,42,3 M42,2C31.8,2,21.5,5.9,13.7,13.7
			c-15.6,15.6-15.6,40.9,0,56.6C21.5,78.1,31.8,82,42,82s20.5-3.9,28.3-11.7c15.6-15.6,15.6-40.9,0-56.6C62.5,5.9,52.2,2,42,2L42,2z
			"/>
	</g>
	<g>
		<rect x="40" y="2" class="st${st3}" width="4" height="80"/>
	</g>
	<g>
		<g>
			<rect x="17.6" y="41" class="st${st3}" width="11.7" height="2"/>
		</g>
		<g>
			<g>
				<polygon class="st${st3}" points="19.1,47.2 10.1,42 19.1,36.8 				"/>
			</g>
		</g>
	</g>
	<g>
		<g>
			<rect x="54.7" y="41" class="st${st3}" width="11.7" height="2"/>
		</g>
		<g>
			<g>
				<polygon class="st${st3}" points="64.9,36.8 73.9,42 64.9,47.2 				"/>
			</g>
		</g>
	</g>
</g>
</svg>
`,
    }
  }, [knobColor, knobIndicator, knobInnerStroke, knobOuterStroke])

  const activeSkin = useMemo(() => {
    if (axisKnob) return axisSkin
    if (detent) return detentSkin
    return skin
  }, [axisKnob, axisSkin, detent, detentSkin, skin])

  const activeClass = useMemo(() => {
    return classNames('knob', { grabbing })
  }, [grabbing])

  const onStart = useMemo(
    () => (axisKnob ? startChangingAxis : startTurningKnob),
    [axisKnob, startChangingAxis, startTurningKnob]
  )
  const onEnd = useMemo(
    () => (axisKnob ? stopChangingAxis : stopTurningKnob),
    [axisKnob, stopChangingAxis, stopTurningKnob]
  )
  const clampMax = useMemo(() => (axisKnob ? 360 : 270), [axisKnob])
  const rotateDegrees = useMemo(() => (axisKnob ? 0 : -135), [axisKnob])

  const axisKnobHelper = useMemo(
    () => (
      <div className="axis-knob-helper">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform: `rotate(${value * 15}deg)`,
            left: AXIS_LINE_SIZE / -2 + (axisKnobLarge ? 149 : 21),
            top: AXIS_LINE_SIZE / -2 + (axisKnobLarge ? 114 : 21),
          }}
          className="axis-line"
          width={AXIS_LINE_SIZE}
          height={AXIS_LINE_SIZE}>
          <defs>
            <filter id="filter">
              <feGaussianBlur stdDeviation="15" />
            </filter>
            <mask id="mask">
              <ellipse
                cx={AXIS_LINE_SIZE / 2}
                cy={AXIS_LINE_SIZE / 2}
                rx={AXIS_LINE_SIZE / 2 - 40}
                ry={AXIS_LINE_SIZE / 2 - 40}
                fill="white"
                filter="url(#filter)"></ellipse>
            </mask>
          </defs>
          <rect x="0" y="0" width={AXIS_LINE_SIZE / 2} height={AXIS_LINE_SIZE} fill="transparent" mask="url(#mask)" />
        </svg>
      </div>
    ),
    [axisKnobLarge, value]
  )
  const linearKnob = useMemo(
    () => (
      <LinearKnob
        className={activeClass}
        min={minVal}
        max={maxVal}
        value={internalValue}
        onChange={updateValue}
        skin={activeSkin}
        unlockDistance={30}
        style={knobSize}
        onStart={onStart}
        onEnd={onEnd}
        clampMax={clampMax}
        rotateDegrees={rotateDegrees}
      />
    ),
    [
      activeClass,
      activeSkin,
      clampMax,
      internalValue,
      knobSize,
      maxVal,
      minVal,
      onEnd,
      onStart,
      rotateDegrees,
      updateValue,
    ]
  )
  const relativeCircularKnob = useMemo(
    () => (
      <Knob
        className={activeClass}
        min={minVal}
        max={maxVal}
        value={internalValue}
        onChange={updateValue}
        skin={activeSkin}
        unlockDistance={30}
        preciseMode={false}
        style={knobSize}
        onStart={onStart}
        onEnd={onEnd}
        clampMax={clampMax}
        rotateDegrees={rotateDegrees}
      />
    ),
    [
      activeClass,
      activeSkin,
      clampMax,
      internalValue,
      knobSize,
      maxVal,
      minVal,
      onEnd,
      onStart,
      rotateDegrees,
      updateValue,
    ]
  )
  const knobStyle = useMemo(() => ({ marginLeft: squeeze && -squeeze }), [squeeze])

  return (
    <div
      style={knobStyle}
      className={classNames('knob-container', className, {
        'axis-knob': axisKnob,
        'axis-knob-large': axisKnobLarge,
        'knob-active': turningAxisKnob,
        'inline-knob': inline,
        'tiny-knob': tiny,
        'hidden-knob': axisKnob && !rangeMode,
      })}>
      {axisKnob && axisKnobHelper}
      {linearKnobs ? linearKnob : relativeCircularKnob}
      <div className="knob-label no-select">{axisKnob ? 'Axis' : label}</div>
    </div>
  )
}
RotaryKnob.propTypes = {
  value: PropTypes.number,
  setValue: PropTypes.func,
  min: PropTypes.number,
  max: PropTypes.number,
  label: PropTypes.string,
  grabbing: PropTypes.bool,
  setGrabbing: PropTypes.func,
  className: PropTypes.string,
  axisKnob: PropTypes.bool,
  axisKnobLarge: PropTypes.bool,
  turningAxisKnob: PropTypes.bool,
  keyPreview: PropTypes.array,
  showKeyPreview: PropTypes.bool,
  startChangingAxis: PropTypes.func,
  stopChangingAxis: PropTypes.func,
  squeeze: PropTypes.number,
  inline: PropTypes.bool,
  tiny: PropTypes.bool,
  detent: PropTypes.bool,
  mute: PropTypes.bool,
  linearKnobs: PropTypes.bool,
  theme: PropTypes.string,
  rangeMode: PropTypes.bool,
  logarithmic: PropTypes.bool,
  updateOnce: PropTypes.bool,
}
