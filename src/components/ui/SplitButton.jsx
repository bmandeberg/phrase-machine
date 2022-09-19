import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import './SplitButton.scss'

function notImplemented() {
  alert('Not implemented yet 😉')
}

export default function SplitButton(props) {
  const splitButtonLabel = useMemo(() => <p className="split-button-label no-select">{props.label}</p>, [props.label])

  return (
    <div className={classNames('split-button-container', props.className, { 'small-split-button': props.small })}>
      {props.small ? (
        <div className="split-button">
          <div
            className="split-button-action split-button-arrow split-button-arrow-up"
            onClick={props.leftAction || notImplemented}></div>
          <div className="split-button-content" onClick={props.contentAction || notImplemented}>
            {props.content || 'Edit'}
          </div>
          <div
            className="split-button-action split-button-arrow split-button-arrow-down"
            onClick={props.rightAction || notImplemented}></div>
        </div>
      ) : (
        <div className="split-button">
          <div className="split-button-content" onClick={props.contentAction || notImplemented}>
            {props.content || 'Edit'}
          </div>
          <div className="split-button-actions">
            <div
              className="split-button-action split-button-arrow split-button-arrow-up"
              onClick={props.leftAction || notImplemented}></div>
            <div
              className="split-button-action split-button-arrow split-button-arrow-down"
              onClick={props.rightAction || notImplemented}></div>
          </div>
        </div>
      )}
      {props.label && splitButtonLabel}
    </div>
  )
}
SplitButton.propTypes = {
  className: PropTypes.string,
  content: PropTypes.node,
  label: PropTypes.string,
  leftAction: PropTypes.func,
  rightAction: PropTypes.func,
  contentAction: PropTypes.func,
  small: PropTypes.bool,
}
