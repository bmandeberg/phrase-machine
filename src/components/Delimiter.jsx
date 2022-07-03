import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { useHover } from 'react-use-gesture'
import { timeToPixels } from '../util'
import delimiterGraphic from '../assets/delimiter.svg'
import xIcon from '../assets/x-icon-purple.svg'
import './Delimiter.scss'

export default function Delimiter({ delimiter, i, deleteDelimiter, dragging, wasDragging }) {
  const [active, setActive] = useState(dragging || wasDragging.current === i)

  useEffect(() => {
    if (dragging === null && wasDragging.current === i) {
      setActive(false)
      wasDragging.current = null
    }
  }, [dragging, i, wasDragging])

  const hover = useHover((e) => {
    setActive(e.hovering || dragging)
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
}
