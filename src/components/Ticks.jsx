import React from 'react'
import PropTypes from 'prop-types'
import { v4 as uuid } from 'uuid'
import classNames from 'classnames'
import { RATE_TICKS, RATE_MULTS, EIGHTH_WIDTH, mapLaneLength } from '../globals'
import './Ticks.scss'

export default function Ticks({ longestLane, beatsPerBar, beatValue, grid, showNumbers, click }) {
  return (
    <div className="ticks" onClick={click}>
      <div className="ticks-container">
        {[...Array(mapLaneLength(longestLane, grid))].map((_d, i) => {
          return (
            <div
              key={uuid()}
              className={classNames('tick', { minor: beatValue === 4 && RATE_TICKS[grid](i) })}
              style={{ '--tick-width': RATE_MULTS[grid] * EIGHTH_WIDTH + 'px' }}></div>
          )
        })}
      </div>
      <div className="ticks-container">
        {[...Array(longestLane)].map((_d, i) => {
          const eighthsPerMeasure = beatsPerBar * (beatValue === 4 ? 2 : 1)
          const major = i % eighthsPerMeasure === 0
          return (
            <div
              key={uuid()}
              className={classNames('tick', { hidden: !major, major })}
              style={{ '--tick-width': EIGHTH_WIDTH + 'px' }}>
              {showNumbers && major && <div className="tick-measure-num">{Math.floor(i / eighthsPerMeasure) + 1}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
Ticks.propTypes = {
  longestLane: PropTypes.number,
  beatsPerBar: PropTypes.number,
  beatValue: PropTypes.number,
  showNumbers: PropTypes.bool,
  click: PropTypes.func,
  grid: PropTypes.string,
}
