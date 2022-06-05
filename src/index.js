import './index.scss'

if (process.env.NODE_ENV === 'development') {
  require('../dist/index.html')
}

console.log('Hello Project.')
