// render-root: the Remotion entry the export bundles (scripts/edit-export.mjs). It registers one composition, "Edit",
// drawing the edit document it is given the same way the editor's Player does; only where files come from differs.
// The export copies every file the document names into the render's public folder under media/, so asset(path) is
// staticFile('media/<path>'). Size, rate and length come from the document itself.
import React from 'react';
import { Composition, registerRoot, staticFile } from 'remotion';
import * as registry from 'keyframes-layers';
import { Edit } from './Edit';
import type { Doc } from './types';

type RenderProps = { doc: Doc; skip?: string[]; silent?: boolean; transparent?: boolean };

const asset = (path: string) => staticFile(`media/${path}`);
const kinds = (registry as any).layers ?? {};

// A graphic whose format is not installed would ship as a red placeholder, so the render refuses instead.
const EditRender: React.FC<RenderProps> = ({ doc, skip, silent, transparent }) => {
  const missing = doc.items.filter((item) => item.type === 'layer' && !item.missing && !kinds[item.renderer ?? ''] && !kinds[`${(item.renderer ?? '').split('/')[0]}/*`]).map((item) => item.renderer);
  if (missing.length) throw new Error(`These graphics are drawn by a format that is not installed: ${[...new Set(missing)].join(', ')}`);
  return <Edit doc={doc} mode="render" asset={asset} skip={skip} silent={silent} transparent={transparent} />;
};

const EMPTY: Doc = { version: 1, project: '', format: '', fps: 30, width: 1080, height: 1920, durationInFrames: 1, tracks: [], items: [] };

const Root: React.FC = () => (
  <Composition
    id="Edit"
    component={EditRender as React.FC<any>}
    durationInFrames={1}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ doc: EMPTY } as RenderProps}
    calculateMetadata={({ props }) => {
      const doc = (props as RenderProps).doc;
      const last = Math.max(1, doc.durationInFrames ?? 1, ...doc.items.map((item) => item.from + item.durationInFrames));
      return { durationInFrames: last, fps: doc.fps, width: doc.width, height: doc.height };
    }}
  />
);

registerRoot(Root);
