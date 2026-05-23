// blutils-palette.jsx — Command Palette (⌘K)
const { useState, useEffect, useMemo, useRef } = React;
const { Icon } = window.BlutilsTools;

// Smart detection: peek at clipboard / pasted text and suggest a tool.
function detectKind(s) {
  if (!s || s.length < 3) return null;
  const t = s.trim();
  // JSON
  if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
    try { JSON.parse(t); return { tool: 'json', label: 'JSON object detected' }; } catch {}
  }
  // JWT
  if (/^eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+$/.test(t)) return { tool: 'hash', label: 'JWT-shaped token' };
  // SHA-256 hex
  if (/^[a-f0-9]{64}$/i.test(t)) return { tool: 'hash', label: 'SHA-256 hex' };
  if (/^[a-f0-9]{40}$/i.test(t)) return { tool: 'hash', label: 'SHA-1 hex' };
  if (/^[a-f0-9]{32}$/i.test(t)) return { tool: 'hash', label: 'MD5 hex' };
  // Unix time
  if (/^1[6-9]\d{8}$/.test(t)) return { tool: 'unix', label: 'unix timestamp (sec)' };
  if (/^1[6-9]\d{11}$/.test(t)) return { tool: 'unix', label: 'unix timestamp (ms)' };
  // URL → QR
  if (/^https?:\/\/\S+$/i.test(t)) return { tool: 'qr', label: 'URL — encode as QR?' };
  // Cron expression
  if (/^[\d*/,\-]+(\s+[\d*/,\-]+){4}$/.test(t)) return { tool: 'cron', label: 'cron expression' };
  // Diff (two blocks separated by ---)
  if (t.includes('\n---\n')) return { tool: 'diff', label: 'two-block diff' };
  // Markdown
  if (/^#{1,6}\s/m.test(t) || /^[*-]\s/m.test(t)) return { tool: 'md', label: 'looks like markdown' };
  return null;
}

// Simple fuzzy: substring-then-letter-order, returns ranges of matching chars.
function fuzzyMatch(query, target) {
  if (!query) return { score: 0, ranges: [] };
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  // exact substring → high score, contiguous range
  const idx = t.indexOf(q);
  if (idx !== -1) return { score: 1000 - idx, ranges: [[idx, idx + q.length]] };
  // letter-order
  const ranges = []; let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      if (ranges.length && ranges[ranges.length - 1][1] === i) ranges[ranges.length - 1][1] = i + 1;
      else ranges.push([i, i + 1]);
      qi++;
    }
  }
  if (qi < q.length) return null;
  return { score: 500 - ranges.length * 10, ranges };
}

function HiText({ text, ranges }) {
  if (!ranges || !ranges.length) return text;
  const out = []; let cur = 0;
  ranges.forEach(([a, b], i) => {
    if (a > cur) out.push(<span key={`p${i}`}>{text.slice(cur, a)}</span>);
    out.push(<mark key={`m${i}`}>{text.slice(a, b)}</mark>);
    cur = b;
  });
  if (cur < text.length) out.push(<span key="t">{text.slice(cur)}</span>);
  return out;
}

const COMMANDS = [
  { kind: 'action', id: 'home', name: 'Go home', desc: 'recent + quick start' },
  { kind: 'action', id: 'toggle-tabs', name: 'Toggle multi-tab mode', desc: 'open several tools at once' },
  { kind: 'action', id: 'toggle-pipe', name: 'Open pipe chain', desc: 'chain tools together' },
  { kind: 'action', id: 'toggle-theme', name: 'Toggle theme', desc: 'light / dark' },
  { kind: 'action', id: 'copy-perma', name: 'Copy permalink to current tool' },
];

function Palette({ tools, onClose, onPickTool, onAction, paste }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const ref = useRef(null);

  useEffect(() => { ref.current && ref.current.focus(); }, []);

  const detected = useMemo(() => detectKind(paste || ""), [paste]);

  const results = useMemo(() => {
    const items = [];
    // Tool matches
    for (const t of tools) {
      const m = q
        ? (fuzzyMatch(q, t.name) || fuzzyMatch(q, t.id) || (t.aliases || []).map(a => fuzzyMatch(q, a)).find(Boolean))
        : { score: 0, ranges: [] };
      if (!q || m) items.push({ kind: 'tool', tool: t, score: m?.score ?? 0, ranges: m?.ranges || [] });
    }
    // Command matches
    for (const c of COMMANDS) {
      const m = q ? fuzzyMatch(q, c.name) : null;
      if (q && m) items.push({ kind: 'cmd', cmd: c, score: m.score, ranges: m.ranges });
    }
    if (q) items.sort((a, b) => b.score - a.score);
    return items;
  }, [tools, q]);

  useEffect(() => { setSel(0); }, [q]);

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(results.length - 1, s + 1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
    else if (e.key === 'Escape')    { e.preventDefault(); onClose(); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const r = results[sel];
      if (!r) return;
      if (r.kind === 'tool') onPickTool(r.tool.id);
      else if (r.kind === 'cmd') onAction(r.cmd.id);
    }
  };

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="palette" onMouseDown={e => e.stopPropagation()}>
        <div className="palette-input-row">
          <span className="icon"><Icon name="search" size={14}/></span>
          <input ref={ref} placeholder="Search tools, paste anything, or run a command…"
                 value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}/>
          <span className="kbd">esc</span>
        </div>
        {!q && detected && (
          <div className="palette-detect">
            <Icon name="sparkle" size={12}/>
            <span><b>Detected:</b> {detected.label} —&nbsp;</span>
            <button className="btn sm accent" onClick={() => onPickTool(detected.tool, paste)} style={{ padding: '2px 9px' }}>
              open in {detected.tool}
            </button>
            <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5 }}>from clipboard</span>
          </div>
        )}
        <div className="palette-list">
          {results.length === 0 && <div className="empty" style={{ padding: 30, fontSize: 13 }}>no matches</div>}
          {results.some(r => r.kind === 'tool') && (
            <>
              <div className="pal-section">Tools</div>
              {results.filter(r => r.kind === 'tool').map((r, i) => {
                const globalIdx = results.indexOf(r);
                return (
                  <div key={r.tool.id}
                       className={`pal-item ${globalIdx === sel ? 'on' : ''}`}
                       onMouseEnter={() => setSel(globalIdx)}
                       onClick={() => onPickTool(r.tool.id)}>
                    <span className="ic"><Icon name={r.tool.icon || r.tool.id} size={14}/></span>
                    <span className="name"><HiText text={r.tool.name} ranges={r.ranges}/></span>
                    <span className="desc">{r.tool.desc}</span>
                    {r.tool.key && <span className="k kbd">{r.tool.key}</span>}
                  </div>
                );
              })}
            </>
          )}
          {results.some(r => r.kind === 'cmd') && (
            <>
              <div className="pal-section">Commands</div>
              {results.filter(r => r.kind === 'cmd').map((r, i) => {
                const globalIdx = results.indexOf(r);
                return (
                  <div key={r.cmd.id}
                       className={`pal-item ${globalIdx === sel ? 'on' : ''}`}
                       onMouseEnter={() => setSel(globalIdx)}
                       onClick={() => onAction(r.cmd.id)}>
                    <span className="ic"><Icon name="settings" size={14}/></span>
                    <span className="name"><HiText text={r.cmd.name} ranges={r.ranges}/></span>
                    <span className="desc">{r.cmd.desc}</span>
                  </div>
                );
              })}
            </>
          )}
        </div>
        <div className="palette-foot">
          <span className="seg"><span className="kbd">↑↓</span> navigate</span>
          <span className="seg"><span className="kbd">↩</span> open</span>
          <span className="seg"><span className="kbd">esc</span> close</span>
          <span className="spacer"/>
          <span>{results.length} result{results.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  );
}

window.BlutilsPalette = { Palette, detectKind };
