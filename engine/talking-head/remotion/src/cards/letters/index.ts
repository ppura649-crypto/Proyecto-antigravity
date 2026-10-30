import type React from "react";
import type { CardProps } from "../props";
import { KINDS as A } from "./famA";
import { KINDS as B } from "./famB";
import { KINDS as C } from "./famC";
import { KINDS as D } from "./famD";
import { KINDS as E } from "./famE";
// edit-i-oneshot (the guest, hand delivered letters, one shot 2026-09-13): one registry per builder family,
// merged here, same shape as cards/oneshot. A kind name must be unique across every registry.
export const LETTERS_KINDS: Record<string, React.FC<CardProps & { data: any }>> = { ...A, ...B, ...C, ...D, ...E };
