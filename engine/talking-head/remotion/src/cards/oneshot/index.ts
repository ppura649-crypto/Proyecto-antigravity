import type React from "react";
import type { CardProps } from "../props";
import { KINDS as A } from "./famA";
import { KINDS as B } from "./famB";
import { KINDS as C } from "./famC";
import { KINDS as D } from "./famD";
import { KINDS as E } from "./famE";
// edit-h-oneshot (the guest, talk vs type, one shot 2026-09-13): one registry per builder family, merged
// here, same shape as cards/lock and cards/talk. A kind name must be unique across every registry.
export const ONESHOT_KINDS: Record<string, React.FC<CardProps & { data: any }>> = { ...A, ...B, ...C, ...D, ...E };
