import { hydrate, render } from 'preact'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/reset.css'
import './styles/app.css'
import './styles/chrome.css'
import './styles/workspace.css'
import './styles/palette.css'
import './styles/tools.css'
import './styles/syntax.css'
import './styles/tabs.css'
import './styles/chain.css'
import './styles/tweaks.css'
import './styles/help.css'
import './styles/craft.css'
import './styles/responsive.css'
import { App } from './app/App'

// Production: prerender.mjs inlines the rendered App tree into
// #root, so the client hydrates against existing markup.
// Dev: #root is empty (no prerender step), so render fresh.
// Pathname is read from window.location by the client
// RouterProvider in both cases.
const root = document.getElementById('root')
if (root) {
  if (root.firstElementChild) {
    hydrate(<App />, root)
  } else {
    render(<App />, root)
  }
}
