import React, { useState, useEffect, useMemo, useRef } from 'react'
import PropTypes from 'prop-types'
import { useGesture } from 'react-use-gesture'
import parse from 'html-react-parser'
import { constrain } from '../../util'

export default function LinearKnob({
  className,
  min,
  max,
  value,
  onChange,
  skin,
  style,
  onStart,
  onEnd,
  clampMax,
  rotateDegrees,
}) {
  const [svg, setSVG] = useState()

  useEffect(() => {
    const container = document.createElement('div')
    container.innerHTML = skin.svg
    setSVG(container)
  }, [skin])

  const valueRef = useRef()
  const drag = useGesture({
    onDrag: ({ movement: [dx, dy] }) => {
      const range = max - min
      const dragScalar = 150
      const xOffset = ((dx / dragScalar) * range) / 2
      const yOffset = ((-dy / dragScalar) * range) / 2
      let newValue = valueRef.current + xOffset + yOffset
      if (clampMax === 360) {
        newValue %= max
        if (newValue < 0) {
          newValue = max + newValue
        }
      } else {
        newValue = constrain(newValue, min, max)
      }
      onChange(newValue)
    },
    onDragStart: () => {
      valueRef.current = value
      onStart()
    },
    onDragEnd: onEnd,
  })

  const knobStyle = useMemo(() => {
    return Object.assign({ width: 50, height: 50, position: 'relative', overflow: 'hidden' }, style)
  }, [style])

  const knobHTML = useMemo(() => {
    if (svg) {
      const rotation = rotateDegrees + ((value - min) / (max - min)) * clampMax
      svg.querySelector('#knob').setAttribute('transform', `rotate(${rotation}, ${skin.knobX}, ${skin.knobY})`)
      return parse(svg.innerHTML)
    }
    return null
  }, [svg, rotateDegrees, value, min, max, clampMax, skin])

  return (
    <div className={className} style={knobStyle} draggable="false" {...drag()}>
      {knobHTML}
    </div>
  )
}
LinearKnob.propTypes = {
  className: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  value: PropTypes.number,
  onChange: PropTypes.func,
  skin: PropTypes.object,
  style: PropTypes.object,
  onStart: PropTypes.func,
  onEnd: PropTypes.func,
  clampMax: PropTypes.number,
  rotateDegrees: PropTypes.number,
}
