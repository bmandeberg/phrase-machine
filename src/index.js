import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import './index.scss'

if (process.env.NODE_ENV === 'development') {
  require('../dist/index.html')
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)
