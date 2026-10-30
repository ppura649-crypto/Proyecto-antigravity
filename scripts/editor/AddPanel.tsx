// The add panel, on the left: words, captions, your clips and pictures, sounds, and files from your computer. One
// click adds at the playhead; a drag puts it where you let go, on the video or on the timeline.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './icons';
import { allTextLooks, allCaptionLooks, type Look } from './looks';
import { fontStack, nearestWeight } from './fonts';

export type MediaEntry = { path: string; name: string; kind: 'video' | 'image' | 'audio'; group: string; url: string; size?: number };
export type Upload = { id: string; name: string; share: number; state: 'sending' | 'done' | 'error'; message?: string };
export type AddTab = 'text' | 'captions' | 'media' | 'sounds' | 'upload';

export const MEDIA_MIME = 'application/x-keyframes-media';

const TABS: { id: AddTab; label: string; icon: string }[] = [
  { id: 'media', label: 'Media', icon: 'media' },
  { id: 'text', label: 'Text', icon: 'text' },
  { id: 'captions', label: 'Captions', icon: 'captions' },
  { id: 'sounds', label: 'Sounds', icon: 'music' },
  { id: 'upload', label: 'Upload', icon: 'upload' },
];

export type AddPanelProps = {
  tab: AddTab | null; setTab: (tab: AddTab | null) => void;
  media: MediaEntry[]; uploads: Upload[];
  onAddMedia: (entries: MediaEntry[]) => void;
  onAddText: (look: Look) => void;
  onAddCaption: (look: Look) => void;
  onFiles: (files: File[]) => void;
};

export function AddRail({ tab, setTab }: { tab: AddTab | null; setTab: (t: AddTab | null) => void }) {
  return (
    <nav className="rail" aria-label="Add">
      {TABS.map((t) => (
        <button key={t.id} className={`rail-btn ${tab === t.id ? 'is-on' : ''}`} onClick={() => setTab(tab === t.id ? null : t.id)} aria-pressed={tab === t.id} data-tab={t.id}>
          <Icon name={t.icon} size={20} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function AddPanel(props: AddPanelProps) {
  const { tab } = props;
  if (!tab) return null;
  return (
    <aside className="add" aria-label={TABS.find((t) => t.id === tab)?.label}>
      <div className="add-top">
        <h2>{TABS.find((t) => t.id === tab)?.label}</h2>
        <button className="tool" onClick={() => props.setTab(null)} aria-label="Hide this panel" title="Hide this panel"><Icon name="panelLeft" /></button>
      </div>
      <div className="add-scroll">
        {tab === 'text' && <TextTab {...props} />}
        {tab === 'captions' && <CaptionTab {...props} />}
        {tab === 'media' && <MediaTab {...props} />}
        {tab === 'sounds' && <SoundTab {...props} />}
        {tab === 'upload' && <UploadTab {...props} />}
      </div>
    </aside>
  );
}

// A look drawn at a small size in its own font and colours, on the dark of a frame.
function LookTile({ look, text, onClick, tall }: { look: Look; text: string; onClick: () => void; tall?: boolean }) {
  const s = look.style;
  return (
    <button className={`preset ${tall ? 'tall' : ''}`} onClick={onClick} data-preset={look.id} title={`Add ${look.label}`}>
      <span className="preset-art">
        <span style={{
          fontFamily: fontStack(s.font), fontWeight: nearestWeight(s.font, s.weight), fontSize: Math.max(13, Math.min(26, (s.size ?? 64) / 3.4)),
          color: s.color ?? '#fff', background: s.background, textTransform: s.caps ? 'uppercase' : undefined,
          WebkitTextStroke: s.stroke ? `1.2px ${s.stroke}` : undefined, paintOrder: 'stroke fill', padding: s.background ? '2px 7px' : 0,
          textShadow: s.shadow && !s.background ? '0 1px 4px rgba(0,0,0,.6)' : undefined, lineHeight: 1.1,
        }}>
          {text.split(' ').map((w, i) => <span key={i} style={i === 1 && s.activeColor && s.animation !== 'karaoke' ? { color: s.activeColor } : undefined}>{i ? ' ' : ''}{w}</span>)}
        </span>
      </span>
      <span className="preset-name">{look.label}{look.installed && <em>Pack</em>}</span>
    </button>
  );
}

function TextTab({ onAddText }: AddPanelProps) {
  const looks = useMemo(allTextLooks, []);
  return (
    <>
      <p className="add-note">Click to add at the playhead.</p>
      <div className="presets">{looks.map((look) => <LookTile key={look.id} look={look} text={look.text ?? look.label} onClick={() => onAddText(look)} />)}</div>
    </>
  );
}

function CaptionTab({ onAddCaption }: AddPanelProps) {
  const looks = useMemo(allCaptionLooks, []);
  return (
    <>
      <p className="add-note">Adds captions at the playhead. Type the words on the right.</p>
      <div className="presets">{looks.map((look) => <LookTile key={look.id} look={look} text="Say it like this" onClick={() => onAddCaption(look)} tall />)}</div>
    </>
  );
}

export function MediaTile({ entry, onClick, draggable = true }: { entry: MediaEntry; onClick: () => void; draggable?: boolean }) {
  const thumb = entry.kind === 'image'
    ? <img src={entry.url} alt="" loading="lazy" draggable={false} />
    : <i className="strip" style={{ backgroundImage: `url(/api/edit/strip?path=${encodeURIComponent(entry.path)})` }} />;
  return (
    <button
      className="tile" onClick={onClick} title={`${entry.name}\nClick to add at the playhead, or drag it where you want it.`} data-media={entry.path}
      draggable={draggable}
      onDragStart={(e) => { e.dataTransfer.setData(MEDIA_MIME, JSON.stringify([entry])); e.dataTransfer.effectAllowed = 'copy'; }}
    >
      <span className="tile-art">{thumb}{entry.kind === 'video' && <b className="tile-kind"><Icon name="video" size={12} /></b>}</span>
      <span className="tile-name">{entry.name}</span>
    </button>
  );
}

const GROUP_NAME: Record<string, string> = { project: 'This video', yours: 'Your files', output: 'Finished videos' };

function MediaTab({ media, onAddMedia, setTab }: AddPanelProps) {
  const [filter, setFilter] = useState('');
  const shown = media.filter((m) => m.kind !== 'audio' && m.group !== 'sounds' && (!filter || m.name.toLowerCase().includes(filter.toLowerCase())));
  const groups = [...new Set(shown.map((m) => m.group))];
  return (
    <>
      {media.filter((m) => m.kind !== 'audio').length > 10 && <input className="search" placeholder="Find a file" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Find a file" />}
      {!shown.length && (
        <div className="add-empty">
          <p>No clips or pictures yet.</p>
          <button className="btn" onClick={() => setTab('upload')}><Icon name="upload" size={16} />Upload</button>
        </div>
      )}
      {groups.map((g) => (
        <section key={g} className="add-group">
          <h3>{GROUP_NAME[g] ?? g}</h3>
          <div className="tiles">{shown.filter((m) => m.group === g).map((m) => <MediaTile key={m.path} entry={m} onClick={() => onAddMedia([m])} />)}</div>
        </section>
      ))}
    </>
  );
}

// One shared player for previews, so starting one stops the last.
let preview: HTMLAudioElement | null = null;
function SoundTab({ media, onAddMedia }: AddPanelProps) {
  const [playing, setPlaying] = useState<string | null>(null);
  useEffect(() => () => { preview?.pause(); }, []);
  const play = (m: MediaEntry) => {
    if (!preview) preview = new Audio();
    if (playing === m.path) { preview.pause(); setPlaying(null); return; }
    preview.src = m.url;
    preview.currentTime = 0;
    preview.play().catch(() => setPlaying(null));
    preview.onended = () => setPlaying(null);
    setPlaying(m.path);
  };
  const sounds = media.filter((m) => m.kind === 'audio');
  const groups: [string, MediaEntry[]][] = [['Your sounds', sounds.filter((m) => m.group !== 'sounds')], ['Sound effects', sounds.filter((m) => m.group === 'sounds')]];
  return (
    <>
      {!sounds.length && <p className="add-note">No sounds yet. Upload music or a voice.</p>}
      {groups.filter(([, list]) => list.length).map(([title, list]) => (
        <section key={title} className="add-group">
          <h3>{title}</h3>
          <ul className="sounds">
            {list.map((m) => (
              <li key={m.path} draggable onDragStart={(e) => { e.dataTransfer.setData(MEDIA_MIME, JSON.stringify([m])); e.dataTransfer.effectAllowed = 'copy'; }} data-sound={m.path}>
                <button className={`tool ${playing === m.path ? 'is-on' : ''}`} onClick={() => play(m)} aria-label={playing === m.path ? 'Stop' : 'Listen'} title={playing === m.path ? 'Stop' : 'Listen'}><Icon name={playing === m.path ? 'stop' : 'play'} size={14} /></button>
                <span className="sound-name" title={m.name}>{m.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ')}</span>
                <button className="tool" onClick={() => onAddMedia([m])} aria-label={`Add ${m.name}`} title="Add at the playhead"><Icon name="plus" size={16} /></button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function UploadTab({ uploads, onFiles }: AddPanelProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <div className="dropzone" onClick={() => input.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && input.current?.click()}>
        <Icon name="upload" size={24} />
        <strong>Drop files anywhere</strong>
        <span>Clips, pictures and sounds. Or click to choose.</span>
        <input ref={input} type="file" multiple hidden accept="video/*,image/*,audio/*" name="Upload" onChange={(e) => { onFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
      </div>
      {uploads.length > 0 && (
        <ul className="uploads">
          {uploads.map((u) => (
            <li key={u.id} className={u.state}>
              <span className="up-name" title={u.name}>{u.name}</span>
              <span className="up-state">{u.state === 'sending' ? `${Math.round(u.share * 100)}%` : u.state === 'done' ? 'Added' : u.message}</span>
              <i className="bar"><b style={{ width: `${Math.round(u.share * 100)}%` }} /></i>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// A small window to pick another file of the same kind, for Replace.
export function MediaPicker({ media, kind, onPick, onClose }: { media: MediaEntry[]; kind: string; onPick: (m: MediaEntry) => void; onClose: () => void }) {
  const list = media.filter((m) => m.kind === kind);
  return (
    <div className="ed-modal" role="dialog" aria-modal="true" aria-label="Replace" onClick={onClose}>
      <div className="ed-dialog wide" onClick={(e) => e.stopPropagation()}>
        <h2>Replace with</h2>
        {list.length ? (
          <div className="tiles picker">{list.map((m) => kind === 'audio'
            ? <button key={m.path} className="btn" onClick={() => onPick(m)}>{m.name}</button>
            : <MediaTile key={m.path} entry={m} onClick={() => onPick(m)} draggable={false} />)}</div>
        ) : <p>No other files of this kind yet. Upload one first.</p>}
        <div className="ed-dialog-row"><button className="btn" onClick={onClose}>Cancel</button></div>
      </div>
    </div>
  );
}
