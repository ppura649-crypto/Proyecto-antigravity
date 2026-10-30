import type React from "react";
import type { CardProps } from "../props";
import { KINDS as A1 } from "./famA1";
import { KINDS as A2 } from "./famA2";
import { KINDS as B } from "./famB";
import { KINDS as C } from "./famC";
import { KINDS as D } from "./famD";
// reference edit J: one registry per builder family, merged here. Overlay renders any event whose
// kind is in this map with CardProps + data[kind]. A kind name must be unique across families.
export const LOCK_KINDS: Record<string, React.FC<CardProps & { data: any }>> = { ...A1, ...A2, ...B, ...C, ...D };
