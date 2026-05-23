/// <reference types="vite/client" />

/**
 * Compile-time globals injected by Vite's `define`.
 *
 * Keep this list narrow — `define` is a public surface every part
 * of the codebase can read, so each entry needs a justified use
 * case.
 */

/** Application version, sourced from package.json at build time. */
declare const __APP_VERSION__: string
