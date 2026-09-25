import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { formatTime } from '../core/time';
import type { Key, Track } from '../core/tracks';
import { BACKGROUND, useKit } from '../design/TokensProvider';
import type { HudItem } from '../hud/registry';
import { HudCanvas } from '../hud/v2/HudCanvas';
import { BrandLogo } from '../ui/BrandLogo';
import { sfx } from '../ui/sfx';
import { GEAR_SLOTS, PLAYER_RECORD, RAIL_MODULES } from '../screens/catalog/samples';
import { EPISODE_FPS, TRACK_DEFS, deleteKey, demoEpisode, moveKey, railInput, setKey, snap, valueAt, type EpisodeDoc, type TrackDef, type TrackId } from './episode';
import './editor.css';

/**
 * EPISODE EDITOR (first slice). A background image, the Left Rail HUD on top
 * and a timeline organised zone → component → property. Change a value in the
 * inspector and it becomes a keyframe at the playhead; keyframes can be
 * selected, dragged (snapping to frames) and deleted; play and scrub show the
 * HUD at any instant (the HUD is a pure function of time).
 */
const VIEW = { w: 1152, h: 648 };
const EPISODE_W = 1920;
const VIEW_SCALE = VIEW.w / EPISODE_W;
/** Rail placement in episode pixels (1920×1080). */
const RAIL_PLACE = { x: 60, y: 56, scale: 1.7 };
const LABEL_W = 300;
const DRAFT = 'koalitic.editor.draft.v1';

type Selection = { track: TrackId; keyId: string } | null;

declare global {
  interface Window { __kgEditor?: { seek(ms: number): void; doc(): EpisodeDoc; time(): number } }
}

function initialDoc(): EpisodeDoc {
  const demo = demoEpisode(BACKGROUND, PLAYER_RECORD, RAIL_MODULES, GEAR_SLOTS);
  try {
    const raw = localStorage.getItem(DRAFT);
    if (raw) {
      const saved = JSON.parse(raw) as EpisodeDoc;
      if (saved.version === 1 && saved.tracks) return { ...demo, ...saved, background: saved.background?.startsWith('blob:') ? BACKGROUND : saved.background, player: demo.player, modules: demo.modules, slots: demo.slots };
    }
  } catch {
    // No draft or storage blocked: open the demo.
  }
  return demo;
}

function keyLabel(def: TrackDef, key: Key<unknown>, doc: EpisodeDoc): string {
  if (def.kind === 'bool') return key.v ? 'IN' : 'OUT';
  if (def.kind === 'module') return key.v ? (doc.modules.find(m => m.id === key.v)?.label ?? String(key.v)) : 'NONE';
  if (def.kind === 'slot') return doc.slots[key.v as number]?.name.split(' ')[0] ?? String(key.v);
  return String(key.v);
}

export function EpisodeEditor({ onBack }: { onBack: () => void }) {
  const { theme, motion } = useKit();
  const [doc, setDoc] = useState<EpisodeDoc>(initialDoc);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selection, setSelection] = useState<Selection>(null);
  const past = useRef<EpisodeDoc[]>([]);
  const future = useRef<EpisodeDoc[]>([]);
  const [, bump] = useState(0);
  const docRef = useRef(doc);
  docRef.current = doc;
  const tRef = useRef(t);
  tRef.current = t;

  /**
   * Apply an edit. History keeps the state before it: `true` records the current
   * doc, a doc records that one (a drag records its starting doc once), `false` records nothing.
   */
  const commit = useCallback((next: EpisodeDoc, record: boolean | EpisodeDoc = true) => {
    if (record) {
      past.current.push(record === true ? docRef.current : record);
      if (past.current.length > 100) past.current.shift();
      future.current = [];
    }
    setDoc(next);
    bump(n => n + 1);
  }, []);
  const undo = () => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(docRef.current);
    setDoc(prev);
    setSelection(null);
    bump(n => n + 1);
  };
  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(docRef.current);
    setDoc(next);
    bump(n => n + 1);
  };

  // Draft in this browser (not the project save, which comes with the Data Library).
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT, JSON.stringify(doc));
    } catch {
      // Not saved; editing still works.
    }
  }, [doc]);

  // Playback: real time drives the playhead; the HUD only reads t.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last: number | null = performance.now();
    // Own position: never read back the playhead from React, or slow frames lose time.
    let pos = tRef.current;
    const tick = (now: number) => {
      if (last !== null) {
        pos += now - last;
        const next = pos;
        if (next >= docRef.current.durationMs) {
          setT(docRef.current.durationMs);
          setPlaying(false);
          return;
        }
        setT(next);
      }
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const seek = useCallback((ms: number) => {
    setPlaying(false);
    setT(Math.max(0, Math.min(docRef.current.durationMs, snap(ms))));
  }, []);
  const togglePlay = () => {
    sfx.unlock();
    if (!playing && tRef.current >= doc.durationMs) setT(0);
    setPlaying(p => !p);
  };

  const at = snap(t);
  const setValue = <V,>(id: TrackId, v: V) => {
    const next = setKey(docRef.current, id, at, v);
    commit(next);
    const key = (next.tracks[id] as Track<unknown>).find(x => x.t === at);
    if (key) setSelection({ track: id, keyId: key.id });
  };
  const deleteSelected = () => {
    if (!selection) return;
    commit(deleteKey(docRef.current, selection.track, selection.keyId));
    setSelection(null);
  };
  const allKeyTimes = [...new Set(TRACK_DEFS.flatMap(def => (doc.tracks[def.id] as Track<unknown>).map(k => k.t)))].sort((a, b) => a - b);
  const jumpKey = (dir: 1 | -1) => {
    const target = dir > 0 ? allKeyTimes.find(x => x > at) : [...allKeyTimes].reverse().find(x => x < at);
    if (target !== undefined) seek(target);
  };

  useEffect(() => {
    window.__kgEditor = { seek, doc: () => docRef.current, time: () => tRef.current };
    return () => { delete window.__kgEditor; };
  }, [seek]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const frame = 1000 / EPISODE_FPS;
      if (event.key === ' ') { event.preventDefault(); togglePlay(); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); seek(tRef.current + (event.shiftKey ? 1000 : frame)); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); seek(tRef.current - (event.shiftKey ? 1000 : frame)); }
      else if (event.key === 'Home') seek(0);
      else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); deleteSelected(); }
      else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
      else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); }
      else if (event.key === 'Escape') { if (selection) setSelection(null); else onBack(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const input = railInput(doc);
  const items: HudItem[] = [{ key: 'rail', kind: 'rail', t, input, x: RAIL_PLACE.x * VIEW_SCALE, y: RAIL_PLACE.y * VIEW_SCALE, scale: RAIL_PLACE.scale * VIEW_SCALE }];
  const selectedDef = selection ? TRACK_DEFS.find(d => d.id === selection.track) : null;
  const selectedKey = selection ? (doc.tracks[selection.track] as Track<unknown>).find(x => x.id === selection.keyId) : undefined;
  const hasKeyHere = (id: TrackId) => (doc.tracks[id] as Track<unknown>).some(x => x.t === at);

  const loadImage = (file: File | undefined) => {
    if (!file) return;
    commit({ ...docRef.current, background: URL.createObjectURL(file) });
  };

  return (
    <div className="ed" data-testid="screen-episodes">
      <BrandLogo small className="ed__brand" />
      <header className="ed__head">
        <h1>EPISODE EDITOR</h1>
        <span className="ed__name">{doc.name}</span>
        <div className="ed__actions">
          <label className="ed__btn">LOAD IMAGE<input type="file" accept="image/*" onChange={e => loadImage(e.target.files?.[0])} data-testid="editor-image" /></label>
          <button type="button" className="ed__btn" onClick={undo} disabled={past.current.length === 0} data-testid="editor-undo">UNDO</button>
          <button type="button" className="ed__btn" onClick={redo} disabled={future.current.length === 0} data-testid="editor-redo">REDO</button>
          <button type="button" className="ed__btn" onClick={() => { commit(demoEpisode(BACKGROUND, PLAYER_RECORD, RAIL_MODULES, GEAR_SLOTS)); setSelection(null); seek(0); }} data-testid="editor-reset">RESET DEMO</button>
          <button type="button" className="ed__btn ed__btn--back" onClick={() => { sfx.unlock(); sfx.back(); onBack(); }} data-testid="screen-back">← BACK</button>
        </div>
      </header>

      <div className="ed__viewer" style={{ width: VIEW.w, height: VIEW.h }} data-testid="editor-viewer">
        <HudCanvas width={VIEW.w} height={VIEW.h} background={doc.background} items={items} theme={theme} motion={motion} />
        <span className="ed__safe" />
      </div>

      <aside className="ed__inspector" data-testid="editor-inspector">
        <div className="ed__insp-head">
          <span>INSPECTOR</span>
          <b>{formatTime(at, EPISODE_FPS)}</b>
        </div>
        <p className="ed__hint">Changing a value sets a keyframe at the playhead (◆ = key here).</p>
        <Field label="RAIL · ON SCREEN" keyed={hasKeyHere('rail.visible')}>
          {[true, false].map(v => (
            <button type="button" key={String(v)} className={valueAt(doc.tracks['rail.visible'], at, false) === v ? 'is-on' : ''} onClick={() => setValue('rail.visible', v)} data-testid={`insp-visible-${v ? 'in' : 'out'}`}>{v ? 'IN' : 'OUT'}</button>
          ))}
        </Field>
        <Field label="RAIL · OPEN MODULE" keyed={hasKeyHere('rail.selected')}>
          {[{ id: '', label: 'NONE' }, ...doc.modules].map(m => (
            <button type="button" key={m.id || 'none'} className={valueAt(doc.tracks['rail.selected'], at, '') === m.id ? 'is-on' : ''} onClick={() => setValue('rail.selected', m.id)} data-testid={`insp-module-${m.id || 'none'}`}>{m.label}</button>
          ))}
        </Field>
        <Field label="PLAYER · XP" keyed={hasKeyHere('player.xp')}>
          <input key={`xp-${at}-${valueAt(doc.tracks['player.xp'], at, 0)}`} type="number" min={0} step={10} defaultValue={valueAt(doc.tracks['player.xp'], at, 0)} onKeyDown={e => { if (e.key === 'Enter') setValue('player.xp', Number(e.currentTarget.value)); }} onBlur={e => { const v = Number(e.target.value); if (Number.isFinite(v) && v !== valueAt(doc.tracks['player.xp'], at, 0)) setValue('player.xp', v); }} data-testid="insp-xp" />
          <button type="button" onClick={() => setValue('player.xp', valueAt(doc.tracks['player.xp'], at, 0) + 150)} data-testid="insp-xp-plus">+150</button>
        </Field>
        <Field label="GEAR RADIAL · SELECTED" keyed={hasKeyHere('gear.selection')}>
          {doc.slots.map((slot, i) => (
            <button type="button" key={slot.name} className={valueAt(doc.tracks['gear.selection'], at, 0) === i ? 'is-on' : ''} onClick={() => setValue('gear.selection', i)} data-testid={`insp-slot-${i}`}>{slot.name}</button>
          ))}
        </Field>
        <Field label={`STAMINA · ${valueAt(doc.tracks['stamina.value'], at, 0)} %`} keyed={hasKeyHere('stamina.value')}>
          <input type="range" min={0} max={100} step={1} key={`st-${at}`} defaultValue={valueAt(doc.tracks['stamina.value'], at, 0)} onPointerUp={e => setValue('stamina.value', Number(e.currentTarget.value))} onKeyUp={e => setValue('stamina.value', Number(e.currentTarget.value))} data-testid="insp-stamina" />
        </Field>

        <div className="ed__selected" data-testid="editor-selected">
          {selectedDef && selectedKey ? (
            <>
              <span>SELECTED KEY · {selectedDef.component} · {selectedDef.property}</span>
              <b>{formatTime(selectedKey.t, EPISODE_FPS)} · {keyLabel(selectedDef, selectedKey, doc)}</b>
              <button type="button" onClick={deleteSelected} disabled={(doc.tracks[selectedDef.id] as Track<unknown>).length <= 1} data-testid="editor-delete-key">DELETE KEY</button>
            </>
          ) : (
            <span className="is-empty">Click a keyframe to select it · drag to move · Delete to remove</span>
          )}
        </div>
      </aside>

      <div className="ed__transport">
        <button type="button" onClick={() => seek(0)} title="Start (Home)">⏮</button>
        <button type="button" onClick={() => jumpKey(-1)} title="Previous key" data-testid="editor-prev-key">◆◀</button>
        <button type="button" onClick={() => seek(t - 1000 / EPISODE_FPS)} title="Previous frame (←)">◀</button>
        <button type="button" className="ed__play" onClick={togglePlay} data-testid="editor-play">{playing ? '❚❚ PAUSE' : '▶ PLAY'}</button>
        <button type="button" onClick={() => seek(t + 1000 / EPISODE_FPS)} title="Next frame (→)">▶</button>
        <button type="button" onClick={() => jumpKey(1)} title="Next key" data-testid="editor-next-key">▶◆</button>
        <span className="ed__time" data-testid="editor-time">{formatTime(t, EPISODE_FPS)} / {formatTime(doc.durationMs, EPISODE_FPS)}</span>
        <span className="ed__keys-help">SPACE ▶ · ←/→ frame · 2× click lane: key · DEL · CTRL+Z</span>
      </div>

      <Timeline doc={doc} t={t} selection={selection} onSeek={seek} onSelect={setSelection} commit={commit} onAdd={(id, ms) => {
        seek(ms);
        const v = valueAt(doc.tracks[id] as Track<unknown>, snap(ms), undefined);
        const next = setKey(docRef.current, id, ms, v);
        commit(next);
        const key = (next.tracks[id] as Track<unknown>).find(x => x.t === snap(ms));
        if (key) setSelection({ track: id, keyId: key.id });
      }} />
    </div>
  );
}

function Field({ label, keyed, children }: { label: string; keyed: boolean; children: ReactNode }) {
  return (
    <div className="ed__field">
      <div className="ed__field-label"><i className={keyed ? 'is-keyed' : ''}>{keyed ? '◆' : '◇'}</i>{label}</div>
      <div className="ed__field-ctl">{children}</div>
    </div>
  );
}

interface TimelineProps {
  readonly doc: EpisodeDoc;
  readonly t: number;
  readonly selection: Selection;
  onSeek(ms: number): void;
  onSelect(s: Selection): void;
  commit(doc: EpisodeDoc, record?: boolean | EpisodeDoc): void;
  onAdd(id: TrackId, ms: number): void;
}

function Timeline({ doc, t, selection, onSeek, onSelect, commit, onAdd }: TimelineProps) {
  const lanes = useRef<HTMLDivElement>(null);
  const drag = useRef<{ track: TrackId; keyId: string; base: EpisodeDoc } | null>(null);
  const timeAt = (clientX: number) => {
    const rect = lanes.current!.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * doc.durationMs;
  };
  const pct = (ms: number) => `${(ms / doc.durationMs) * 100}%`;

  const scrub = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    onSeek(timeAt(event.clientX));
  };
  const onKeyDown = (event: ReactPointerEvent<HTMLButtonElement>, track: TrackId, keyId: string, keyT: number) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelect({ track, keyId });
    onSeek(keyT);
    drag.current = { track, keyId, base: doc };
  };
  const onKeyMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const ms = timeAt(event.clientX);
    commit(moveKey(d.base, d.track, d.keyId, ms), false);
    onSeek(ms);
  };
  const onKeyUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    // Record the whole drag as one undo step.
    const moved = (doc.tracks[d.track] as Track<unknown>).find(x => x.id === d.keyId);
    const before = (d.base.tracks[d.track] as Track<unknown>).find(x => x.id === d.keyId);
    if (moved && before && moved.t !== before.t) commit(doc, d.base);
  };

  const seconds = Math.floor(doc.durationMs / 1000);
  let lastZone = '';
  let lastComponent = '';
  return (
    <section className="ed__timeline" data-testid="editor-timeline">
      <div className="ed__tl-row ed__tl-ruler-row">
        <div className="ed__tl-label">TIMELINE · {formatTime(t, EPISODE_FPS)}</div>
        <div className="ed__tl-ruler" onPointerDown={scrub} onPointerMove={e => { if (e.buttons) onSeek(timeAt(e.clientX)); }} data-testid="editor-ruler">
          {Array.from({ length: seconds + 1 }, (_, s) => (
            <span key={s} className={s % 5 === 0 ? 'is-major' : ''} style={{ left: pct(s * 1000) }}>{s % 5 === 0 ? `${s}s` : ''}</span>
          ))}
        </div>
      </div>
      <div className="ed__tl-body">
        <div className="ed__tl-playhead" style={{ left: `calc(${LABEL_W}px + (100% - ${LABEL_W}px) * ${t / doc.durationMs})` }} />
        {TRACK_DEFS.map(def => {
          const zoneHead = def.zone !== lastZone ? def.zone : '';
          const compHead = def.component !== lastComponent ? def.component : '';
          lastZone = def.zone;
          lastComponent = def.component;
          const track = doc.tracks[def.id] as Track<unknown>;
          return (
            <div className="ed__tl-row" key={def.id}>
              <div className="ed__tl-label">
                <small>{zoneHead}</small>
                <b>{compHead}</b>
                <span>{def.property}</span>
              </div>
              <div
                className="ed__tl-lane"
                ref={def.id === TRACK_DEFS[0]!.id ? lanes : undefined}
                onPointerDown={e => { if (e.target === e.currentTarget) { onSelect(null); scrub(e); } }}
                onPointerMove={e => { if (e.buttons && e.target === e.currentTarget) onSeek(timeAt(e.clientX)); }}
                onDoubleClick={e => onAdd(def.id, timeAt(e.clientX))}
                data-testid={`lane-${def.id}`}
              >
                {track.map((key, i) => {
                  const next = track[i + 1];
                  const selected = selection?.keyId === key.id;
                  return (
                    <span key={key.id}>
                      {def.kind !== 'number' && (
                        <i className={`ed__tl-span${def.kind === 'bool' && !key.v ? ' is-off' : ''}${def.kind === 'module' && !key.v ? ' is-off' : ''}`} style={{ left: pct(key.t), width: pct((next?.t ?? doc.durationMs) - key.t) }} />
                      )}
                      <button
                        type="button"
                        className={`ed__key${selected ? ' is-selected' : ''}`}
                        style={{ left: pct(key.t) }}
                        onPointerDown={e => onKeyDown(e, def.id, key.id, key.t)}
                        onPointerMove={onKeyMove}
                        onPointerUp={onKeyUp}
                        title={`${formatTime(key.t, EPISODE_FPS)} · ${keyLabel(def, key, doc)}`}
                        data-testid={`key-${def.id}-${i}`}
                      >
                        <em>{keyLabel(def, key, doc)}</em>
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
