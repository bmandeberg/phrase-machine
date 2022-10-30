import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import NumInput from './NumInput'
import { v4 as uuid } from 'uuid'
import './Dropdown.scss'

const DROPDOWN_HEIGHT = 28

function longestText(options, graphicOptions) {
  if (graphicOptions) {
    return '-----'
  }
  if (options.length) {
    let longestOption = ''
    for (let i = 0; i < options.length; i++) {
      const option = typeof options[i] === 'object' ? (options[i].label + '').trim() : (options[i] + '').trim()
      if (option.length > longestOption.length) {
        longestOption = option
      }
    }
    return longestOption
  }
  return null
}

export default function Dropdown({
  label,
  className,
  options,
  setValue,
  value,
  placeholder,
  noOptions,
  small,
  noTextTransform,
  capitalize,
  inline,
  num1,
  setNum1,
  num2,
  setNum2,
  showNumInputs,
  container,
  minWidth,
  noMinWidth,
}) {
  const [open, setOpen] = useState(false)
  const [menuAbove, setMenuAbove] = useState(false)
  const [dropdownWidth, setDropdownWidth] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const dropdownRef = useRef()
  const menuRef = useRef()
  const containerRef = useRef(container)

  const graphicOptions = useMemo(
    () => options.length && typeof options[0] === 'object' && React.isValidElement(options[0].label),
    [options]
  )

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    function handleScroll() {
      setScrollTop(document.querySelector(containerRef.current).scrollTop)
    }
    document.addEventListener('mousedown', handleClickOutside)
    const containerVar = containerRef.current
    const scrollContainer = document.querySelector(containerRef.current)
    if (containerVar) {
      scrollContainer.addEventListener('scroll', handleScroll)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (containerVar) {
        scrollContainer.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  const optionHeight = useMemo(() => (small ? 20 : 27), [small])

  const menuHeight = useMemo(() => Math.min(options.length * optionHeight, 200), [optionHeight, options])

  const toggleOpen = useCallback(() => {
    if (!open && dropdownRef.current) {
      setDropdownWidth(dropdownRef.current.clientWidth)
    }
    const dropdownDimensions = dropdownRef.current.getBoundingClientRect()
    setMenuAbove(
      dropdownDimensions.top + DROPDOWN_HEIGHT + menuHeight > window.innerHeight &&
        dropdownDimensions.top - DROPDOWN_HEIGHT > window.innerHeight - dropdownDimensions.top + DROPDOWN_HEIGHT
    )
    setOpen((open) => !open)
  }, [menuHeight, open])

  const selectedIndex = useMemo(
    () => options.findIndex((option) => (typeof option === 'object' ? option.value === value : option === value)),
    [options, value]
  )

  const displayValue = useMemo(
    () =>
      selectedIndex !== -1 && typeof options[selectedIndex] === 'object'
        ? options[selectedIndex].label
        : options[selectedIndex],
    [options, selectedIndex]
  )

  useEffect(() => {
    if (open) {
      if (selectedIndex !== -1) {
        menuRef.current.scroll({ top: selectedIndex * optionHeight })
      }
    }
  }, [open, optionHeight, selectedIndex])

  const optionEls = useMemo(
    () =>
      options.length ? (
        options.map((option) => {
          const optionValue = typeof option === 'object' ? option.value : option
          const optionLabel = typeof option === 'object' ? option.label : option
          return (
            <div
              key={uuid()}
              onClick={() => {
                setValue(optionValue === '(None)' ? null : optionValue)
                setOpen(false)
              }}
              className={classNames('dropdown-option', { selected: optionValue === value })}>
              {optionLabel}
            </div>
          )
        })
      ) : (
        <div className="no-options">{noOptions || 'No options found'}</div>
      ),
    [noOptions, options, setValue, value]
  )

  const menuWrapperStyle = useMemo(() => {
    const top = menuAbove ? menuHeight * -1 + 2 + 'px' : '100%'
    return container ? { top: `calc(${top} - ${scrollTop}px)` } : { top }
  }, [container, menuAbove, menuHeight, scrollTop])
  const menuStyle = useMemo(() => (container ? { width: dropdownWidth } : null), [container, dropdownWidth])

  const dropdownLabel = useMemo(() => (label ? <p className="dropdown-label no-select">{label}</p> : null), [label])
  const numInputs = useMemo(
    () => (
      <div className="dropdown-num-inputs-wrapper">
        <div className="dropdown-num-inputs">
          <NumInput value={num1} setValue={setNum1} min={-12} max={12} />
          <NumInput value={num2} setValue={setNum2} min={-12} max={12} />
        </div>
      </div>
    ),
    [num1, num2, setNum1, setNum2]
  )

  return (
    <div
      ref={dropdownRef}
      className={classNames('dropdown-container', className, {
        'small-dropdown': small,
        'no-text-transform': noTextTransform,
        capitalize,
        'inline-dropdown': inline,
        'dropdown-num-inputs-container': setNum1,
        'show-dropdown-num-inputs': showNumInputs,
        'graphic-options': graphicOptions,
      })}
      style={minWidth ? { minWidth } : null}>
      <div className="dropdown">
        <div className={classNames('dropdown-root', { open })}>
          <div onClick={toggleOpen} className="dropdown-control">
            <div className={classNames('dropdown-placeholder', { selected: value })}>{displayValue || placeholder}</div>
            <div className="dropdown-arrow-wrapper">
              <span className="dropdown-arrow"></span>
            </div>
          </div>
          <div
            className={classNames('dropdown-menu-wrapper', { open, 'menu-above': menuAbove })}
            style={menuWrapperStyle}>
            <div ref={menuRef} className={classNames('dropdown-menu', { 'fixed-menu': container })} style={menuStyle}>
              {optionEls}
            </div>
          </div>
        </div>
        {!noMinWidth && <div className="dropdown-min-width">{longestText(options, graphicOptions)}</div>}
      </div>
      {label && dropdownLabel}
      {setNum1 && numInputs}
    </div>
  )
}
Dropdown.propTypes = {
  label: PropTypes.string,
  className: PropTypes.string,
  options: PropTypes.array,
  setValue: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  placeholder: PropTypes.string,
  noOptions: PropTypes.string,
  small: PropTypes.bool,
  noTextTransform: PropTypes.bool,
  capitalize: PropTypes.bool,
  inline: PropTypes.bool,
  num1: PropTypes.number,
  setNum1: PropTypes.func,
  num2: PropTypes.number,
  setNum2: PropTypes.func,
  showNumInputs: PropTypes.bool,
  container: PropTypes.string,
  minWidth: PropTypes.number,
  noMinWidth: PropTypes.bool,
}
