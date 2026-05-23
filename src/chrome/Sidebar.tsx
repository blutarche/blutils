/**
 * Sidebar — the catalog's left rail and one of the two Chrome
 * surfaces. Phase 1 ships the empty-list shape: brand row,
 * filter input, "tools" section label with count zero, an empty
 * state, and the footer.
 *
 * Tool registry, filter behaviour, categorised groups, pinned
 * section, and ⌘-shortcut routing land in later phases. Every
 * surface here uses --chrome-* tokens so the Sidebar reads as
 * system Chrome whether the workspace is dark or light.
 */

import { Icon } from '../icons/Icon'
import { BrandMark } from './BrandMark'
import { GithubMark } from './GithubMark'

const VERSION = `v${__APP_VERSION__}`

export function Sidebar() {
  return (
    <aside class="side" aria-label="Tool catalog">
      <div class="side-brand">
        <BrandMark />
        <span class="name">blutils</span>
      </div>

      <div class="side-search">
        <span class="ico">
          <Icon name="Search" size={12} />
        </span>
        <input
          type="text"
          placeholder="filter"
          aria-label="Filter tools"
          spellcheck={false}
        />
        <span class="kbd-hint">/</span>
      </div>

      <div class="side-section">
        <span>tools</span>
        <span class="count">0</span>
      </div>

      <div class="side-list">
        <p class="side-empty">
          no tools registered yet — manifests arrive in phase 2.
        </p>
      </div>

      <div class="side-foot">
        <a
          class="side-foot-gh"
          href="https://github.com/blutarche/blutils"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Source on GitHub"
        >
          <GithubMark size={12} />
        </a>
        <span>mit</span>
        <span class="side-foot-sep" />
        <span>{VERSION}</span>
      </div>
    </aside>
  )
}
