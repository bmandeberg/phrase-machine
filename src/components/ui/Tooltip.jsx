import React, { useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import './Tooltip.scss'

export default function Tooltip({ x, y, setTooltip, children }) {
  const cancelTooltip = useCallback(() => {
    setTooltip(null)
  }, [setTooltip])

  useEffect(() => {
    function clickAnywhereElse(e) {
      if (!e.target.closest('.tooltip')) {
        cancelTooltip()
      }
    }
    function keydown(e) {
      if (e.key === 'Escape') {
        cancelTooltip()
      }
    }
    document.addEventListener('click', clickAnywhereElse)
    window.addEventListener('keydown', keydown)
    return () => {
      document.removeEventListener('click', clickAnywhereElse)
      window.removeEventListener('keydown', keydown)
    }
  }, [cancelTooltip])

  return (
    <div className="tooltip" style={{ left: x, top: y }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        className="humbleicons hi-times"
        onClick={cancelTooltip}>
        <g xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
          <path d="M6 18L18 6M18 18L6 6" />
        </g>
      </svg>
      {children}
    </div>
  )
}
Tooltip.propTypes = {
  x: PropTypes.number,
  y: PropTypes.number,
  setTooltip: PropTypes.func,
}
