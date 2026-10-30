import type React from "react";
import type { CardProps } from "../props";
import { Camera } from "./N-camera";
import { Upload } from "./N-upload";
import { Finished } from "./N-finished";
import { AnyLLM } from "./N-anyllm";
// keyframes-v1 family N (builder writes its kinds here, prefix "kf-n-"): every Claude surface in the video.
// V4 camera → V5 upload (one continuous clip card), V11 finished (the same chat), V16 any LLM.
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  "kf-n-camera": Camera,
  "kf-n-upload": Upload,
  "kf-n-finished": Finished,
  "kf-n-anyllm": AnyLLM,
};
