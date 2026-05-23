// blutils-pipe.jsx — opt-in pipe chain mode
const { useState, useMemo, useEffect } = React;
const { Icon, copyText } = window.BlutilsTools;

// Operations available in a chain. Each takes a string in, returns a string out.
const PIPE_OPS = {
  'input':         { name: 'input',           kind: 'source', icon: 'lorem' },
  'lorem':         { name: 'lorem (3¶)',      kind: 'source', icon: 'lorem',
                    run: () => (window.BlutilsLorem || (() => 'Lorem ipsum dolor sit amet.'))() },
  'b64.encode':    { name: 'base64 encode',   icon: 'hash', run: (s) => btoa(unescape(encodeURIComponent(s))) },
  'b64.decode':    { name: 'base64 decode',   icon: 'hash', run: (s) => { try { return decodeURIComponent(escape(atob(s))); } catch { throw new Error('not valid base64'); } } },
  'url.encode':    { name: 'url encode',      icon: 'hash', run: (s) => encodeURIComponent(s) },
  'url.decode':    { name: 'url decode',      icon: 'hash', run: (s) => decodeURIComponent(s) },
  'upper':         { name: 'uppercase',       icon: 'lorem', run: (s) => s.toUpperCase() },
  'lower':         { name: 'lowercase',       icon: 'lorem', run: (s) => s.toLowerCase() },
  'reverse':       { name: 'reverse',         icon: 'swap', run: (s) => [...s].reverse().join('') },
  'json.format':   { name: 'json format',     icon: 'json', run: (s) => JSON.stringify(JSON.parse(s), null, 2) },
  'json.minify':   { name: 'json minify',     icon: 'json', run: (s) => JSON.stringify(JSON.parse(s)) },
  'sha256':        { name: 'sha-256',         icon: 'hash', async: true,
                    run: async (s) => {
                      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
                      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
                    } },
  'sha1':          { name: 'sha-1',           icon: 'hash', async: true,
                    run: async (s) => {
                      const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s));
                      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
                    } },
  'count':         { name: 'count length',    icon: 'hash', run: (s) => String(s.length) },
  'qr':            { name: 'qr (svg)',        icon: 'qr',   special: 'qr' },
};

function runOp(opId, inputStr) {
  const op = PIPE_OPS[opId];
  if (!op) throw new Error('unknown op');
  if (op.kind === 'source') return op.run ? op.run() : inputStr;
  return op.run(inputStr);
}

const LOREM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.";
window.BlutilsLorem = () => LOREM;

function PipeChain({ onLeave, toast, initialInput = "blutils ⚡" }) {
  // chain is a list of { id, op }
  const [chain, setChain] = useState([
    { id: 1, op: 'input', val: initialInput },
    { id: 2, op: 'b64.encode' },
    { id: 3, op: 'sha256' },
  ]);
  const [showPicker, setShowPicker] = useState(null); // step id to add after
  const [results, setResults] = useState([]);

  // run chain
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out = [];
      let cur = "";
      for (const step of chain) {
        try {
          if (step.op === 'input') cur = step.val || "";
          else {
            const op = PIPE_OPS[step.op];
            if (op.async) cur = await op.run(cur);
            else if (op.special === 'qr') cur = cur; // pass-through; render below
            else cur = op.run(cur);
          }
          out.push({ ok: true, value: cur });
        } catch (e) {
          out.push({ ok: false, error: e.message });
          break;
        }
      }
      if (!cancelled) setResults(out);
    })();
    return () => { cancelled = true; };
  }, [chain]);

  const addStep = (afterId, opId) => {
    const idx = chain.findIndex(s => s.id === afterId);
    const next = [...chain];
    next.splice(idx + 1, 0, { id: Date.now(), op: opId });
    setChain(next);
    setShowPicker(null);
  };
  const removeStep = (id) => setChain(c => c.filter(s => s.id !== id));
  const updateInput = (id, val) => setChain(c => c.map(s => s.id === id ? { ...s, val } : s));

  return (
    <>
      <div className="pipe-toolbar">
        <Icon name="pipe" size={14}/>
        <span className="lbl">pipe chain</span>
        <span style={{ color: 'var(--muted)' }}>· {chain.length} step{chain.length === 1 ? '' : 's'} · auto-runs on every change</span>
        <span className="spacer"/>
        <button className="btn ghost sm" onClick={() => {
          const last = results[results.length - 1];
          if (last?.ok) copyText(last.value, toast);
        }}><Icon name="copy" size={11}/> copy final</button>
        <button className="btn sm" onClick={() => {
          const recipe = chain.map(s => s.op === 'input' ? `"${s.val}"` : s.op).join(' | ');
          copyText(recipe, toast);
          toast && toast("Recipe copied as text");
        }}>save recipe</button>
        <button className="btn ghost sm" onClick={onLeave}><Icon name="x" size={11}/> exit chain</button>
      </div>
      <div className="pipe-stage">
        {chain.map((step, i) => {
          const op = PIPE_OPS[step.op];
          const result = results[i];
          const isInput = step.op === 'input';
          const isLast = i === chain.length - 1;
          return (
            <React.Fragment key={step.id}>
              <div className={`pipe-step ${isInput ? 'is-input' : ''} ${isLast && result?.ok ? 'is-output' : ''} ${result && !result.ok ? 'is-error' : ''}`}>
                <div className="pipe-step-h">
                  <span className="num">step {i + 1} /</span>
                  <Icon name={op?.icon || 'hash'} size={13}/>
                  <span className="name">{op?.name || step.op}</span>
                  <span className="spacer"/>
                  {result?.ok && <span className="chip ok" style={{ fontSize: 10 }}>✓ ok</span>}
                  {result && !result.ok && <span className="chip bad" style={{ fontSize: 10 }}>! {result.error}</span>}
                  {!isInput && (
                    <button className="btn ghost sm" onClick={() => removeStep(step.id)}><Icon name="x" size={11}/></button>
                  )}
                </div>
                <div className="pipe-step-b">
                  {isInput ? (
                    <textarea className="area" value={step.val || ''} onChange={e => updateInput(step.id, e.target.value)} style={{ minHeight: 60 }} spellCheck={false}/>
                  ) : op?.special === 'qr' ? (
                    <div style={{ display: 'grid', placeItems: 'center', padding: 8 }}>
                      {result?.ok ? <QrInline text={result.value}/> : <span className="spin"/>}
                    </div>
                  ) : (
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                      color: result?.ok ? 'var(--ink)' : 'var(--bad)',
                      maxHeight: 140, overflowY: 'auto',
                    }}>
                      {result?.ok ? (result.value || <em style={{ color: 'var(--muted)' }}>(empty)</em>) : (result?.error || '…')}
                    </div>
                  )}
                </div>
              </div>
              {showPicker === step.id ? (
                <div className="pipe-step" style={{ marginTop: 12, maxWidth: 760, width: '100%' }}>
                  <div className="pipe-step-h"><span className="name">add step after #{i + 1}</span>
                    <span className="spacer"/>
                    <button className="btn ghost sm" onClick={() => setShowPicker(null)}><Icon name="x" size={11}/></button>
                  </div>
                  <div className="pipe-step-b" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(PIPE_OPS).filter(([id]) => id !== 'input').map(([id, op]) => (
                      <button key={id} className="btn sm" onClick={() => addStep(step.id, id)}>
                        <Icon name={op.icon} size={11}/> {op.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button className="pipe-add" onClick={() => setShowPicker(step.id)} style={{ marginTop: 12, marginBottom: i === chain.length - 1 ? 0 : 0 }}>
                  + add step
                </button>
              )}
              {i < chain.length - 1 && <div className="pipe-link" style={{ marginTop: 12, marginBottom: 12 }}/>}
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
}

function QrInline({ text }) {
  const svg = useMemo(() => {
    if (!window.qrcode) return null;
    const q = window.qrcode(0, 'M');
    q.addData((text || ' ').slice(0, 256));
    q.make();
    const n = q.getModuleCount();
    const size = 160; const cell = size / n;
    const rects = [];
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++)
        if (q.isDark(r, c))
          rects.push(<rect key={`${r}-${c}`} x={(c*cell).toFixed(2)} y={(r*cell).toFixed(2)} width={cell.toFixed(2)} height={cell.toFixed(2)} fill="#000000"/>);
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect width={size} height={size} fill="#ffffff"/>
        {rects}
      </svg>
    );
  }, [text]);
  return <div className="qr-out" style={{ padding: 8 }}>{svg}</div>;
}

window.BlutilsPipe = { PipeChain };
