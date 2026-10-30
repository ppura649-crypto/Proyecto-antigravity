import type React from "react";
import type { CardProps } from "../props";
import { KINDS as A } from "./famA";
import { KINDS as B } from "./famB";
import { KINDS as C } from "./famC";
import { KINDS as D } from "./famD";
import { KINDS as E } from "./famE";
import { KINDS as P } from "./famP";
import { KINDS as H } from "./famH";
import { KINDS as V } from "./famV";
import { KINDS as W } from "./famW";
import { KINDS as X } from "./famX";
import { KINDS as F } from "./famF";
import { KINDS as G } from "./famG";
import { KINDS as J } from "./famJ";
import { KINDS as K } from "./famK";
// reference edit K (Holo, 2026-09-23): one registry per builder family, merged here. Kind names start with
// "holo-" and are unique across families. Overlay renders them with CardProps + data[kind].
export const HOLO_KINDS: Record<string, React.FC<CardProps & { data: any }>> = { ...A, ...B, ...C, ...D, ...E, ...P, ...H, ...V, ...W, ...X, ...F, ...G, ...J, ...K };
