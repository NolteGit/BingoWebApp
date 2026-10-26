import { render } from 'preact'
import { App } from './App'
import { LanguageProvider } from './i18n'
import './styles.css'

const root = document.getElementById('app')

if (!root) {
  throw new Error('Application root #app is missing.')
}

render(<LanguageProvider><App /></LanguageProvider>, root)
