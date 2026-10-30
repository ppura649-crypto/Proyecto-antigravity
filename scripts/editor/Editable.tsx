import React, { createContext, useContext } from 'react';
import { Img } from 'remotion';
import type { Item } from './types';
import { detailCss } from './detail.mjs';

export const EditableContext = createContext<{ item: Item; frame: number; asset: (path: string) => string } | null>(null);
// Use this in place of an existing div/span. With no saved edits its layout and drawing are unchanged.
// Declare its ID and user-facing fields in the scene's elements metadata beside the scene export.
export function Editable({ id, as = 'div', children, style, ...props }: {
  id: string; as?: 'div' | 'span' | 'img'; children?: React.ReactNode; style?: React.CSSProperties; [key: string]: any;
}) {
  const context = useContext(EditableContext);
  const edit = context?.item.elements?.[id] ?? {};
  const css = detailCss(edit, context?.frame ?? 0);
  if (css.opacity != null) css.opacity *= Number(style?.opacity ?? 1);
  if (as === 'span' && !style?.display && (css.translate || css.scale || css.rotate)) css.display = 'inline-block';
  const Tag = as === 'img' ? Img : as;
  return <Tag {...props} {...(as === 'img' && edit.src ? { src: context!.asset(edit.src) } : {})}
    data-element-id={id} style={{ ...style, ...css }}>
    {as === 'img' ? undefined : edit.text ?? children}
  </Tag>;
}

export { detailCss } from './detail.mjs';
