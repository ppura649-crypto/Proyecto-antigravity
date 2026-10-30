// A named scene node keeps its original drawing outside the editor. The editor supplies only saved overrides.
// This bridge has no dependency on editor bundles, so the reel still renders in its own project.
import React, { createContext, useContext } from 'react';
import { Img } from 'remotion';

type Override = { text?: string; src?: string; css?: React.CSSProperties };
export const SceneEdits = createContext<((id: string) => Override) | null>(null);
export function Editable({ id, as = 'div', children, style, ...props }: {
  id: string; as?: 'div' | 'span' | 'img'; children?: React.ReactNode; style?: React.CSSProperties; [key: string]: any;
}) {
  const get = useContext(SceneEdits);
  const edit = get?.(id) ?? {};
  const css = { ...edit.css };
  if (css.opacity != null) css.opacity = Number(css.opacity) * Number(style?.opacity ?? 1);
  if (as === 'span' && !style?.display && (css.translate || css.scale || css.rotate)) css.display = 'inline-block';
  // One tag for three kinds of node: the props are checked where Editable is used, not here.
  const Tag: React.ElementType = as === 'img' ? Img : as;
  return <Tag {...props} {...(as === 'img' && edit.src ? { src: edit.src } : {})} data-element-id={id} style={{ ...style, ...css }}>
    {as === 'img' ? undefined : edit.text ?? children}
  </Tag>;
}
