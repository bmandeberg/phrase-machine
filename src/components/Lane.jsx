import React, { useState, useMemo, useRef } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import './Lane.scss'

export default function Lane({ id, color, laneNum, lanePreset, setLaneState }) {
  const [measures, setMeasures] = useState(lanePreset.measures)
  const [minNote, setMinNote] = useState(lanePreset.viewRange.min)
  const [maxNote, setMaxNote] = useState(lanePreset.viewRange.max)

  console.log(minNote, maxNote)

  const measuresEls = useMemo(
    () =>
      measures.map((m) =>
        m ? (
          <div className="measure">
            {[...Array(maxNote - minNote + 1)].map((_d, i) => (
              <div
                className={classNames('note-lane', {
                  'black-key': isBlackKey(i),
                  'e-key': !isBlackKey(i) && nextKeyIsWhite(i),
                })}></div>
            ))}
          </div>
        ) : (
          <div className="empty-measure"></div>
        )
      ),
    [maxNote, measures, minNote]
  )

  return (
    <div className="lane" style={{ '--lane-color': color }}>
      <div className="keys">
        {[...Array(maxNote - minNote + 1)].map((_d, i) => (
          <div
            className={classNames('key', {
              'black-key': isBlackKey(i),
              'e-key': !isBlackKey(i) && nextKeyIsWhite(i),
            })}></div>
        ))}
      </div>
      {measuresEls}
    </div>
  )
}
Lane.propTypes = {
  color: PropTypes.string,
  laneNum: PropTypes.number,
  lanePreset: PropTypes.object,
  setLaneState: PropTypes.func,
}

const blackKeys = [false, true, false, true, false, false, true, false, true, false, true, false]
function isBlackKey(i) {
  return blackKeys[i]
}

function nextKeyIsWhite(i) {
  return !blackKeys[i + 1]
}
