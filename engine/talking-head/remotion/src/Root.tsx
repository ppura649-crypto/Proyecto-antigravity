import React from "react";
import { Composition } from "remotion";
import { CaptionReel } from "./CaptionReel";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CaptionReel"
      component={CaptionReel}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={300}
      defaultProps={{ video: "", pages: [], style: null as never, durationMs: 10000 }}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.ceil((props.durationMs / 1000) * 30),
      })}
    />
  );
};
