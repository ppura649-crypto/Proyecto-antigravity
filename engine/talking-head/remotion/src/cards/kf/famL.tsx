import type React from "react";
import type { CardProps } from "../props";
import { SPLICE_KINDS } from "./L-splice";
import { HOOK2_KINDS } from "./L-hook2";
// keyframes-v1 family L (builder L, 2026-09-25): V2 the hook splicer (v1) and kf-l-hook2 (v2, title + splice in the top band). V1 reuses the registered holo-h-title.
export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = { ...SPLICE_KINDS, ...HOOK2_KINDS };
