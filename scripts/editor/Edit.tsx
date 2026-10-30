// Edit: the composition that draws an edit document. The editor plays it in the Player and the export renders it, so
// what the buyer sees while editing is what the video becomes. It knows item types, never formats: clips, sounds,
// pictures, words, captions and graphics. A pack changes how words and captions look by registering a look, and draws
// its graphics with its own components; this file places everything in time and on the frame.
import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, Video, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { layers, textLooks } from 'keyframes-layers';
import type { Doc, Item, TextStyle, Transform } from './types';
import { fontStack, nearestWeight } from './fonts';
import { mediaBox, hasCrop } from './geometry.mjs';
import { CaptionItem } from './Captions';
import { motionAt } from './motion.mjs';
import { EditableContext } from './Editable';

export type EditProps = {
  doc: Doc;
  mode: 'player' | 'render';
  // Turns a workspace path into something the page can load. The editor serves /media/<path>; the export copies the
  // file into the render's public folder and uses staticFile.
  asset: (path: string) => string;
  // The export draws the untouched clip with ffmpeg and only the rest here, on a transparent frame, without sound.
  // The editor also skips words being typed on the stage, so only the typing shows.
  skip?: string[];
  silent?: boolean;
  transparent?: boolean;
};

const IDENTITY: Transform = { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 };

function fade(frame: number, item: Item) {
  const fadeIn = item.fadeIn ?? 0;
  const fadeOut = item.fadeOut ?? 0;
  let value = 1;
  if (fadeIn > 0) value = Math.min(value, interpolate(frame, [0, fadeIn], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  if (fadeOut > 0) value = Math.min(value, interpolate(frame, [item.durationInFrames - fadeOut, item.durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  return value;
}

// Where an item sits: its own drawing, moved, turned and scaled about its origin. The stage's handles and the inline
// word editor use this same CSS, so the player, the export and the handles always agree.
export function placementCss(item: Item, doc: Doc): React.CSSProperties {
  const t = { ...IDENTITY, ...item.transform };
  const originX = t.originX ?? doc.width / 2;
  const originY = t.originY ?? doc.height / 2;
  const moved = t.x || t.y || t.scale !== 1 || t.rotation;
  return { transformOrigin: `${originX}px ${originY}px`, transform: moved ? `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scale})` : undefined };
}

const Placed: React.FC<{ item: Item; doc: Doc; children: React.ReactNode }> = ({ item, doc, children }) => {
  const frame = useCurrentFrame();
  const opacity = (item.transform?.opacity ?? 1) * fade(frame, item);
  const motion = motionAt(item, frame, doc.height);
  return (
    <AbsoluteFill data-item={item.id} data-type={item.type} style={{ opacity, ...placementCss(item, doc), pointerEvents: 'none' }}>
      <AbsoluteFill data-motion={item.motion?.preset} style={motion}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// A crop hides the edges of a picture or clip and keeps its box where it was.
const cropCss = (item: Item): React.CSSProperties => {
  if (!hasCrop(item.crop)) return {};
  const c = item.crop!;
  const p = (v: number) => `${(v * 100).toFixed(3)}%`;
  return { clipPath: `inset(${p(c.t)} ${p(c.r)} ${p(c.b)} ${p(c.l)})` };
};

// Rounded corners, in frame pixels, for a clip or picture set in a window (a beat montage's frame, a scroll reel's
// card). Kept when the picture is cropped, so the visible edge stays round.
const roundCss = (item: Item): React.CSSProperties => {
  const r = item.radius ?? 0;
  if (!(r > 0)) return {};
  if (!hasCrop(item.crop)) return { borderRadius: r };
  const c = item.crop!;
  const p = (v: number) => `${(v * 100).toFixed(3)}%`;
  return { clipPath: `inset(${p(c.t)} ${p(c.r)} ${p(c.b)} ${p(c.l)} round ${r}px)` };
};

const boxCss = (item: Item, doc: Doc): React.CSSProperties => {
  const b = mediaBox(item, doc);
  return { position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, objectFit: item.fit ?? (item.type === 'image' ? 'contain' : 'cover'), ...cropCss(item), ...roundCss(item) };
};

const Media: React.FC<{ item: Item; props: EditProps; muted: boolean }> = ({ item, props, muted }) => {
  const frame = useCurrentFrame();
  const volume = muted || props.silent ? 0 : (item.volume ?? 1) * fade(frame, item);
  const src = props.asset(props.mode === 'player' && item.preview ? item.preview : item.src!);
  const common = { src, trimBefore: item.trimStart ?? 0, playbackRate: item.speed ?? 1, volume };
  if (item.type === 'audio') return props.silent || muted ? null : <Audio {...common} />;
  const style = boxCss(item, props.doc);
  return props.mode === 'render'
    ? <OffthreadVideo {...common} muted={volume === 0} style={style} />
    // The editor's clock never waits on a clip. A long-GOP file seeked mid-GOP takes hundreds of milliseconds to
    // decode; holding the player for it (pauseWhenBuffering) made play after a seek show Pause with a frozen frame.
    // The picture catches up on its own; the export renders frame by frame and never buffers.
    : <Video {...common} muted={volume === 0} style={style} pauseWhenBuffering={false} />;
};

const Picture: React.FC<{ item: Item; props: EditProps }> = ({ item, props }) => <Img src={props.asset(item.src!)} style={boxCss(item, props.doc)} />;

// Words as the editor's own look draws them. Shared by Words, the captions and the stage's inline editor.
export function wordsCss(s: TextStyle, doc: Doc): React.CSSProperties {
  const size = s.size ?? 72;
  return {
    maxWidth: doc.width * (s.maxWidth ?? 0.84),
    fontFamily: fontStack(s.font),
    fontSize: size,
    fontWeight: nearestWeight(s.font, s.weight),
    lineHeight: 1.12,
    color: s.color ?? '#FFFFFF',
    textAlign: s.align ?? 'center',
    textTransform: s.caps ? 'uppercase' : undefined,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    padding: s.background ? `${size * 0.18}px ${size * 0.34}px` : 0,
    background: s.background || undefined,
    WebkitTextStroke: s.stroke ? `${Math.max(2, size / 16)}px ${s.stroke}` : undefined,
    paintOrder: 'stroke fill',
    textShadow: s.shadow === false || s.background ? undefined : '0 2px 10px rgba(0,0,0,.55)',
  };
}

// Words placed by hand, centred where the transform puts them, drawn by the look they wear.
const Words: React.FC<{ item: Item; props: EditProps }> = ({ item, props }) => {
  const frame = useCurrentFrame();
  const style = item.style ?? {};
  const Look = style.look ? textLooks[style.look]?.draw : null;
  if (Look) return <Look item={item} doc={props.doc} asset={props.asset} mode={props.mode} frame={frame} text={item.text ?? ''} style={style} />;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={wordsCss(style, props.doc)}>{item.text}</div>
    </AbsoluteFill>
  );
};

const Unknown: React.FC<{ item: Item }> = ({ item }) => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ font: '600 34px sans-serif', color: '#fff', background: 'rgba(222,60,24,.85)', padding: '10px 18px' }}>
      {item.label || item.renderer} needs a pack that is not installed
    </div>
  </AbsoluteFill>
);

function Graphic({ item, props }: { item: Item; props: EditProps }) {
  const frame = useCurrentFrame();
  // A pack may register '<format>/*' to draw any of its kinds this bundle lacks (a project's own graphic, say).
  const Layer = (layers[item.renderer!] ?? (layers as any)[`${item.renderer!.split('/')[0]}/*`])?.draw;
  if (!Layer && props.mode === 'render') throw new Error(`${item.label || item.renderer} needs its drawing pack before export.`);
  if (!Layer) return <Unknown item={item} />;
  return <EditableContext.Provider value={{ item, frame, asset: props.asset }}><Layer item={item} doc={props.doc} asset={props.asset} mode={props.mode} /></EditableContext.Provider>;
}

// In the editor, one item that fails to draw shows a note in its place and the rest of the video keeps playing. The
// export has no guard: a render that cannot draw an item fails, and says which.
class Guard extends React.Component<{ item: Item; children: React.ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) { return { error: error.message }; }
  componentDidUpdate(previous: { item: Item }) { if (previous.item !== this.props.item && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div title={this.state.error} style={{ font: '600 30px sans-serif', color: '#fff', background: 'rgba(222,60,24,.85)', padding: '10px 18px', maxWidth: '80%', textAlign: 'center' }}>
          {this.props.item.label || 'This graphic'} could not be drawn here
        </div>
      </AbsoluteFill>
    );
  }
}

// Graphics and captions draw on their own clock: a trimmed start skips into them rather than squeezing them.
const OwnClock: React.FC<{ item: Item; children: React.ReactNode }> = ({ item, children }) => (
  <Sequence from={-(item.trimStart ?? 0)} layout="none">{children}</Sequence>
);

const MaybeGuard: React.FC<{ item: Item; mode: 'player' | 'render'; children: React.ReactNode }> = ({ item, mode, children }) =>
  mode === 'player' ? <Guard item={item}>{children}</Guard> : <>{children}</>;

export const Edit: React.FC<EditProps> = (props) => {
  const { doc } = props;
  const { fps } = useVideoConfig();
  const skip = useMemo(() => new Set(props.skip ?? []), [props.skip]);
  const hidden = new Set(doc.tracks.filter((t) => t.hidden).map((t) => t.id));
  const muted = new Set(doc.tracks.filter((t) => t.muted).map((t) => t.id));
  // The first track is drawn on top, so tracks are painted from the last to the first.
  const order = new Map(doc.tracks.map((t, i) => [t.id, doc.tracks.length - i]));
  const visual = doc.items
    // An item its format cannot draw here (missing) is left out of the export; the editor still shows its note.
    .filter((i) => i.type !== 'audio' && !hidden.has(i.track) && !skip.has(i.id) && !(props.mode === 'render' && i.missing))
    .sort((a, b) => (order.get(a.track) ?? 0) - (order.get(b.track) ?? 0));
  const sound = doc.items.filter((i) => i.type === 'audio' && !skip.has(i.id));
  return (
    <AbsoluteFill style={{ background: props.transparent ? 'transparent' : doc.background ?? '#000' }}>
      {visual.map((item) => (
        <Sequence key={item.id} from={item.from} durationInFrames={item.durationInFrames} layout="none" name={item.label || item.type}>
          <Placed item={item} doc={doc}>
            <MaybeGuard item={item} mode={props.mode}>
            {item.type === 'video' ? <Media item={item} props={props} muted={muted.has(item.track)} />
              : item.type === 'image' ? <Picture item={item} props={props} />
              : item.type === 'text' ? <Words item={item} props={props} />
              : item.type === 'caption' ? <OwnClock item={item}><CaptionItem item={item} doc={doc} asset={props.asset} mode={props.mode} fps={fps} /></OwnClock>
              : item.type === 'layer' ? <OwnClock item={item}><Graphic item={item} props={props} /></OwnClock>
              : null}
            </MaybeGuard>
          </Placed>
        </Sequence>
      ))}
      {sound.map((item) => (
        <Sequence key={item.id} from={item.from} durationInFrames={item.durationInFrames} layout="none" name={item.label || 'sound'}>
          <Media item={item} props={props} muted={muted.has(item.track)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
