import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from 'react';
import { evaluateFrame, type HudFrame } from '../core/evaluate';
import { DEMO_EPISODE, DEMO_LIBRARY } from '../core/demo';
import { CHANNELS, RAIL_STATES, newId, type ChannelId, type ChannelValues, type EpisodeDoc, type RailMotionId } from '../core/model';
import { removeKeyAt, upsertKey, type Track } from '../core/tracks';
import { formatTime, snapToFrame, type Ms } from '../core/time';
import { HudLayer, ScaledStage } from '../hud/HudLayer';
import { createClock, Samples } from './clock';
import './spike.css';

type MediaKind = 'image' | 'video';
interface MediaChoice { kind: MediaKind; url: string; name: string }

const PRESETS: readonly MediaChoice[] = [
  { kind: 'image', url: './test-media/backdrop-girona.jpg', name: 'Girona backdrop (crop of hudv2_2)' },
  { kind: 'image', url: './test-media/backdrop-grid.png', name: 'Neutral grid (pixel tests)' },
  { kind: 'video', url: './test-media/sync-counter-1080p30.webm', name: 'Frame-counter video (VP9)' },
];

const clock = createClock({ t: 0, playing: false });
const stats = { evaluate: new Samples(), render: new Samples(), frameGap: new Samples(), droppedVideoFrames: 0 };
let lastFrame: HudFrame | null = null;

const H264 = typeof document !== 'undefined' ? document.createElement('video').canPlayType('video/mp4; codecs="avc1.640028"') : '';

function withTrack<K extends ChannelId>(doc: EpisodeDoc, id: K, change: (track: Track<ChannelValues[K]>) => Track<ChannelValues[K]>): EpisodeDoc {
  return { ...doc, tracks: { ...doc.tracks, [id]: change(doc.tracks[id]) } };
}

/** The only component that re-renders on every playhead change. */
function HudView({ doc, onSector }: { doc: EpisodeDoc; onSector: (sector: number) => void }) {
  const { t } = useSyncExternalStore(clock.subscribe, clock.get);
  const renderStart = performance.now();
  const frame = useMemo(() => {
    const start = performance.now();
    const result = evaluateFrame(doc, DEMO_LIBRARY, t);
    stats.evaluate.push(performance.now() - start);
    return result;
  }, [doc, t]);
  lastFrame = frame;
  useLayoutEffect(() => { stats.render.push(performance.now() - renderStart); });
  return <HudLayer frame={frame} interaction={{ onSector }} />;
}

function Playhead({ duration }: { duration: Ms }) {
  const { t } = useSyncExternalStore(clock.subscribe, clock.get);
  return <i className="tl-playhead" style={{ left: `${(100 * t) / duration}%` }} />;
}

function Timecode({ fps }: { fps: number }) {
  const { t } = useSyncExternalStore(clock.subscribe, clock.get);
  return <span className="spike-timecode" data-testid="timecode">{formatTime(t, fps)}</span>;
}

function Timeline({ doc, seek }: { doc: EpisodeDoc; seek: (t: Ms) => void }) {
  const lanes = useRef<HTMLDivElement>(null);
  const scrubTo = (event: ReactPointerEvent) => {
    const rect = lanes.current?.getBoundingClientRect();
    if (!rect) return;
    seek(Math.round(Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)) * doc.durationMs));
  };
  const at = (t: Ms) => `${(100 * t) / doc.durationMs}%`;
  const ticks = Array.from({ length: Math.floor(doc.durationMs / 10_000) + 1 }, (_, i) => i * 10_000);
  return (
    <div className="spike-timeline">
      <div className="tl-labels">
        <span className="tl-label tl-head">TIMELINE · zone › component › child</span>
        {CHANNELS.map(channel => (
          <span className="tl-label" key={channel.id}>
            <b>{channel.zone}</b>{channel.component ? ` › ${channel.component}` : ''} › {channel.child}
            <small>{channel.interpolation}</small>
          </span>
        ))}
        {doc.overlays.map(overlay => (
          <span className="tl-label" key={overlay.id}><b>POV OVERLAYS</b> › {overlay.props.title}<small>clip</small></span>
        ))}
      </div>
      <div className="tl-lanes" ref={lanes}>
        <div
          className="tl-lane tl-ruler"
          data-testid="timeline-ruler"
          onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); scrubTo(event); }}
          onPointerMove={event => { if (event.buttons === 1) scrubTo(event); }}
        >
          {ticks.map(t => <span key={t} className="tl-tick" style={{ left: at(t) }}>{formatTime(t, doc.fps).slice(0, 5)}</span>)}
        </div>
        {CHANNELS.map(channel => (
          <div className="tl-lane" key={channel.id}>
            {(doc.tracks[channel.id] as Track<unknown>).map(key => (
              <button key={key.id} className="tl-key" style={{ left: at(key.t) }} title={`${formatTime(key.t, doc.fps)} · ${String(key.v)}`} onClick={() => seek(key.t)}>◆</button>
            ))}
          </div>
        ))}
        {doc.overlays.map(overlay => (
          <div className="tl-lane" key={overlay.id}>
            <button className="tl-clip" style={{ left: at(overlay.start), width: at(overlay.end - overlay.start) }} onClick={() => seek(overlay.start)}>{overlay.props.lines[0]}</button>
          </div>
        ))}
        <Playhead duration={doc.durationMs} />
      </div>
    </div>
  );
}

/** Values at the playhead. Editing creates or updates a key at the current frame. */
function AtPlayhead({ doc, setDoc }: { doc: EpisodeDoc; setDoc: (change: (doc: EpisodeDoc) => EpisodeDoc) => void }) {
  const { t } = useSyncExternalStore(clock.subscribe, clock.get);
  const at = snapToFrame(t, doc.fps);
  const frame = evaluateFrame(doc, DEMO_LIBRARY, t);
  const set = <K extends ChannelId>(id: K, v: ChannelValues[K]) => setDoc(d => withTrack(d, id, track => upsertKey(track, at, v, () => newId('key'))));
  const remove = (id: ChannelId) => setDoc(d => withTrack(d, id, track => removeKeyAt(track, at)));
  const keyed = (id: ChannelId) => (doc.tracks[id] as Track<unknown>).some(key => key.t === at);
  const del = (id: ChannelId) => <button className="spike-del" disabled={!keyed(id)} onClick={() => remove(id)} title="Delete key at playhead">×</button>;
  return (
    <div className="spike-inspector">
      <h3>AT {formatTime(t, doc.fps)}</h3>
      <label>LEFT RAIL · Panel State {del('left-rail.state')}</label>
      <div className="spike-seg">
        {RAIL_STATES.map(state => (
          <button key={state} data-testid={`rail-${state}`} className={frame.leftRail.state === state ? 'on' : ''} onClick={() => set('left-rail.state', state)}>{state}</button>
        ))}
      </div>
      <label>STAMINA · Value {del('stamina.value')}</label>
      <div className="spike-inline">
        <input type="range" min={0} max={100} value={Math.round(frame.stamina.value)} onChange={event => set('stamina.value', Number(event.target.value))} />
        <input data-testid="stamina-input" type="number" min={0} max={100} value={Math.round(frame.stamina.value)} onChange={event => set('stamina.value', Math.min(100, Math.max(0, Number(event.target.value))))} />
      </div>
      <label>PLAYER PROFILE · XP {del('player-profile.xp')}</label>
      <input type="number" min={0} value={Math.round(frame.player?.xp ?? 0)} onChange={event => set('player-profile.xp', Math.max(0, Number(event.target.value)))} />
      <label>GEAR RADIAL · Selected sector {del('gear-radial.selection')}</label>
      <div className="spike-seg">
        {[1, 2, 3, 4, 5].map(sector => (
          <button key={sector} className={frame.radial.selected === sector ? 'on' : ''} onClick={() => set('gear-radial.selection', sector)}>{sector}</button>
        ))}
      </div>
      <p className="spike-hint">Or click a sector on the HUD: the semantic action becomes a key at the playhead.</p>
      <label>PLAYER RECORD (episode constant)</label>
      <select value={doc.bindings.player ?? ''} onChange={event => setDoc(d => ({ ...d, bindings: { ...d.bindings, player: event.target.value || null } }))}>
        <option value="rec_player_jordi">JORDI</option>
        <option value="rec_player_arnau">ARNAU</option>
      </select>
      <label>LEFT RAIL MOTION (template: how)</label>
      <div className="spike-seg">
        {(['smooth-reveal', 'snap'] as RailMotionId[]).map(motion => (
          <button key={motion} className={doc.hud.leftRailMotion === motion ? 'on' : ''} onClick={() => setDoc(d => ({ ...d, hud: { ...d.hud, leftRailMotion: motion } }))}>{motion}</button>
        ))}
      </div>
    </div>
  );
}

function PerfPanel() {
  const [, force] = useState(0);
  useEffect(() => { const id = setInterval(() => force(n => n + 1), 500); return () => clearInterval(id); }, []);
  const gap = stats.frameGap.percentile(50);
  return (
    <div className="spike-perf" data-testid="perf">
      <div>UI fps <b>{gap ? (1000 / gap).toFixed(0) : '—'}</b> · worst frame <b>{stats.frameGap.max().toFixed(1)} ms</b></div>
      <div>evaluate p95 <b>{stats.evaluate.percentile(95).toFixed(3)} ms</b> · HUD render p95 <b>{stats.render.percentile(95).toFixed(2)} ms</b></div>
      <div>dropped video frames <b>{stats.droppedVideoFrames}</b> · H.264 in this browser <b>{H264 || 'no'}</b></div>
    </div>
  );
}

export function SpikeApp() {
  const [doc, setDocState] = useState<EpisodeDoc>(DEMO_EPISODE);
  const [media, setMedia] = useState<MediaChoice>(PRESETS[0]!);
  const [mediaReady, setMediaReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wallRef = useRef(0);
  const docRef = useRef(doc);
  docRef.current = doc;
  const mediaReadyRef = useRef(false);
  mediaReadyRef.current = mediaReady;
  const setDoc = useCallback((change: (doc: EpisodeDoc) => EpisodeDoc) => setDocState(change), []);

  const seek = useCallback((t: Ms) => {
    const clamped = Math.round(Math.min(docRef.current.durationMs, Math.max(0, t)));
    clock.set({ t: clamped });
    // Scrubbing moves the video too; while playing, the next presented frame takes over the clock.
    if (videoRef.current) videoRef.current.currentTime = clamped / 1000;
  }, []);

  const pause = useCallback(() => {
    clock.set({ playing: false });
    videoRef.current?.pause();
  }, []);

  const play = useCallback(() => {
    if (clock.get().playing) return;
    if (clock.get().t >= docRef.current.durationMs) seek(0);
    clock.set({ playing: true });
    const video = videoRef.current;
    let previous = 0;
    const onAnimationFrame = (now: number) => {
      if (!clock.get().playing) return;
      if (previous) stats.frameGap.push(now - previous);
      previous = now;
      if (!video) {
        const t = clock.get().t + (now - (wallRef.current || now));
        wallRef.current = now;
        if (t >= docRef.current.durationMs) { clock.set({ t: docRef.current.durationMs, playing: false }); return; }
        clock.set({ t: Math.round(t) });
      }
      requestAnimationFrame(onAnimationFrame);
    };
    wallRef.current = 0;
    requestAnimationFrame(onAnimationFrame);
    if (video) {
      // The video is the master clock: the HUD takes the media time of each presented frame.
      let lastPresented = -1;
      const onVideoFrame = (_now: number, meta: VideoFrameCallbackMetadata) => {
        if (!clock.get().playing) return;
        if (lastPresented >= 0 && meta.presentedFrames - lastPresented > 1) stats.droppedVideoFrames += meta.presentedFrames - lastPresented - 1;
        lastPresented = meta.presentedFrames;
        clock.set({ t: Math.round(meta.mediaTime * 1000) });
        video.requestVideoFrameCallback(onVideoFrame);
      };
      video.currentTime = clock.get().t / 1000;
      if ('requestVideoFrameCallback' in video) video.requestVideoFrameCallback(onVideoFrame);
      void video.play().catch(() => clock.set({ playing: false }));
      video.onended = () => clock.set({ playing: false });
    }
  }, [seek]);

  const onSector = useCallback((sector: number) => {
    const at = snapToFrame(clock.get().t, docRef.current.fps);
    setDoc(d => withTrack(d, 'gear-radial.selection', track => upsertKey(track, at, sector, () => newId('key'))));
  }, [setDoc]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
      const frameMs = 1000 / docRef.current.fps;
      if (event.code === 'Space') { event.preventDefault(); if (clock.get().playing) pause(); else play(); }
      if (event.code === 'ArrowRight') seek(clock.get().t + (event.shiftKey ? 1000 : frameMs));
      if (event.code === 'ArrowLeft') seek(clock.get().t - (event.shiftKey ? 1000 : frameMs));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [play, pause, seek]);

  useEffect(() => {
    Object.assign(window, {
      __spike: {
        seek, play, pause,
        time: () => clock.get().t,
        playing: () => clock.get().playing,
        frame: () => lastFrame,
        doc: () => docRef.current,
        setDoc: (next: EpisodeDoc) => setDocState(next),
        reset: () => setDocState(DEMO_EPISODE),
        loadMedia: (url: string, kind: MediaKind) => { setMediaReady(false); setMedia({ url, kind, name: url }); },
        mediaReady: () => mediaReadyRef.current,
        stats: () => ({
          evaluateP50: stats.evaluate.percentile(50), evaluateP95: stats.evaluate.percentile(95), evaluateMax: stats.evaluate.max(),
          renderP50: stats.render.percentile(50), renderP95: stats.render.percentile(95), renderMax: stats.render.max(), renders: stats.render.count,
          frameGapP50: stats.frameGap.percentile(50), frameGapP95: stats.frameGap.percentile(95), frameGapMax: stats.frameGap.max(),
          droppedVideoFrames: stats.droppedVideoFrames, h264: H264,
        }),
        resetStats: () => { stats.evaluate.reset(); stats.render.reset(); stats.frameGap.reset(); stats.droppedVideoFrames = 0; },
      },
    });
  }, [seek, play, pause]);
  const onFile = (file: File | undefined) => {
    if (!file || !/^(image|video)\//.test(file.type)) return;
    pause();
    setMediaReady(false);
    setMedia({ kind: file.type.startsWith('video/') ? 'video' : 'image', url: URL.createObjectURL(file), name: file.name });
  };

  return (
    <div className="spike">
      <header className="spike-bar">
        <strong>KOALITIC · H0 TECH SPIKE</strong>
        <button data-testid="play" onClick={() => (clock.get().playing ? pause() : play())}>PLAY / PAUSE</button>
        <Timecode fps={doc.fps} />
        <select value={PRESETS.some(p => p.url === media.url) ? media.url : ''} onChange={event => { const preset = PRESETS.find(p => p.url === event.target.value); if (preset) { pause(); setMediaReady(false); setMedia(preset); } }}>
          {!PRESETS.some(p => p.url === media.url) && <option value="">{media.name}</option>}
          {PRESETS.map(preset => <option key={preset.url} value={preset.url}>{preset.name}</option>)}
        </select>
        <label className="spike-file">LOAD YOUR VIDEO / IMAGE<input type="file" accept="video/*,image/*" onChange={event => onFile(event.target.files?.[0])} /></label>
        <button onClick={() => { pause(); setDocState(DEMO_EPISODE); seek(0); }}>RESET DEMO</button>
      </header>
      <main className="spike-main">
        <ScaledStage>
          {media.kind === 'image' ? (
            <img key={media.url} className="k-media" src={media.url} alt="" onLoad={() => setMediaReady(true)} />
          ) : (
            <video
              key={media.url}
              ref={videoRef}
              className="k-media"
              src={media.url}
              muted
              playsInline
              preload="auto"
              onLoadedMetadata={event => {
                const seconds = event.currentTarget.duration;
                if (Number.isFinite(seconds) && seconds > 0) setDocState(d => ({ ...d, durationMs: Math.max(1000, Math.round(seconds * 1000)) }));
                event.currentTarget.currentTime = clock.get().t / 1000;
              }}
              onCanPlay={() => setMediaReady(true)}
            />
          )}
          <HudView doc={doc} onSector={onSector} />
        </ScaledStage>
        <aside className="spike-side">
          <AtPlayhead doc={doc} setDoc={setDoc} />
          <PerfPanel />
          <div className="spike-help">
            <h3>CÓMO PROBAR</h3>
            <p>Carga tu MP4 con «LOAD YOUR VIDEO»: se abre en tu navegador y no se sube a ningún sitio.</p>
            <p>Espacio reproduce/pausa · ←/→ un fotograma · Shift+←/→ un segundo · arrastra la regla para buscar.</p>
            <p>Salta a 01:15: Stamina vale 90 aunque el Left Rail esté plegado. Ábrelo y lo verás.</p>
            <p>Esta prueba no guarda nada; el guardado real llega en H1.</p>
          </div>
        </aside>
      </main>
      <Timeline doc={doc} seek={seek} />
    </div>
  );
}
