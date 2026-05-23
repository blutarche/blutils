/**
 * The "b." brand mark — a 24×24 box rendered via styled DOM,
 * not an SVG: the glyph wants JetBrains Mono with the same
 * letter-spacing as the rest of the chrome, and a CSS box lets
 * it inherit colour and density tokens cleanly.
 *
 * Stays in src/chrome/ because it lives inside the Sidebar's
 * brand row and shares chrome tokens.
 */
export function BrandMark() {
  return <span class="brand-mark">b.</span>
}
