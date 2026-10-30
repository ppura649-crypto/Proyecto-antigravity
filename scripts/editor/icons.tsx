// Line icons, 20 px, drawn on a 24 grid with a 1.6 stroke so they sit with Archivo's weight.
import React from 'react';

const paths: Record<string, React.ReactNode> = {
  back: <path d="M15 5l-7 7 7 7" />,
  play: <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none" />,
  pause: <><rect x="6.5" y="5" width="3.6" height="14" fill="currentColor" stroke="none" /><rect x="13.9" y="5" width="3.6" height="14" fill="currentColor" stroke="none" /></>,
  split: <><circle cx="6" cy="7" r="2.6" /><circle cx="6" cy="17" r="2.6" /><path d="M8.2 8.6L20 18M8.2 15.4L20 6" /></>,
  trash: <><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" /><path d="M16 8V4H4v12h4" /></>,
  undo: <><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 010 12h-3" /></>,
  redo: <><path d="M15 14l5-5-5-5" /><path d="M20 9H10a6 6 0 000 12h3" /></>,
  magnet: <><path d="M5 4v8a7 7 0 0014 0V4" /><path d="M5 8h4M15 8h4" /><path d="M9 4v8a3 3 0 006 0V4" /></>,
  zoomIn: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6" /></>,
  zoomOut: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21M7.5 10.5h6" /></>,
  fit: <><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></>,
  text: <><path d="M5 6V4h14v2M12 4v16M9 20h6" /></>,
  media: <><rect x="3" y="5" width="18" height="14" /><path d="M3 15l5-5 4 4 3-3 6 6" /><circle cx="16.5" cy="9" r="1.4" /></>,
  sound: <><path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 5.6A10 10 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 01-2.9 3.6M6.4 6.9C3.9 8.7 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 004.1-1" /></>,
  speaker: <><path d="M4 9.5h4l5-4.5v14l-5-4.5H4z" /><path d="M16.5 9a4 4 0 010 6M19 6.5a7.5 7.5 0 010 11" /></>,
  mute: <><path d="M4 9.5h4l5-4.5v14l-5-4.5H4z" /><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  unlock: <><rect x="5" y="11" width="14" height="9" /><path d="M8 11V8a4 4 0 017.7-1.5" /></>,
  export: <><path d="M12 15V3M7.5 7.5L12 3l4.5 4.5" /><path d="M4 13v7h16v-7" /></>,
  close: <path d="M5 5l14 14M19 5L5 19" />,
  plus: <path d="M12 5v14M5 12h14" />,
  safe: <><rect x="5" y="2.5" width="14" height="19" /><path d="M5 6.5h14M5 16h14M16 6.5V16" /></>,
  reset: <><path d="M4 12a8 8 0 108-8H8" /><path d="M10.5 1.5L8 4l2.5 2.5" /></>,
  layer: <><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></>,
  image: <><rect x="3" y="4" width="18" height="16" /><path d="M3 16l5-5 4 4 3-3 6 6" /></>,
  video: <><rect x="3" y="5" width="13" height="14" /><path d="M16 10l5-3v10l-5-3" /></>,
  check: <path d="M4.5 12.5l5 5 10-11" />,
  keyboard: <><rect x="2.5" y="6" width="19" height="12" /><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M7 14h10" /></>,
  panelRight: <><rect x="3" y="4" width="18" height="16" /><path d="M15 4v16" /></>,
  panelLeft: <><rect x="3" y="4" width="18" height="16" /><path d="M9 4v16" /></>,
  chevron: <path d="M6 9l6 6 6-6" />,
  alignLeft: <path d="M4 6h16M4 10h10M4 14h16M4 18h10" />,
  alignCenter: <path d="M4 6h16M7 10h10M4 14h16M7 18h10" />,
  alignRight: <path d="M4 6h16M10 10h10M4 14h16M10 18h10" />,
  join: <><path d="M4 8h6v8H4M20 8h-6v8h6" /></>,
  minus: <path d="M5 12h14" />,
  crop: <><path d="M6 2v16h16" /><path d="M2 6h16v16" /></>,
  captions: <><rect x="3" y="5" width="18" height="14" /><path d="M7 13h4M13 13h4M7 16h7" /></>,
  upload: <><path d="M12 16V4M7.5 8.5L12 4l4.5 4.5" /><path d="M4 14v6h16v-6" /></>,
  music: <><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .7-1.5 1.2-1.5 2.5M12 17h.01" /></>,
  stop: <rect x="6.5" y="6.5" width="11" height="11" fill="currentColor" stroke="none" />,
  warn: <><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></>,
};

export const Icon: React.FC<{ name: keyof typeof paths | string; size?: number }> = ({ name, size = 18 }) => (
  <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
    {paths[name]}
  </svg>
);
