import type React from "react";
import type { CardProps } from "../props";
import { KINDS as L } from "./famL";
import { KINDS as M } from "./famM";
import { KINDS as N } from "./famN";
import { KINDS as Q } from "./famQ";
import { KINDS as R } from "./famR";
import { KINDS as S } from "./famS";
import { KINDS as T } from "./famT";
import { KINDS as U } from "./famU";
import { KINDS as W } from "./famW";
import { KINDS as X } from "./famX";
import { KINDS as Y } from "./famY";
// keyframes-v1 (2026-09-25): one registry per builder family, merged here. Kind names start with "kf-".
export const KF_KINDS: Record<string, React.FC<CardProps & { data: any }>> = { ...L, ...M, ...N, ...Q, ...R, ...S, ...T, ...U, ...W, ...X, ...Y };
