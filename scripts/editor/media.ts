// Pictures and sounds the timeline draws inside its clips: a filmstrip per video and a waveform per sound, each asked
// for once and kept for the session.
import { useEffect, useState } from 'react';

export const mediaUrl = (path: string) => '/media/' + path.split('/').map(encodeURIComponent).join('/');

const waves = new Map<string, Promise<{ rate: number; peaks: number[] } | null>>();
export function useWave(path?: string) {
  const [wave, setWave] = useState<{ rate: number; peaks: number[] } | null>(null);
  useEffect(() => {
    if (!path) return;
    if (!waves.has(path)) waves.set(path, fetch(`/api/edit/wave?path=${encodeURIComponent(path)}`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
    let live = true;
    waves.get(path)!.then((w) => live && setWave(w));
    return () => { live = false; };
  }, [path]);
  return wave;
}

const strips = new Map<string, Promise<{ url: string; tile: number } | null>>();
export const STRIP_FRAMES = 48;
export function useStrip(path?: string, start?: number, step?: number) {
  const [strip, setStrip] = useState<{ url: string; tile: number } | null>(null);
  useEffect(() => {
    setStrip(null);
    if (!path) return;
    const url = `/api/edit/strip?path=${encodeURIComponent(path)}${step == null ? '' : `&start=${start!.toFixed(4)}&step=${step.toFixed(4)}`}`;
    if (!strips.has(url)) {
      strips.set(url, new Promise((accept) => {
        const img = new Image();
        img.onload = () => accept({ url, tile: img.naturalWidth / STRIP_FRAMES });
        img.onerror = () => { strips.delete(url); accept(null); };
        img.src = url;
      }));
    }
    let live = true;
    strips.get(url)!.then((s) => live && setStrip(s));
    return () => { live = false; };
  }, [path, start, step]);
  return strip;
}

const sizes = new Map<string, Promise<{ w: number; h: number } | null>>();
export function imageSize(url: string) {
  if (!sizes.has(url)) sizes.set(url, new Promise((accept) => { const img = new Image(); img.onload = () => accept({ w: img.naturalWidth, h: img.naturalHeight }); img.onerror = () => accept(null); img.src = url; }));
  return sizes.get(url)!;
}

const probes = new Map<string, Promise<{ width: number; height: number } | null>>();
export function useMediaSize(path?: string) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    setSize(null); if (!path) return;
    if (!probes.has(path)) probes.set(path, fetch(`/api/edit/probe?path=${encodeURIComponent(path)}`).then(r => r.ok ? r.json() : null).catch(() => null));
    let live = true; probes.get(path)!.then(result => { if (live) setSize(result); });
    return () => { live = false; };
  }, [path]);
  return size;
}
