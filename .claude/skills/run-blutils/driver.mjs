#!/usr/bin/env node
/**
 * blutils browser driver — dependency-free Chrome DevTools Protocol harness.
 *
 * blutils is a static, prerendered Preact SPA. There is no chromium-cli in
 * this environment, but a Chromium-family browser (Brave) is installed, and
 * Node 24 ships a global WebSocket — so this script speaks CDP directly with
 * zero npm dependencies. It launches the browser headless, drives a real user
 * flow (navigate, type, click, read the DOM after hydration), and screenshots.
 *
 * Pair it with the static preview server:
 *   node scripts/preview-static.mjs        # serves dist/ on :4173
 *   node .claude/skills/run-blutils/driver.mjs http://localhost:4173/format/json \
 *        --type 'textarea={"b":2,"a":1}' --text '.cm-output, pre' --shot /tmp/x.png
 *
 * Actions run in the order given on the command line.
 *
 * Options:
 *   <url>                 (positional, required) URL to open
 *   --type <sel>=<text>   set value of the matched input/textarea + fire 'input'
 *   --click <sel>         click the first matching element
 *   --text <sel>          print textContent of the first match (repeatable)
 *   --eval <expr>         evaluate JS in the page, print JSON result (repeatable)
 *   --wait <sel>          wait until selector exists before continuing (repeatable)
 *   --settle <ms>         pause after load / between actions (default 700)
 *   --shot <path>         capture a PNG screenshot after all actions
 *   --size <WxH>          viewport, default 1280x800
 *   --port <n>            CDP port (default: ephemeral, picked from the OS)
 *   --brave <path>        browser binary (default: Brave on macOS, else $BLUTILS_BROWSER)
 *   --keep                leave the browser running (for manual poking)
 *
 * Exit code is non-zero if navigation fails or a --wait selector never appears.
 */

import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'

const DEFAULT_BRAVE =
  process.env.BLUTILS_BROWSER ||
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'

// ---- arg parsing: preserve action order ----------------------------------
const argv = process.argv.slice(2)
const actions = []
let url = null
const opts = { settle: 700, size: '1280x800', brave: DEFAULT_BRAVE, keep: false, port: 0 }

for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  switch (a) {
    case '--type': actions.push({ kind: 'type', arg: argv[++i] }); break
    case '--click': actions.push({ kind: 'click', arg: argv[++i] }); break
    case '--text': actions.push({ kind: 'text', arg: argv[++i] }); break
    case '--eval': actions.push({ kind: 'eval', arg: argv[++i] }); break
    case '--wait': actions.push({ kind: 'wait', arg: argv[++i] }); break
    case '--shot': opts.shot = argv[++i]; break
    case '--settle': opts.settle = Number(argv[++i]); break
    case '--size': opts.size = argv[++i]; break
    case '--port': opts.port = Number(argv[++i]); break
    case '--brave': opts.brave = argv[++i]; break
    case '--keep': opts.keep = true; break
    default:
      if (a.startsWith('--')) { console.error(`unknown flag: ${a}`); process.exit(2) }
      url = a
  }
}
if (!url) { console.error('error: a URL is required'); process.exit(2) }
const [vw, vh] = opts.size.split('x').map(Number)

// ---- tiny CDP client over WebSocket --------------------------------------
function pickPort(preferred) {
  if (preferred) return Promise.resolve(preferred)
  return new Promise((res) => {
    const s = createServer()
    s.listen(0, () => { const p = s.address().port; s.close(() => res(p)) })
  })
}

async function fetchJson(url, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url)
      if (r.ok) return await r.json()
    } catch { /* not up yet */ }
    await sleep(100)
  }
  throw new Error(`timed out waiting for ${url}`)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

class CDP {
  constructor(wsUrl) { this.ws = new WebSocket(wsUrl); this.id = 0; this.pending = new Map() }
  open() {
    return new Promise((res, rej) => {
      this.ws.addEventListener('open', () => res())
      this.ws.addEventListener('error', (e) => rej(new Error('ws error: ' + (e.message || e.type))))
      this.ws.addEventListener('message', (ev) => {
        const msg = JSON.parse(ev.data)
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id)
          this.pending.delete(msg.id)
          msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
        }
      })
    })
  }
  send(method, params = {}) {
    const id = ++this.id
    this.ws.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }))
  }
  async evaluate(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
    })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval threw')
    return r.result.value
  }
  close() { try { this.ws.close() } catch {} }
}

// in-page helper expressions
const setValue = (sel, text) => `(() => {
  const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) return { ok: false, reason: 'not found' };
  const proto = el.tagName === 'TEXTAREA'
    ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(el, ${JSON.stringify(text)});
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return { ok: true };
})()`

const waitFor = (sel, ms = 5000) => `(async () => {
  const start = Date.now();
  while (Date.now() - start < ${ms}) {
    if (document.querySelector(${JSON.stringify(sel)})) return true;
    await new Promise(r => setTimeout(r, 50));
  }
  return false;
})()`

// ---- main ----------------------------------------------------------------
let proc, profileDir
async function main() {
  const port = await pickPort(opts.port)
  profileDir = mkdtempSync(join(tmpdir(), 'blutils-brave-'))
  proc = spawn(opts.brave, [
    '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    `--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`,
    `--window-size=${vw},${vh}`, 'about:blank',
  ], { stdio: 'ignore' })

  await fetchJson(`http://localhost:${port}/json/version`)
  const targets = await fetchJson(`http://localhost:${port}/json`)
  const page = targets.find((t) => t.type === 'page')
  if (!page) throw new Error('no page target')

  const cdp = new CDP(page.webSocketDebuggerUrl)
  await cdp.open()
  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')

  const loaded = new Promise((res) => {
    const h = (ev) => {
      const m = JSON.parse(ev.data)
      if (m.method === 'Page.loadEventFired') { cdp.ws.removeEventListener('message', h); res() }
    }
    cdp.ws.addEventListener('message', h)
  })
  await cdp.send('Page.navigate', { url })
  await Promise.race([loaded, sleep(15000)])
  await sleep(opts.settle) // let Preact hydrate

  for (const act of actions) {
    if (act.kind === 'wait') {
      const ok = await cdp.evaluate(waitFor(act.arg))
      if (!ok) throw new Error(`wait failed: selector "${act.arg}" never appeared`)
    } else if (act.kind === 'type') {
      const eq = act.arg.indexOf('=')
      const sel = act.arg.slice(0, eq), text = act.arg.slice(eq + 1)
      const r = await cdp.evaluate(setValue(sel, text))
      if (!r.ok) throw new Error(`type failed on "${sel}": ${r.reason}`)
      await sleep(opts.settle)
    } else if (act.kind === 'click') {
      const r = await cdp.evaluate(
        `(() => { const el = document.querySelector(${JSON.stringify(act.arg)});
          if (!el) return false; el.click(); return true; })()`)
      if (!r) throw new Error(`click failed: "${act.arg}" not found`)
      await sleep(opts.settle)
    } else if (act.kind === 'text') {
      const t = await cdp.evaluate(
        `(document.querySelector(${JSON.stringify(act.arg)})||{}).textContent ?? null`)
      console.log(`text[${act.arg}]: ${JSON.stringify(t)}`)
    } else if (act.kind === 'eval') {
      const v = await cdp.evaluate(act.arg)
      console.log(`eval: ${JSON.stringify(v)}`)
    }
  }

  if (opts.shot) {
    const r = await cdp.send('Page.captureScreenshot', { format: 'png' })
    const { writeFileSync } = await import('node:fs')
    writeFileSync(opts.shot, Buffer.from(r.data, 'base64'))
    console.log(`shot: ${opts.shot}`)
  }

  cdp.close()
  if (opts.keep) { console.log(`browser left running on CDP port ${port}`); return }
}

function cleanup() {
  if (!opts.keep && proc) { try { proc.kill() } catch {} }
  if (!opts.keep && profileDir) { try { rmSync(profileDir, { recursive: true, force: true }) } catch {} }
}

main()
  .then(cleanup)
  .catch((e) => { console.error('DRIVER ERROR:', e.message); cleanup(); process.exit(1) })
