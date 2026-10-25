import { render } from 'preact'
import { App } from './App'
import './styles.css'

const root = document.getElementById('app')

if (!root) {
  throw new Error('Anwendung konnte nicht gestartet werden: #app fehlt.')
}

render(<App />, root)
