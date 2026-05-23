// blutils-app.jsx — sidebar + tabs + content + tweaks
const { useState, useEffect, useMemo, useRef, useCallback } = React;
const T = window.BlutilsTools;
const { Icon } = T;
const { Palette, detectKind } = window.BlutilsPalette;
const { PipeChain } = window.BlutilsPipe;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "density": "regular",
  "showAdvanced": true,
  "smartHints": true
}/*EDITMODE-END*/;

// ─────────── Tool registry ───────────
const TOOLS = [
  { id: 'json',  name: 'JSON Format',      desc: 'validate & beautify',   icon: 'json',  key: '⌘1', aliases: ['format','validate','prettify'], cmp: 'JsonTool' },
  { id: 'diff',  name: 'Text Diff',        desc: 'side-by-side',          icon: 'diff',  key: '⌘2', aliases: ['compare'], cmp: 'DiffTool' },
  { id: 'hash',  name: 'Hash Generator',   desc: 'md5/sha-1/256/512',     icon: 'hash',  key: '⌘3', aliases: ['md5','sha','sha256','checksum'], cmp: 'HashTool' },
  { id: 'regex', name: 'Regex Tester',     desc: 'js flavor + groups',    icon: 'regex', key: '⌘4', aliases: ['pattern','regexp'], cmp: 'RegexTool' },
  { id: 'unix',  name: 'Unix Time',        desc: 'live timestamp',        icon: 'clock', key: '⌘5', aliases: ['epoch','timestamp','time'], cmp: 'UnixTool' },
  { id: 'cron',  name: 'Cron Parser',      desc: 'next runs + explain',   icon: 'cron',  key: '⌘6', aliases: ['schedule'], cmp: 'CronTool' },
  { id: 'md',    name: 'Markdown Preview', desc: 'commonmark renderer',   icon: 'md',    key: '⌘7', aliases: ['markdown'], cmp: 'MarkdownTool' },
  { id: 'qr',    name: 'QR Generator',     desc: 'svg output',            icon: 'qr',    key: '⌘8', aliases: ['qrcode'], cmp: 'QrTool' },
  { id: 'lorem', name: 'Lorem Ipsum',      desc: 'placeholder text',      icon: 'lorem', key: '⌘9', aliases: ['filler','placeholder'], cmp: 'LoremTool' },
];

function getTool(id) { return TOOLS.find(t => t.id === id); }

// ─────────── Sidebar ───────────
function Sidebar({ activeId, openTool, openPalette, openHome }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q) return TOOLS;
    const ql = q.toLowerCase();
    return TOOLS.filter(t => t.name.toLowerCase().includes(ql) || (t.aliases || []).some(a => a.includes(ql)));
  }, [q]);
  const inputRef = useRef(null);

  // Cmd+F focuses sidebar search (alternative to palette)
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault(); inputRef.current?.focus(); inputRef.current?.select();
      }
      if (e.key === 'Escape' && q) { e.stopPropagation(); setQ(''); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q]);

  return (
    <aside className="side">
      <div className="side-brand" onClick={openHome} title="Home">
        <div className="logo">b.</div>
        <div className="name">blutils</div>
      </div>

      <div className="side-search">
        <span className="ico"><Icon name="search" size={12}/></span>
        <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="filter tools"/>
        <span className="kbd-hint">/</span>
      </div>

      <div className="side-list">
        <div className="side-section">
          <span>{q ? `${filtered.length} match${filtered.length === 1 ? '' : 'es'}` : 'tools'}</span>
          {!q && <span className="count">{TOOLS.length}</span>}
        </div>
        {filtered.map(t => (
          <div key={t.id} className={`side-item ${activeId === t.id ? 'on' : ''}`} onClick={() => openTool(t.id)}>
            <span className="ic"><Icon name={t.icon}/></span>
            <span className="label">{t.name.toLowerCase()}</span>
            <span className="kbd">{t.key}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '14px 8px', color: 'var(--chrome-muted-2)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
            no match. <a style={{ color: 'var(--accent)', cursor: 'default', textDecoration: 'underline', textUnderlineOffset: 3 }} onClick={() => { setQ(''); openPalette(); }}>open palette →</a>
          </div>
        )}
      </div>

      <div className="side-foot">
        <a className="side-foot-gh" href="#" title="GitHub"><Icon name="github" size={13}/></a>
        <span>mit</span>
        <span className="side-foot-sep"/>
        <span>v0.3.2</span>
      </div>
    </aside>
  );
}

// ─────────── Tabs bar (advanced mode) ───────────
function TabsBar({ tabs, activeIdx, onActivate, onClose, onNew, onRename }) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingIdx != null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIdx]);

  const startEdit = (i, currentName) => {
    setEditingIdx(i);
    setDraft(currentName);
  };
  const commit = () => {
    if (editingIdx != null) {
      const trimmed = draft.trim();
      onRename(editingIdx, trimmed || null); // null → revert to default
      setEditingIdx(null);
    }
  };
  const cancel = () => setEditingIdx(null);

  return (
    <div className="tabs-bar">
      {tabs.map((tab, i) => {
        const meta = tab.special === 'pipe'
          ? { name: 'pipe.chain', icon: 'pipe' }
          : tab.special === 'home'
          ? { name: 'home', icon: 'sun' }
          : (() => { const t = getTool(tab.toolId); return t ? { name: t.name.toLowerCase().replace(/\s+/g, '.'), icon: t.icon } : null; })();
        if (!meta) return null;
        const displayName = tab.customName || meta.name;
        const isEditing = editingIdx === i;
        return (
          <div
            key={tab.tabId}
            className={`tab ${i === activeIdx ? 'on' : ''}`}
            onClick={() => !isEditing && onActivate(i)}
            onDoubleClick={(e) => { e.stopPropagation(); startEdit(i, displayName); }}
            title="double-click to rename"
          >
            <span className="ic"><Icon name={meta.icon} size={12}/></span>
            {isEditing
              ? <input
                  ref={inputRef}
                  className="name-input"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commit();
                    else if (e.key === 'Escape') cancel();
                  }}
                  onBlur={commit}
                  onClick={e => e.stopPropagation()}
                />
              : <span className="name">{displayName}</span>}
            {tab.dirty && <span className="dirty"/>}
            <button className="x" onClick={(e) => { e.stopPropagation(); onClose(i); }} title="close">
              <Icon name="x" size={10}/>
            </button>
          </div>
        );
      })}
      <button className="tab-new" onClick={onNew} title="new tab"><Icon name="plus" size={12}/></button>
    </div>
  );
}

// ─────────── Status bar ───────────
function StatusBar({ tool, multiTab, pipeMode, openPalette, togglePipe, toggleTabs }) {
  return (
    <div className="status">
      <span className="seg ok"><span className="dot"/>local</span>
      <span className="seg">{pipeMode ? <><Icon name="pipe" size={10}/> chain</> : tool ? <span className="seg-tool">{tool.name.toLowerCase().replace(/\s+/g, '.')}</span> : 'home'}</span>
      <span className="spacer"/>
      <span className="seg" onClick={togglePipe} style={{ cursor: 'default' }}>
        <Icon name="pipe" size={10}/> chain
      </span>
      <span className="seg" onClick={toggleTabs} style={{ cursor: 'default' }}>
        <Icon name="plus" size={10}/> {multiTab ? 'tabs on' : 'single'}
      </span>
      <span className="seg" onClick={openPalette} style={{ cursor: 'default' }}>
        <kbd>⌘K</kbd> palette
      </span>
    </div>
  );
}

// ─────────── App ───────────
function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteSeed, setPaletteSeed] = useState("");
  const [multiTab, setMultiTab] = useState(false);
  const [pipeMode, setPipeMode] = useState(false);
  const [toast, setToast] = useState(null);

  // tabs structure: list of { tabId, special?: 'home'|'pipe', toolId?, customName? }
  const [tabs, setTabs] = useState([{ tabId: 1, special: 'home' }]);
  const [activeIdx, setActiveIdx] = useState(0);
  const tabIdRef = useRef(2);

  const active = tabs[activeIdx];
  const activeTool = active?.toolId ? getTool(active.toolId) : null;

  // apply theme + density
  useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.dataset.density = tweaks.density;
  }, [tweaks.theme, tweaks.density]);

  const showToast = useCallback((msg) => {
    setToast({ msg, key: Math.random() });
    setTimeout(() => setToast(null), 1700);
  }, []);

  // ───── Tool opening logic ─────
  const openTool = useCallback((id, seedInput) => {
    setPaletteOpen(false);
    setPipeMode(false);
    if (multiTab) {
      // if already open, switch
      const existing = tabs.findIndex(t => t.toolId === id);
      if (existing !== -1) { setActiveIdx(existing); return; }
      const newTab = { tabId: tabIdRef.current++, toolId: id };
      setTabs(t => [...t, newTab]);
      setActiveIdx(tabs.length);
    } else {
      // single-tool mode: replace the (only) main tab
      setTabs([{ tabId: tabIdRef.current++, toolId: id }]);
      setActiveIdx(0);
    }
  }, [multiTab, tabs]);

  const openHome = useCallback(() => {
    setPipeMode(false);
    if (multiTab) {
      const existing = tabs.findIndex(t => t.special === 'home');
      if (existing !== -1) setActiveIdx(existing);
      else {
        const nt = { tabId: tabIdRef.current++, special: 'home' };
        setTabs(t => [...t, nt]); setActiveIdx(tabs.length);
      }
    } else {
      setTabs([{ tabId: tabIdRef.current++, special: 'home' }]); setActiveIdx(0);
    }
  }, [multiTab, tabs]);

  const closeTab = useCallback((idx) => {
    setTabs(t => {
      const next = t.filter((_, i) => i !== idx);
      if (next.length === 0) { setActiveIdx(0); return [{ tabId: tabIdRef.current++, special: 'home' }]; }
      if (activeIdx >= next.length) setActiveIdx(next.length - 1);
      else if (activeIdx > idx) setActiveIdx(activeIdx - 1);
      return next;
    });
  }, [activeIdx]);

  const newTab = useCallback(() => {
    setPaletteSeed("");
    setPaletteOpen(true);
  }, []);

  // ───── Palette open ─────
  const openPalette = useCallback(async () => {
    let seed = "";
    try { if (navigator.clipboard?.readText) seed = await navigator.clipboard.readText(); } catch {}
    setPaletteSeed(tweaks.smartHints ? (seed || '') : '');
    setPaletteOpen(true);
  }, [tweaks.smartHints]);

  // ───── Global keybindings ─────
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
      // '/' opens palette unless typing
      if (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault(); openPalette(); return;
      }
      // ⌘1..9 jump to nth tool
      if (mod && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const t = TOOLS[parseInt(e.key) - 1];
        if (t) openTool(t.id);
      }
      if (mod && e.key.toLowerCase() === 't' && tweaks.showAdvanced) {
        e.preventDefault(); newTab();
      }
      if (mod && e.key.toLowerCase() === 'w' && multiTab) {
        e.preventDefault(); closeTab(activeIdx);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openPalette, openTool, multiTab, activeIdx, closeTab, tweaks.showAdvanced]);

  // when multiTab turns off, collapse to current active only
  useEffect(() => {
    if (!multiTab && tabs.length > 1) {
      setTabs([tabs[activeIdx]]);
      setActiveIdx(0);
    }
  }, [multiTab]);

  const renderContent = () => {
    if (pipeMode) return <PipeChain onLeave={() => setPipeMode(false)} toast={showToast}/>;
    if (!active) return null;
    if (active.special === 'home') {
      return <T.HomeTool openTool={openTool} openPalette={openPalette}/>;
    }
    const tool = getTool(active.toolId);
    if (!tool) return null;
    const Cmp = T[tool.cmp];
    return <Cmp toast={showToast}/>;
  };

  const crumb = pipeMode ? 'pipe.chain' : active?.special === 'home' ? 'home' : activeTool?.name.toLowerCase().replace(/\s+/g, '.');

  return (
    <div className="app" data-screen-label="Blutils main">
      <Sidebar activeId={pipeMode ? null : active?.toolId} openTool={openTool} openPalette={openPalette} openHome={openHome}/>

      <header className="header">
        <div className="crumb">
          <span className="home-tag" onClick={openHome}>blutils</span>
          <span className="sep">/</span>
          <b>{crumb}</b>
        </div>
        <div className="spacer"/>
        {tweaks.showAdvanced && (
          <>
            <button className={`h-btn ${multiTab ? 'on' : ''}`} onClick={() => setMultiTab(m => !m)}>
              <Icon name="plus" size={11}/> tabs
            </button>
            <button className={`h-btn ${pipeMode ? 'on' : ''}`} onClick={() => setPipeMode(p => !p)}>
              <Icon name="pipe" size={11}/> chain
            </button>
          </>
        )}
        <button className="h-btn" onClick={openPalette}>
          <Icon name="search" size={11}/> commands <span className="kbd">⌘K</span>
        </button>
      </header>

      <main className="main" data-screen-label={`tool:${active?.toolId || 'home'}`}>
        {multiTab && (
          <TabsBar
            tabs={tabs}
            activeIdx={activeIdx}
            onActivate={setActiveIdx}
            onClose={closeTab}
            onNew={newTab}
            onRename={(idx, name) => setTabs(t => t.map((tt, i) => i === idx ? { ...tt, customName: name || undefined } : tt))}
          />
        )}
        {pipeMode
          ? renderContent()
          : <div className="main-inner">{renderContent()}</div>
        }
      </main>

      <StatusBar
        tool={pipeMode ? null : activeTool}
        multiTab={multiTab}
        pipeMode={pipeMode}
        openPalette={openPalette}
        togglePipe={() => setPipeMode(p => !p)}
        toggleTabs={() => { if (tweaks.showAdvanced) setMultiTab(m => !m); else setTweak('showAdvanced', true); }}
      />

      {paletteOpen && (
        <Palette
          tools={TOOLS}
          paste={paletteSeed}
          onClose={() => setPaletteOpen(false)}
          onPickTool={(id, seed) => { openTool(id, seed); }}
          onAction={(id) => {
            setPaletteOpen(false);
            if (id === 'home') openHome();
            else if (id === 'toggle-tabs') { setTweak('showAdvanced', true); setMultiTab(m => !m); }
            else if (id === 'toggle-pipe') setPipeMode(p => !p);
            else if (id === 'toggle-theme') setTweak('theme', tweaks.theme === 'light' ? 'dark' : 'light');
            else if (id === 'copy-perma') showToast('Permalink copied');
          }}
        />
      )}

      {toast && <div className="toast" key={toast.key}>{toast.msg}</div>}

      <TweaksPanel>
        <TweakSection label="Appearance"/>
        <TweakRadio label="Theme" value={tweaks.theme}
                    options={['light','dark']}
                    onChange={(v) => setTweak('theme', v)}/>
        <TweakRadio label="Density" value={tweaks.density}
                    options={['compact','regular']}
                    onChange={(v) => setTweak('density', v)}/>
        <TweakSection label="Power-user features"/>
        <TweakToggle label="Show advanced controls" value={tweaks.showAdvanced}
                     onChange={(v) => setTweak('showAdvanced', v)}/>
        <TweakToggle label="Smart hints (clipboard detect)" value={tweaks.smartHints}
                     onChange={(v) => setTweak('smartHints', v)}/>
        <TweakSection label="Try it"/>
        <TweakButton label="Open command palette" onClick={openPalette}/>
        <TweakButton label="Open pipe chain" onClick={() => setPipeMode(true)}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
