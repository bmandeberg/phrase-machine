import React, { useState, useEffect, useRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { useHover } from 'react-use-gesture'
import { timeToPixels } from '../util'
import delimiterGraphic from '../assets/delimiter.svg'
import xIcon from '../assets/x-icon-purple.svg'
import './Delimiter.scss'
import { KEYS_WIDTH } from '../globals'

export default function Delimiter({ delimiter, i, deleteDelimiter, dragging, wasDragging, dragHover, scrollLeft }) {
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
    () =>
      (delimiter.snap ? timeToPixels({ [delimiter.snap]: delimiter.snapNumber }) : delimiter.x) +
      34 +
      KEYS_WIDTH -
      scrollLeft,
    [delimiter.snap, delimiter.snapNumber, delimiter.x, scrollLeft]
  )

  return (
    <div className={classNames('delimiter', { active })} index={i} {...hover()} style={{ left }}>
      <img className="delimiter-head" src={delimiterGraphic} alt="" draggable="false" />
      <div className="delimiter-grab"></div>
      <img className="delimiter-x" src={xIcon} alt="" draggable="false" onClick={() => deleteDelimiter(i)} />
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
  scrollLeft: PropTypes.number,
}
