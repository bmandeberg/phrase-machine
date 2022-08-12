import React, { useState, useEffect, useRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { useHover } from 'react-use-gesture'
import { timeToPixels } from '../util'
import delimiterGraphic from '../assets/delimiter.svg'
import xIcon from '../assets/x-icon-purple.svg'
import './Delimiter.scss'

export default function Delimiter({ delimiter, i, deleteDelimiter, dragging, wasDragging, dragHover, height }) {
  const [active, setActive] = useState(dragging || wasDragging.current === i)
  const [hovering, setHovering] = useState(dragHover.current === i)
  const hoveringRef = useRef(hovering)

  useEffect(() => {
    if (hoveringRef.current !== hovering) {
      if (hoveringRef.current) {
        dragHover.current = null
      }
      hoveringRef.current = hovering
    }
  }, [dragHover, hovering])

  useEffect(() => {
    setActive(hovering || dragging || dragHover.current === i)
  }, [dragHover, dragging, hovering, i])

  useEffect(() => {
    if (!dragging && wasDragging.current === i) {
      if (dragHover.current === i) {
        dragHover.current = null
      } else {
        setActive(false)
      }
      wasDragging.current = null
    }
  }, [dragHover, dragging, i, wasDragging])

  const hover = useHover((e) => {
    setHovering(e.hovering)
  })

  const left = useMemo(
    () => (delimiter.snap ? timeToPixels({ [delimiter.snap]: delimiter.snapNumber }) : delimiter.x),
    [delimiter.snap, delimiter.snapNumber, delimiter.x]
  )

  return (
    <div
      className={classNames('delimiter', { active })}
      index={i}
      {...hover()}
      style={{ left, '--delimiter-height': height + 'px' }}>
      <img className="delimiter-head" src={delimiterGraphic} alt="" draggable="false" />
      <div className="delimiter-grab"></div>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="humbleicons hi-times delimiter-x">
        <g xmlns="http://www.w3.org/2000/svg" strokeLinecap="round" strokeWidth="2">
          <path d="M6 18L18 6M18 18L6 6" />
        </g>
      </svg>
    </div>
  )
}
Delimiter.propTypes = {
  delimiter: PropTypes.object,
  i: PropTypes.number,
  deleteDelimiter: PropTypes.func,
  dragging: PropTypes.bool,
  wasDragging: PropTypes.object,
  dragHover: PropTypes.object,
  height: PropTypes.number,
}
