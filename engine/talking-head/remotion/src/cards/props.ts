// The props every edit-c-chip card receives from Overlay (2026-09-05). Times are spine ms.
// `beats` are the word times named in visual-plan.md; `assets` are the real marks / photos the
// event lists in data.assets, already prefixed to public paths (use with staticFile()).
export type CardProps = {
  tMs: number; w: number; h: number; fps: number; fromMs: number; toMs: number;
  beats: Record<string, number>; assets: string[];
};
