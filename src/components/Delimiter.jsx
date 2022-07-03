import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { useHover } from 'react-use-gesture'
import { timeToPixels } from '../util'
import delimiterGraphic from '../assets/delimiter.svg'
import xIcon from '../assets/x-icon-purple.svg'
import './Delimiter.scss'

export default function Delimiter({ delimiter, i, deleteDelimiter, dragging, wasDragging, dragHover }) {
  const [active, setActive] = useState(dragging || wasDragging.current === i)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    if (dragging === null && wasDragging.current === i) {
      console.log(dragHover.current)
      if (dragHover.current) {
        dragHover.current = false
      } else {
        setActive(false)
      }
      wasDragging.current = null
    }
  }, [dragHover, dragging, i, wasDragging])

  useEffect(() => {
    setActive(hovering || dragging)
  }, [dragging, hovering])

  const hover = useHover((e) => {
    setHovering(e.hovering)
  })
  useEffect(() => {
    setActive(dragging)
  }, [dragging])

  return (
    <div
      className={classNames('delimiter', { active })}
      index={i}
      {...hover()}
      style={{
        left: delimiter.snap ? timeToPixels({ [delimiter.snap]: delimiter.snapNumber }) : delimiter.x,
      }}>
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
}
