import React, { useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { useGesture } from 'react-use-gesture'
import { constrain } from '../../util'
import './RangeSlider.scss'

const SLIDER_HEIGHT = 60

export default function RangeSlider({ value, setValue, setNsResizing, setGrabbing, grabbing }) {
  const dragStart = useRef()
  const dragSliderMax = useGesture({
    onDragStart: () => {
      dragStart.current = value.max
      setNsResizing(true)
    },
    onDrag: ({ movement: [mx, my], event }) => {
      event.stopPropagation()
      const max = constrain(dragStart.current - my / SLIDER_HEIGHT, 0.05, 1)
      setValue({
        min: Math.min(value.min, max - 0.05),
        max,
      })
    },
    onDragEnd: () => {
      setNsResizing(false)
    },
  })

  const dragSliderMin = useGesture({
    onDragStart: () => {
      dragStart.current = value.min
      setNsResizing(true)
    },
    onDrag: ({ movement: [mx, my], event }) => {
      event.stopPropagation()
      const min = constrain(dragStart.current - my / SLIDER_HEIGHT, 0, 0.95)
      setValue({
        min,
        max: Math.max(value.max, min + 0.05),
      })
    },
    onDragEnd: () => {
      setNsResizing(false)
    },
  })

  const dragSlider = useGesture({
    onDragStart: () => {
      dragStart.current = { min: value.min, max: value.max }
      setGrabbing(true)
    },
    onDrag: ({ movement: [mx, my], event }) => {
      event.stopPropagation()
      const dist = constrain(-my / SLIDER_HEIGHT, -dragStart.current.min, 1 - dragStart.current.max)
      setValue({
        min: dragStart.current.min + dist,
        max: dragStart.current.max + dist,
      })
    },
    onDragEnd: () => {
      setGrabbing(false)
    },
  })

  const numberPositions = useCallback(() => {
    let max = value.max
    let min = value.min
    if (value.max - value.min < 0.18) {
      max += (0.18 - (value.max - value.min)) / 2
      min -= (0.18 - (value.max - value.min)) / 2
    }
    return {
      min: `calc(${(1 - min) * 100}% - 5px)`,
      max: `calc(${(1 - max) * 100}% - 4px)`,
    }
  }, [value])

  return (
    <div className="slider" style={{ height: SLIDER_HEIGHT }}>
      <div className="slider-number" style={{ top: numberPositions().max }}>
        {value.max.toFixed(2)}
      </div>
      <div className="slider-number" style={{ top: numberPositions().min }}>
        {value.min.toFixed(2)}
      </div>
      <div
        className={classNames('slider-bar', { grabbing })}
        style={{ top: (1 - value.max) * 100 + '%', bottom: value.min * 100 + '%' }}
        {...dragSlider()}>
        <div className="slider-drag" style={{ top: -3 }} {...dragSliderMax()}></div>
        <div className="slider-drag" style={{ bottom: -3 }} {...dragSliderMin()}></div>
      </div>
    </div>
  )
}
RangeSlider.propTypes = {
  value: PropTypes.object,
  setValue: PropTypes.func,
  setNsResizing: PropTypes.func,
  setGrabbing: PropTypes.func,
  grabbing: PropTypes.bool,
}
