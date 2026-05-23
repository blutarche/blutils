// blutils-tools.jsx ─ all tool implementations
const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ─────────── Shared helpers ───────────
function copyText(s, toast) {
  try {
    navigator.clipboard.writeText(s);
    toast && toast("Copied to clipboard");
  } catch (e) { /* ignore */ }
}

function Icon({ name, size = 14 }) {
  // tiny set of stroke icons used across tools
  const s = size;
  const props = {
    width: s, height: s, viewBox: "0 0 16 16", fill: "none",
    stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round"
  };
  const paths = {
    'copy':    <><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11"/></>,
    'check':   <path d="M3.5 8.5 6.5 11.5 12.5 5"/>,
    'x':       <><path d="M4 4l8 8"/><path d="M12 4l-8 8"/></>,
    'play':    <path d="M5 3.5v9L13 8 5 3.5z"/>,
    'pause':   <><rect x="4.5" y="3.5" width="2.5" height="9"/><rect x="9" y="3.5" width="2.5" height="9"/></>,
    'plus':    <><path d="M8 3v10"/><path d="M3 8h10"/></>,
    'minus':   <path d="M3 8h10"/>,
    'arrow-right': <><path d="M3 8h10"/><path d="M10 4l4 4-4 4"/></>,
    'arrow-down':  <><path d="M8 3v10"/><path d="M4 10l4 4 4-4"/></>,
    'search':  <><circle cx="7" cy="7" r="4"/><path d="M10 10l3.5 3.5"/></>,
    'swap':    <><path d="M3 5h10l-3-3"/><path d="M13 11H3l3 3"/></>,
    'sparkle': <><path d="M8 2v3.5"/><path d="M8 10.5V14"/><path d="M2 8h3.5"/><path d="M10.5 8H14"/><path d="M4 4l2 2"/><path d="M10 10l2 2"/><path d="M12 4l-2 2"/><path d="M6 10l-2 2"/></>,
    'json':    <><path d="M5 3a2 2 0 0 0-2 2v2a1 1 0 0 1-1 1 1 1 0 0 1 1 1v2a2 2 0 0 0 2 2"/><path d="M11 3a2 2 0 0 1 2 2v2a1 1 0 0 0 1 1 1 1 0 0 0-1 1v2a2 2 0 0 1-2 2"/></>,
    'diff':    <><path d="M3 4h6"/><path d="M3 8h4"/><path d="M3 12h6"/><path d="M11 4v8"/><path d="M9 6l2-2 2 2"/></>,
    'hash':    <><path d="M3 6h10"/><path d="M3 10h10"/><path d="M6 3l-2 10"/><path d="M12 3l-2 10"/></>,
    'regex':   <><path d="M8 3v6"/><path d="M3.5 5l9 3"/><path d="M3.5 8l9-3"/><circle cx="4" cy="13" r="1"/></>,
    'clock':   <><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.5"/></>,
    'cron':    <><rect x="3" y="3" width="10" height="10" rx="1.5"/><path d="M3 6h10"/><path d="M6 9h4"/><path d="M6 11h2"/></>,
    'md':      <><rect x="2.5" y="4" width="11" height="8" rx="1"/><path d="M5 10V6l1.5 2L8 6v4"/><path d="M10.5 6.5v3.5"/><path d="M9.5 9l1 1 1-1"/></>,
    'qr':      <><rect x="2.5" y="2.5" width="4" height="4"/><rect x="9.5" y="2.5" width="4" height="4"/><rect x="2.5" y="9.5" width="4" height="4"/><rect x="9" y="9" width="1" height="1"/><rect x="11" y="9" width="1" height="1"/><rect x="13" y="9" width="0.5" height="1"/><rect x="9" y="11" width="1" height="1"/><rect x="11" y="11" width="1" height="1"/><rect x="13" y="11" width="0.5" height="1"/><rect x="9" y="13" width="1" height="0.5"/><rect x="11" y="13" width="1" height="0.5"/></>,
    'lorem':   <><path d="M3 4h10"/><path d="M3 7h7"/><path d="M3 10h10"/><path d="M3 13h5"/></>,
    'pipe':    <><circle cx="4" cy="4" r="1.5"/><circle cx="12" cy="4" r="1.5"/><circle cx="8" cy="12" r="1.5"/><path d="M4 5.5v2A2.5 2.5 0 0 0 6.5 10h3A2.5 2.5 0 0 0 12 7.5v-2"/></>,
    'settings':<><circle cx="8" cy="8" r="2"/><path d="M8 2v2"/><path d="M8 12v2"/><path d="M2 8h2"/><path d="M12 8h2"/><path d="M3.8 3.8l1.4 1.4"/><path d="M10.8 10.8l1.4 1.4"/><path d="M3.8 12.2l1.4-1.4"/><path d="M10.8 5.2l1.4-1.4"/></>,
    'sun':     <><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5"/><path d="M8 13v1.5"/><path d="M1.5 8h1.5"/><path d="M13 8h1.5"/><path d="M3 3l1 1"/><path d="M12 12l1 1"/><path d="M3 13l1-1"/><path d="M12 4l1-1"/></>,
    'github':  <path d="M8 1.5c-3.6 0-6.5 2.9-6.5 6.5 0 2.9 1.9 5.3 4.4 6.2.3.1.4-.1.4-.3v-1c-1.8.4-2.2-.9-2.2-.9-.3-.7-.7-1-.7-1-.6-.4 0-.4 0-.4.7 0 1 .7 1 .7.6 1 1.6.7 2 .6.1-.5.3-.8.5-1-1.4-.2-2.9-.7-2.9-3.2 0-.7.3-1.3.7-1.7-.1-.2-.3-.9.1-1.9 0 0 .6-.2 1.9.7.5-.2 1.1-.2 1.7-.2.6 0 1.2.1 1.7.2 1.3-.9 1.9-.7 1.9-.7.4 1 .1 1.7 0 1.9.4.4.7 1 .7 1.7 0 2.5-1.5 3-2.9 3.2.3.2.5.6.5 1.2v1.7c0 .2.1.4.4.3 2.5-.9 4.4-3.3 4.4-6.2C14.5 4.4 11.6 1.5 8 1.5z"/>,
    'eye':     <><path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/></>,
    'history': <><path d="M1.5 8a6.5 6.5 0 1 0 2-4.7"/><path d="M1.5 1.5v3h3"/><path d="M8 4.5V8l2.5 1.5"/></>,
  };
  return <svg {...props}>{paths[name] || null}</svg>;
}

// ────────────────────────────────────────────────────────────
// JSON FORMAT / VALIDATE
// ────────────────────────────────────────────────────────────
const SAMPLE_JSON = `{"id":"u_8421","name":"Ada","email":"ada@blutils.dev","plan":"pro","since":"2024-08-14","tags":["beta","admin"],"meta":{"twoFA":true,"lastLogin":1747800000,"devices":[{"os":"macOS","ver":"15.4"},{"os":"iOS","ver":"18.4"}]}}`;

function JsonTool({ initialInput, onOutput, toast }) {
  const [input, setInput] = useState(initialInput || SAMPLE_JSON);
  const [indent, setIndent] = useState(2);
  const [sortKeys, setSortKeys] = useState(false);

  const parsed = useMemo(() => {
    try {
      const v = JSON.parse(input);
      return { ok: true, value: v };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, [input]);

  const output = useMemo(() => {
    if (!parsed.ok) return "";
    const sort = (x) => {
      if (Array.isArray(x)) return x.map(sort);
      if (x && typeof x === "object") {
        const out = {};
        for (const k of Object.keys(x).sort()) out[k] = sort(x[k]);
        return out;
      }
      return x;
    };
    const v = sortKeys ? sort(parsed.value) : parsed.value;
    return indent === 0 ? JSON.stringify(v) : JSON.stringify(v, null, indent);
  }, [parsed, indent, sortKeys]);

  useEffect(() => { if (onOutput && parsed.ok) onOutput(output); }, [output, parsed.ok]);

  const stats = useMemo(() => {
    if (!parsed.ok) return null;
    let nodes = 0, keys = 0, depth = 0;
    const walk = (v, d = 1) => {
      nodes++;
      depth = Math.max(depth, d);
      if (Array.isArray(v)) v.forEach(x => walk(x, d + 1));
      else if (v && typeof v === "object") {
        keys += Object.keys(v).length;
        Object.values(v).forEach(x => walk(x, d + 1));
      }
    };
    walk(parsed.value);
    return { nodes, keys, depth, bytes: new Blob([input]).size, outBytes: new Blob([output]).size };
  }, [parsed, input, output]);

  return (
    <>
      <div className="tool-head">
        <h1>json.format</h1>
        {parsed.ok
          ? <span className="chip ok"><Icon name="check" size={11}/> valid</span>
          : <span className="chip bad"><Icon name="x" size={11}/> invalid</span>}
        <div style={{ flex: 1 }}/>
        <div className="seg-ctrl">
          <button className={indent === 0 ? 'on' : ''} onClick={() => setIndent(0)}>minify</button>
          <button className={indent === 2 ? 'on' : ''} onClick={() => setIndent(2)}>2sp</button>
          <button className={indent === 4 ? 'on' : ''} onClick={() => setIndent(4)}>4sp</button>
          <button className={indent === '\t' ? 'on' : ''} onClick={() => setIndent('\t')}>tab</button>
        </div>
        <button className="btn" onClick={() => setSortKeys(s => !s)}>
          {sortKeys ? <Icon name="check" size={11}/> : <Icon name="plus" size={11}/>}
          sort keys
        </button>
      </div>
      <p className="tool-sub">Validates on every keystroke. Reformats live. No data leaves your browser.</p>

      <div className="two-col">
        <div className="panel">
          <div className="panel-h">
            <span>input</span>
            <span className="actions">
              <button className="btn ghost sm" onClick={() => setInput("")}>clear</button>
              <button className="btn ghost sm" onClick={() => setInput(SAMPLE_JSON)}>sample</button>
            </span>
          </div>
          <textarea className="area bare" value={input} onChange={e => setInput(e.target.value)} spellCheck={false} style={{ minHeight: 360 }}/>
        </div>
        <div className="panel">
          <div className="panel-h">
            <span>output</span>
            <span className="actions">
              <button className="btn ghost sm" disabled={!parsed.ok} onClick={() => copyText(output, toast)}>
                <Icon name="copy" size={11}/> copy
              </button>
            </span>
          </div>
          {parsed.ok
            ? <textarea readOnly className="area bare" value={output} spellCheck={false} style={{ minHeight: 360 }}/>
            : <div style={{ padding: 14 }}><div className="json-error">{parsed.error}</div></div>}
        </div>
      </div>

      {stats && (
        <div className="json-stats" style={{ marginTop: 12 }}>
          <span className="chip">{stats.nodes} nodes</span>
          <span className="chip">{stats.keys} keys</span>
          <span className="chip">depth {stats.depth}</span>
          <span className="chip">{stats.bytes} → {stats.outBytes} B</span>
        </div>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────
// HASH GENERATOR
// ────────────────────────────────────────────────────────────
async function digest(name, text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest(name, enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function HashTool({ initialInput, onOutput, toast }) {
  const [input, setInput] = useState(initialInput ?? "the quick brown fox jumps over the lazy dog");
  const [hashes, setHashes] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const md5 = window.SparkMD5 ? window.SparkMD5.hash(input) : '…';
      const [sha1, sha256, sha512] = await Promise.all([
        digest('SHA-1', input),
        digest('SHA-256', input),
        digest('SHA-512', input),
      ]);
      if (!cancelled) setHashes({ md5, sha1, sha256, sha512 });
    })();
    return () => { cancelled = true; };
  }, [input]);

  useEffect(() => { if (onOutput && hashes.sha256) onOutput(hashes.sha256); }, [hashes.sha256]);

  return (
    <>
      <div className="tool-head">
        <h1>hash.generate</h1>
        <span className="chip">{new Blob([input]).size} bytes in</span>
        <div style={{ flex: 1 }}/>
      </div>
      <p className="tool-sub">Computes locally via SubtleCrypto. MD5 is for compatibility only — don't use it for security.</p>

      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-h">
          <span>input</span>
          <span className="actions"><button className="btn ghost sm" onClick={() => setInput("")}>clear</button></span>
        </div>
        <textarea className="area bare" value={input} onChange={e => setInput(e.target.value)} spellCheck={false} style={{ minHeight: 96 }}/>
      </div>

      <div className="panel">
        <div className="panel-h"><span>digests</span></div>
        <div style={{ padding: '4px 14px' }}>
          {[
            ['MD5', hashes.md5, true],
            ['SHA-1', hashes.sha1],
            ['SHA-256', hashes.sha256],
            ['SHA-512', hashes.sha512],
          ].map(([name, val, weak]) => (
            <div className="hash-row" key={name}>
              <div className="h-name">
                {name}
                {weak && <span className="chip bad" style={{ marginLeft: 6, padding: '0 5px', fontSize: 9 }}>weak</span>}
              </div>
              <div className="h-val">{val || <span className="spin"/>}</div>
              <button className="btn ghost sm" onClick={() => copyText(val, toast)}><Icon name="copy" size={11}/></button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// UNIX TIME
// ────────────────────────────────────────────────────────────
function UnixTool({ toast }) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [paused, setPaused] = useState(false);
  const [ts, setTs] = useState(1712045600);
  const [dt, setDt] = useState("");

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    const d = new Date(ts * 1000);
    setDt(d.toISOString());
  }, [ts]);

  const fmt = (s, kind) => {
    const d = new Date(s * 1000);
    if (kind === 'iso') return d.toISOString();
    if (kind === 'rfc') return d.toUTCString();
    if (kind === 'local') return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' });
    if (kind === 'rel') {
      const diff = Math.floor(Date.now() / 1000) - s;
      const a = Math.abs(diff);
      if (a < 60) return diff >= 0 ? `${a}s ago` : `in ${a}s`;
      if (a < 3600) return diff >= 0 ? `${Math.floor(a/60)}m ago` : `in ${Math.floor(a/60)}m`;
      if (a < 86400) return diff >= 0 ? `${Math.floor(a/3600)}h ago` : `in ${Math.floor(a/3600)}h`;
      return diff >= 0 ? `${Math.floor(a/86400)}d ago` : `in ${Math.floor(a/86400)}d`;
    }
    return '';
  };
  const d = new Date(now * 1000);

  return (
    <>
      <div className="tool-head">
        <h1>unix.time</h1>
        <span className="chip">UTC</span>
        <div style={{ flex: 1 }}/>
        <button className="btn ghost sm" onClick={() => setPaused(p => !p)}>
          <Icon name={paused ? 'play' : 'pause'} size={11}/> {paused ? 'resume' : 'pause'}
        </button>
      </div>
      <p className="tool-sub">Live timestamp updates every second. Convert in either direction.</p>

      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-h">
          <span>now</span>
          <span className="actions">
            <button className="btn ghost sm" onClick={() => copyText(String(now), toast)}><Icon name="copy" size={11}/> copy</button>
          </span>
        </div>
        <div className="panel-b">
          <div className="now-stamp">{String(now).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}</div>
          <div className="now-row">
            <span><b>{d.toISOString().slice(0,10)}</b></span>
            <span>{d.toISOString().slice(11,19)} UTC</span>
            <span>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()]}, week {Math.ceil(((d - new Date(d.getUTCFullYear(),0,1))/86400000 + new Date(d.getUTCFullYear(),0,1).getUTCDay()+1)/7)}</span>
            <span>local: <b>{new Date(now*1000).toLocaleString(undefined,{timeStyle:'medium'})}</b></span>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-h"><span>unix → date</span></div>
          <div className="panel-b">
            <input className="input" value={ts} onChange={e => setTs(parseInt(e.target.value) || 0)} type="number"/>
            <div style={{ height: 8 }}/>
            <dl className="kv">
              <dt>ISO 8601</dt><dd>{fmt(ts, 'iso')}</dd>
              <dt>RFC 2822</dt><dd>{fmt(ts, 'rfc')}</dd>
              <dt>Local</dt><dd>{fmt(ts, 'local')}</dd>
              <dt>Relative</dt><dd>{fmt(ts, 'rel')}</dd>
            </dl>
          </div>
        </div>
        <div className="panel">
          <div className="panel-h"><span>date → unix</span></div>
          <div className="panel-b">
            <input className="input" value={dt} onChange={e => {
              setDt(e.target.value);
              const t = new Date(e.target.value).getTime();
              if (!isNaN(t)) setTs(Math.floor(t/1000));
            }}/>
            <div style={{ height: 8 }}/>
            <dl className="kv">
              <dt>seconds</dt><dd>{ts}</dd>
              <dt>millis</dt><dd>{ts * 1000}</dd>
              <dt>micros</dt><dd>{ts * 1_000_000}</dd>
              <dt>weekday</dt><dd>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(ts*1000).getUTCDay()]}</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// REGEX TESTER
// ────────────────────────────────────────────────────────────
const REGEX_SAMPLE_TEXT = `Contact us:
  ada@blutils.dev  (primary)
  support+urgent@blutils.dev
  jane.doe@example.co.uk
  not-an-email
  bob_42@io.example
Server: 192.168.1.42 talking to 10.0.0.1
Reply by 2026-05-15.`;

function RegexTool({ toast }) {
  const [pattern, setPattern] = useState("(?<user>[\\w.+-]+)@(?<host>[\\w.-]+\\.[a-z]{2,})");
  const [flags, setFlags] = useState("gi");
  const [text, setText] = useState(REGEX_SAMPLE_TEXT);

  const compiled = useMemo(() => {
    try { return { re: new RegExp(pattern, flags), error: null }; }
    catch (e) { return { re: null, error: e.message }; }
  }, [pattern, flags]);

  const matches = useMemo(() => {
    if (!compiled.re) return [];
    const out = []; let m;
    if (compiled.re.global) {
      while ((m = compiled.re.exec(text)) !== null) {
        out.push({ index: m.index, len: m[0].length, value: m[0], groups: m.groups || {} });
        if (m.index === compiled.re.lastIndex) compiled.re.lastIndex++;
      }
    } else {
      m = compiled.re.exec(text);
      if (m) out.push({ index: m.index, len: m[0].length, value: m[0], groups: m.groups || {} });
    }
    return out;
  }, [compiled, text]);

  const highlighted = useMemo(() => {
    if (!matches.length) return text;
    const out = [];
    let cur = 0;
    matches.forEach((m, i) => {
      if (m.index > cur) out.push(<span key={`t${i}`}>{text.slice(cur, m.index)}</span>);
      out.push(<mark key={`m${i}`} title={`match ${i+1}`}>{m.value}</mark>);
      cur = m.index + m.len;
    });
    if (cur < text.length) out.push(<span key="tail">{text.slice(cur)}</span>);
    return out;
  }, [text, matches]);

  const toggleFlag = (f) => setFlags(s => s.includes(f) ? s.replace(f, '') : s + f);

  return (
    <>
      <div className="tool-head">
        <h1>regex.test</h1>
        {compiled.error
          ? <span className="chip bad"><Icon name="x" size={11}/> invalid</span>
          : <span className="chip ok">{matches.length} match{matches.length === 1 ? '' : 'es'}</span>}
        <div style={{ flex: 1 }}/>
        <div className="seg-ctrl">
          {['g','i','m','s','u','y'].map(f =>
            <button key={f} className={flags.includes(f) ? 'on' : ''} onClick={() => toggleFlag(f)}>{f}</button>
          )}
        </div>
      </div>
      <p className="tool-sub">JavaScript flavor. Named groups and lookaround supported.</p>

      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-h"><span>pattern</span></div>
        <div className="panel-b" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>/</span>
          <input className="input bare" value={pattern} onChange={e => setPattern(e.target.value)} spellCheck={false}/>
          <span style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>/{flags}</span>
        </div>
        {compiled.error && <div className="json-error" style={{ margin: '0 12px 12px' }}>{compiled.error}</div>}
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-h">
            <span>test text</span>
            <span className="actions">
              <button className="btn ghost sm" onClick={() => setText("")}>clear</button>
              <button className="btn ghost sm" onClick={() => setText(REGEX_SAMPLE_TEXT)}>sample</button>
            </span>
          </div>
          <div className="panel-b">
            <textarea className="area bare" style={{ minHeight: 200 }} value={text} onChange={e => setText(e.target.value)} spellCheck={false}/>
            <div className="regex-text" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--line)' }}>
              {highlighted}
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-h"><span>matches · {matches.length}</span></div>
          <div className="panel-b" style={{ maxHeight: 360, overflowY: 'auto' }}>
            {matches.length === 0 && <div className="empty" style={{ padding: 20 }}>no matches</div>}
            {matches.map((m, i) => (
              <div key={i} style={{ padding: '8px 0', borderTop: i ? '1px dashed var(--line)' : 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span className="chip" style={{ fontSize: 10 }}>#{i+1}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5 }}>{m.value}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>@ {m.index}</span>
                </div>
                {Object.keys(m.groups).length > 0 && (
                  <dl className="kv" style={{ marginTop: 4, marginLeft: 12, gridTemplateColumns: '70px 1fr' }}>
                    {Object.entries(m.groups).map(([k,v]) =>
                      <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>
                    )}
                  </dl>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// TEXT DIFF
// ────────────────────────────────────────────────────────────
function lcsDiff(a, b) {
  // line-based diff using LCS
  const m = a.length, n = b.length;
  // cap for performance in demo
  if (m * n > 250000) return null;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i+1][j+1] + 1 : Math.max(dp[i+1][j], dp[i][j+1]);
  const out = []; let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) { out.push({ t: '=', a: a[i], b: b[j], ai: i, bi: j }); i++; j++; }
    else if (dp[i+1][j] >= dp[i][j+1]) { out.push({ t: '-', a: a[i], ai: i }); i++; }
    else { out.push({ t: '+', b: b[j], bi: j }); j++; }
  }
  while (i < m) { out.push({ t: '-', a: a[i], ai: i }); i++; }
  while (j < n) { out.push({ t: '+', b: b[j], bi: j }); j++; }
  return out;
}

const DIFF_A = `function greet(name) {
  console.log("hello, " + name);
  return name.length;
}`;
const DIFF_B = `function greet(name, loud) {
  const msg = "hello, " + name;
  console.log(loud ? msg.toUpperCase() : msg);
  return msg.length;
}`;

function DiffTool({ toast }) {
  const [a, setA] = useState(DIFF_A);
  const [b, setB] = useState(DIFF_B);
  const [ignoreWs, setIgnoreWs] = useState(false);

  const result = useMemo(() => {
    const norm = (s) => ignoreWs ? s.split('\n').map(x => x.replace(/\s+/g, ' ').trim()) : s.split('\n');
    return lcsDiff(norm(a), norm(b));
  }, [a, b, ignoreWs]);

  const stats = useMemo(() => {
    if (!result) return null;
    return result.reduce((acc, r) => {
      if (r.t === '+') acc.add++; else if (r.t === '-') acc.del++; else acc.eq++;
      return acc;
    }, { add: 0, del: 0, eq: 0 });
  }, [result]);

  // build paired side-by-side rows
  const rows = useMemo(() => {
    if (!result) return [];
    const out = [];
    let pendingDel = [];
    for (const r of result) {
      if (r.t === '=') {
        while (pendingDel.length) out.push({ L: pendingDel.shift(), R: null });
        out.push({ L: r, R: r });
      } else if (r.t === '-') {
        pendingDel.push(r);
      } else {
        if (pendingDel.length) out.push({ L: pendingDel.shift(), R: r });
        else out.push({ L: null, R: r });
      }
    }
    while (pendingDel.length) out.push({ L: pendingDel.shift(), R: null });
    return out;
  }, [result]);

  return (
    <>
      <div className="tool-head">
        <h1>text.diff</h1>
        {stats && <span className="chip ok">+{stats.add}</span>}
        {stats && <span className="chip bad">−{stats.del}</span>}
        {stats && <span className="chip">{stats.eq} unchanged</span>}
        <div style={{ flex: 1 }}/>
        <button className="btn ghost sm" onClick={() => setIgnoreWs(s => !s)}>
          {ignoreWs ? <Icon name="check" size={11}/> : <Icon name="plus" size={11}/>} ignore whitespace
        </button>
        <button className="btn ghost sm" onClick={() => { setA(b); setB(a); }}>
          <Icon name="swap" size={11}/> swap
        </button>
      </div>
      <p className="tool-sub">Line-by-line diff, side by side. LCS algorithm.</p>

      <div className="two-col" style={{ marginBottom: 14 }}>
        <div className="panel">
          <div className="panel-h"><span>A — original</span></div>
          <textarea className="area bare" value={a} onChange={e => setA(e.target.value)} spellCheck={false} style={{ minHeight: 140 }}/>
        </div>
        <div className="panel">
          <div className="panel-h"><span>B — modified</span></div>
          <textarea className="area bare" value={b} onChange={e => setB(e.target.value)} spellCheck={false} style={{ minHeight: 140 }}/>
        </div>
      </div>

      <div className="diff-grid">
        {rows.map((row, idx) => {
          const Lcls = !row.L ? 'empty' : row.L.t === '-' ? 'del' : '';
          const Rcls = !row.R ? 'empty' : row.R.t === '+' ? 'add' : '';
          return (
            <React.Fragment key={idx}>
              <div className={`gut ${Lcls}`}>{row.L ? (row.L.ai !== undefined ? row.L.ai + 1 : '') : ''}</div>
              <div className={`ln ${Lcls}`}>{row.L ? row.L.a : ''}</div>
              <div className={`gut ${Rcls}`}>{row.R ? (row.R.bi !== undefined ? row.R.bi + 1 : '') : ''}</div>
              <div className={`ln ${Rcls}`}>{row.R ? row.R.b : ''}</div>
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// LOREM IPSUM
// ────────────────────────────────────────────────────────────
const LOREM_WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(' ');
function loremWords(n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(LOREM_WORDS[Math.floor(Math.random()*LOREM_WORDS.length)]);
  if (out.length) out[0] = out[0][0].toUpperCase() + out[0].slice(1);
  return out.join(' ');
}
function loremSentence() {
  const n = 8 + Math.floor(Math.random()*10);
  return loremWords(n) + '.';
}
function loremParagraph() {
  const n = 3 + Math.floor(Math.random()*4);
  return Array.from({ length: n }, loremSentence).join(' ');
}

function LoremTool({ onOutput, toast }) {
  const [unit, setUnit] = useState('paragraphs');
  const [count, setCount] = useState(3);
  const [seed, setSeed] = useState(1);
  const out = useMemo(() => {
    // seed unused in actual rand for simplicity; regenerates on seed bump
    void seed;
    if (unit === 'words') return loremWords(count);
    if (unit === 'sentences') return Array.from({ length: count }, loremSentence).join(' ');
    return Array.from({ length: count }, loremParagraph).join('\n\n');
  }, [unit, count, seed]);

  useEffect(() => { if (onOutput) onOutput(out); }, [out]);

  return (
    <>
      <div className="tool-head">
        <h1>lorem.ipsum</h1>
        <span className="chip">{out.split(/\s+/).filter(Boolean).length} words</span>
        <div style={{ flex: 1 }}/>
        <button className="btn ghost sm" onClick={() => setSeed(s => s + 1)}><Icon name="sparkle" size={11}/> regenerate</button>
      </div>
      <p className="tool-sub">Filler text — words, sentences, or paragraphs.</p>

      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-b" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="seg-ctrl">
            {['words','sentences','paragraphs'].map(u =>
              <button key={u} className={unit === u ? 'on' : ''} onClick={() => setUnit(u)}>{u}</button>
            )}
          </div>
          <span style={{ color: 'var(--muted)' }}>count</span>
          <div className="seg-ctrl">
            <button onClick={() => setCount(c => Math.max(1, c - 1))}><Icon name="minus" size={10}/></button>
            <button style={{ minWidth: 36 }} className="on">{count}</button>
            <button onClick={() => setCount(c => c + 1)}><Icon name="plus" size={10}/></button>
          </div>
          <input type="range" min={1} max={20} value={count} onChange={e => setCount(parseInt(e.target.value))} style={{ flex: 1, minWidth: 120 }}/>
        </div>
      </div>

      <div className="panel">
        <div className="panel-h">
          <span>output</span>
          <span className="actions"><button className="btn ghost sm" onClick={() => copyText(out, toast)}><Icon name="copy" size={11}/> copy</button></span>
        </div>
        <div className="panel-b" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          {out}
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// QR CODE
// ────────────────────────────────────────────────────────────
function makeQrSvg(text, size = 220) {
  // qrcode-generator: window.qrcode(typeNumber, errorLevel)
  if (!window.qrcode) return null;
  const q = window.qrcode(0, 'M');
  q.addData(text || ' ');
  q.make();
  const n = q.getModuleCount();
  const cell = size / n;
  const rects = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (q.isDark(r, c)) {
        rects.push(<rect key={`${r}-${c}`} x={(c*cell).toFixed(2)} y={(r*cell).toFixed(2)} width={cell.toFixed(2)} height={cell.toFixed(2)} fill="#000000"/>);
      }
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="#ffffff"/>
      {rects}
    </svg>
  );
}

function QrTool({ initialInput, toast }) {
  const [text, setText] = useState(initialInput ?? "https://blutils.dev");
  const svg = useMemo(() => makeQrSvg(text), [text]);

  return (
    <>
      <div className="tool-head">
        <h1>qr.encode</h1>
        <span className="chip">{text.length} chars</span>
        <div style={{ flex: 1 }}/>
      </div>
      <p className="tool-sub">Encode any text or URL into a QR code. Renders SVG you can copy or download.</p>

      <div className="two-col">
        <div className="panel">
          <div className="panel-h">
            <span>input</span>
            <span className="actions">
              <button className="btn ghost sm" onClick={() => setText("")}>clear</button>
            </span>
          </div>
          <textarea className="area bare" value={text} onChange={e => setText(e.target.value)} spellCheck={false} style={{ minHeight: 200 }}/>
        </div>
        <div className="panel">
          <div className="panel-h">
            <span>qr</span>
            <span className="actions">
              <button className="btn ghost sm" onClick={() => copyText(text, toast)}><Icon name="copy" size={11}/> text</button>
            </span>
          </div>
          <div className="panel-b">
            <div className="qr-out">{svg || <div className="spin"/>}</div>
            <div style={{ marginTop: 10, textAlign: 'center', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
              error correction · M · auto version
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// MARKDOWN PREVIEW
// ────────────────────────────────────────────────────────────
const MD_SAMPLE = `# Blutils Notes

Local-only dev utilities. **Lightning fast.**

## Features
- JSON formatter
- Hash generator  
- Regex tester
- And ${'\u2728'} more

> "An app like Devutils, but in the browser."

\`\`\`bash
$ blu json fmt < data.json | hash sha256
\`\`\`

See the [docs](#) for more.
`;

function MarkdownTool({ initialInput, onOutput }) {
  const [text, setText] = useState(initialInput ?? MD_SAMPLE);
  const html = useMemo(() => {
    if (window.marked) return window.marked.parse(text);
    return text;
  }, [text]);
  useEffect(() => { if (onOutput) onOutput(html); }, [html]);

  return (
    <>
      <div className="tool-head">
        <h1>markdown.preview</h1>
        <span className="chip">{text.split('\n').length} lines</span>
        <div style={{ flex: 1 }}/>
      </div>
      <p className="tool-sub">CommonMark, rendered as you type.</p>

      <div className="two-col">
        <div className="panel">
          <div className="panel-h"><span>source</span></div>
          <textarea className="area bare" value={text} onChange={e => setText(e.target.value)} spellCheck={false} style={{ minHeight: 380 }}/>
        </div>
        <div className="panel">
          <div className="panel-h"><span>preview</span></div>
          <div className="panel-b md-prev" dangerouslySetInnerHTML={{ __html: html }}/>
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// CRON
// ────────────────────────────────────────────────────────────
function parseField(f, min, max) {
  if (f === '*') {
    const out = []; for (let i = min; i <= max; i++) out.push(i); return out;
  }
  const out = new Set();
  for (const part of f.split(',')) {
    let step = 1, range = part;
    if (part.includes('/')) { const [r, s] = part.split('/'); range = r || '*'; step = parseInt(s); }
    let lo, hi;
    if (range === '*') { lo = min; hi = max; }
    else if (range.includes('-')) { const [a,b] = range.split('-').map(Number); lo = a; hi = b; }
    else { lo = parseInt(range); hi = lo; }
    if (isNaN(lo) || isNaN(hi)) throw new Error(`bad field: ${f}`);
    for (let i = lo; i <= hi; i += step) out.add(i);
  }
  return [...out].sort((a,b) => a-b);
}
function describe(f, all, names) {
  if (f === '*') return null;
  if (names) return all.map(i => names[i]).join(', ');
  if (all.length === 1) return String(all[0]);
  // detect step
  if (f.startsWith('*/')) return `every ${f.slice(2)}`;
  return all.join(',');
}
function cronExplain(parts) {
  try {
    const [m, h, dom, mon, dow] = parts;
    const mins = parseField(m, 0, 59);
    const hrs = parseField(h, 0, 23);
    const doms = parseField(dom, 1, 31);
    const mons = parseField(mon, 1, 12);
    const dows = parseField(dow, 0, 6);
    const bits = [];
    bits.push(`At minute ${describe(m, mins) || 'every'}`);
    if (h !== '*') bits.push(`past hour ${describe(h, hrs)}`);
    else if (m !== '*') bits.push(`of every hour`);
    if (dom !== '*') bits.push(`on day ${describe(dom, doms)}`);
    if (mon !== '*') bits.push(`in ${describe(mon, mons, [null,'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])}`);
    if (dow !== '*') bits.push(`on ${describe(dow, dows, ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'])}`);
    return bits.join(' ') + '.';
  } catch (e) { return null; }
}
function nextRuns(parts, count = 6) {
  try {
    const [m, h, dom, mon, dow] = parts;
    const mins = parseField(m, 0, 59);
    const hrs = parseField(h, 0, 23);
    const doms = parseField(dom, 1, 31);
    const mons = parseField(mon, 1, 12);
    const dows = parseField(dow, 0, 6);
    const out = [];
    let d = new Date();
    d.setSeconds(0, 0);
    d = new Date(d.getTime() + 60000);
    let safety = 0;
    while (out.length < count && safety++ < 525960) { // 1yr of mins
      if (mins.includes(d.getMinutes()) && hrs.includes(d.getHours())
          && doms.includes(d.getDate()) && mons.includes(d.getMonth()+1) && dows.includes(d.getDay())) {
        out.push(new Date(d));
      }
      d = new Date(d.getTime() + 60000);
    }
    return out;
  } catch (e) { return []; }
}
const CRON_PRESETS = [
  ['* * * * *', 'every minute'],
  ['*/15 * * * *', 'every 15 min'],
  ['0 * * * *', 'hourly'],
  ['0 9 * * 1-5', 'weekdays @ 9am'],
  ['30 2 * * 0', 'sun @ 2:30am'],
  ['0 0 1 * *', '1st of month'],
];

function CronTool({ toast }) {
  const [expr, setExpr] = useState('*/15 9-17 * * 1-5');
  const parts = expr.trim().split(/\s+/);
  const valid = parts.length === 5;
  const exp = valid ? cronExplain(parts) : null;
  const next = valid ? nextRuns(parts, 6) : [];

  return (
    <>
      <div className="tool-head">
        <h1>cron.parse</h1>
        {valid && exp
          ? <span className="chip ok">valid</span>
          : <span className="chip bad">{parts.length} fields, need 5</span>}
        <div style={{ flex: 1 }}/>
      </div>
      <p className="tool-sub">5-field cron: minute · hour · day-of-month · month · day-of-week.</p>

      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-h"><span>expression</span></div>
        <div className="panel-b">
          <input className="input" value={expr} onChange={e => setExpr(e.target.value)} spellCheck={false}/>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {CRON_PRESETS.map(([e, lbl]) =>
              <button key={e} className="chip" style={{ cursor: 'default' }} onClick={() => setExpr(e)}>
                {lbl}
              </button>
            )}
          </div>
        </div>
      </div>

      {exp && <div className="cron-explain" style={{ marginBottom: 14 }}><b>↳</b> {exp}</div>}

      <div className="panel">
        <div className="panel-h"><span>next 6 runs</span></div>
        <div className="panel-b">
          <ol className="cron-runs" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {next.map((d, i) => {
              const diff = Math.round((d - Date.now()) / 60000);
              const rel = diff < 60 ? `in ${diff} min` : diff < 1440 ? `in ${Math.round(diff/60)} hr` : `in ${Math.round(diff/1440)} d`;
              return (
                <li key={i}>
                  <span className="rn">#{i+1}</span>
                  <span className="rt">{d.toLocaleString(undefined, { dateStyle:'medium', timeStyle:'short' })}</span>
                  <span className="rd">{rel}</span>
                </li>
              );
            })}
            {!next.length && <div className="empty">parse error</div>}
          </ol>
        </div>
      </div>
    </>
  );
}

// ─────────── Home ───────────
function HomeTool({ openTool, openPalette }) {
  const featured = [
    ['json', 'JSON Format', 'validate & beautify'],
    ['hash', 'Hash Generator', 'md5, sha-1/256/512'],
    ['unix', 'Unix Time', 'live timestamp'],
    ['regex', 'Regex Tester', 'js flavor + groups'],
    ['diff', 'Text Diff', 'side-by-side'],
    ['qr', 'QR Generator', 'svg output'],
    ['md', 'Markdown', 'commonmark renderer'],
    ['cron', 'Cron Parser', 'next runs + explain'],
  ];
  return (
    <>
      <h1 className="home-wordmark">blutils<span className="dot">.</span></h1>
      <p className="home-sub">
        local-only, lightning-fast developer utilities. open-source. everything runs in your browser — nothing leaves it.
      </p>

      <div className="home-cta">
        <Icon name="search" size={14}/>
        <span className="hint">press <span className="kbd">⌘K</span> or <span className="kbd">/</span> to jump to any tool</span>
        <button className="btn primary" onClick={openPalette}>open command palette</button>
      </div>

      <div className="home-section">tools · {featured.length}</div>
      <div className="home-grid">
        {featured.map(([id, name, desc]) => (
          <div key={id} className="home-card" onClick={() => openTool(id)}>
            <div className="top">
              <Icon name={id} size={14}/>
              <b>{name.toLowerCase()}</b>
            </div>
            <div className="desc">{desc}</div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─────────── Export ───────────
window.BlutilsTools = {
  Icon, copyText,
  JsonTool, HashTool, UnixTool, RegexTool, DiffTool, LoremTool, QrTool, MarkdownTool, CronTool,
  HomeTool,
};
