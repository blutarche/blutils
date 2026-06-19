import { defineConfig } from 'vitest/config'

/**
 * Vitest config — algorithm tests only.
 *
 * Tools keep their pure logic in a dependency-free `engine.ts`
 * (or similar) and test it in `Tool.test.ts`, with no DOM. The
 * `node` environment is enough; we deliberately don't pull in the
 * preact plugin or jsdom so the test runner stays fast and the
 * tests stay honest about being algorithm-level.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
