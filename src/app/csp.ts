/**
 * Content Security Policy — single source of truth.
 *
 * Read at build time by the Vite CSP plugin (vite.config.ts) and,
 * in Phase 12, by the Cloudflare Pages `public/_headers` generator
 * so the meta tag and the HTTP header agree.
 *
 * The Tauri desktop shell mirrors these directives header-level in
 * `src-tauri/tauri.conf.json` (`app.security.csp`) for defense-in-depth
 * on top of the injected meta tag. That copy is static JSON and must be
 * kept in sync with the directives below by hand.
 *
 * `connect-src 'none'` is the load-bearing directive: it makes the
 * locality principle (no user data leaves the browser) a browser-
 * enforced rule rather than a developer promise. The runtime
 * has no `fetch`, `XHR`, `WebSocket`, `EventSource`, or
 * `sendBeacon` consumers in production code; the directive
 * blocks any accidental addition.
 *
 * `style-src 'self' 'unsafe-inline'` allows inline critical CSS
 * in prerendered HTML (Phase 3). All other inline / eval surfaces
 * are off.
 */

export const CSP_DIRECTIVES: Record<string, readonly string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:'],
  'font-src': ["'self'"],
  'connect-src': ["'none'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'none'"],
}

export function buildCspHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
}
