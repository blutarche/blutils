import { render } from 'preact'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/reset.css'
import './styles/chrome.css'
import './styles/workspace.css'
import { App } from './app/App'

const root = document.getElementById('root')
if (root) {
  render(<App />, root)
}
