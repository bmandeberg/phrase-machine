import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { useGesture } from 'react-use-gesture'
import { constrain } from '../../util'
import './Slider.scss'

const SLIDER_HEIGHT = 60

export default function Slider({ value, setValue, setNsResizing }) {
  const dragStart = useRef()
  const dragSlider = useGesture({
    onDragStart: () => {
      dragStart.current = value
      setNsResizing(true)
    },
    onDrag: ({ movement: [mx, my], event }) => {
      event.stopPropagation()
      setValue(constrain(dragStart.current - my / SLIDER_HEIGHT, 0, 1))
    },
    onDragEnd: () => {
      setNsResizing(false)
    },
  })

  return (
    <div className="slider" style={{ '--slider-height': SLIDER_HEIGHT + 'px' }}>
      <div className="slider-bar" style={{ height: value * 100 + '%' }}>
        <div className={classNames('slider-number', { 'number-below': SLIDER_HEIGHT - value * SLIDER_HEIGHT <= 16 })}>
          {value.toFixed(2)}
        </div>
        <div className="slider-drag" {...dragSlider()}></div>
      </div>
    </div>
  )
}
Slider.propTypes = {
  value: PropTypes.number,
  setValue: PropTypes.func,
  setNsResizing: PropTypes.func,
}
