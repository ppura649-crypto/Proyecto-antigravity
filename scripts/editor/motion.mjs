// Visual entrance motion has its own clock so source trim and playback speed cannot skip a new entrance.
// Contract: motionAt(item, frame, canvasHeight) returns CSS transform and opacity; no motion is identity.
export const MOTIONS = [
  { value: 'none', label: 'None' },
  { value: 'rise', label: 'Rise' },
  { value: 'slide', label: 'Slide' },
  { value: 'zoom', label: 'Zoom' },
];

export function motionAt(item, frame, height) {
  const motion = item.motion;
  if (!motion) return { transform: undefined, opacity: 1 };
  const progress = Math.min(1, Math.max(0, (frame + (motion.offsetInFrames ?? 0)) / motion.durationInFrames));
  const remaining = Math.pow(1 - progress, 4);
  const distance = height * 0.045 * remaining;
  if (motion.preset === 'rise') return { transform: `translateY(${distance}px)`, opacity: 1 - remaining };
  if (motion.preset === 'slide') return { transform: `translateX(${-distance}px)`, opacity: 1 - remaining };
  if (motion.preset === 'zoom') return { transform: `scale(${1 - 0.12 * remaining})`, opacity: 1 - remaining };
  return { transform: undefined, opacity: 1 };
}
