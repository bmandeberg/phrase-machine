import React from 'react'
import PropTypes from 'prop-types'
import logo from '../assets/logo.svg'
import './Header.scss'

export default function Header() {
  return <div id="header">
    <img src={logo} alt="" id="logo" />
  </div>
}
