import React from 'react'
import PropTypes from 'prop-types'
import { v4 as uuid } from 'uuid'
import classNames from 'classnames'
import './Ticks.scss'

export default function Ticks({ longestLane, beatsPerBar, beatValue, showNumbers, click }) {
  return (
    <div className="ticks" onClick={click}>
      {[...Array(longestLane)].map((_d, i) => {
        const eighthsPerMeasure = beatsPerBar * (beatValue === 4 ? 2 : 1)
        const major = i % eighthsPerMeasure === 0
        return (
          <div
            key={uuid()}
            className={classNames('tick', {
              minor: beatValue === 4 && i % 2 === 0,
              major,
            })}>
            {showNumbers && major && <div className="tick-measure-num">{Math.floor(i / eighthsPerMeasure) + 1}</div>}
          </div>
        )
      })}
    </div>
  )
}
Ticks.propTypes = {
  longestLane: PropTypes.number,
  beatsPerBar: PropTypes.number,
  beatValue: PropTypes.number,
  showNumbers: PropTypes.bool,
  click: PropTypes.func,
}
