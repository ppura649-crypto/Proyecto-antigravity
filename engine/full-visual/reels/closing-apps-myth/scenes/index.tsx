import React from "react";
import { Hook } from "./Hook";
import { Execs } from "./Execs";
import { Ram } from "./Ram";
import { Coldboot } from "./Coldboot";
import { Culprits } from "./Culprits";
import { Rule } from "./Rule";
import { Cta } from "./Cta";

export const scenes: Record<string, React.FC> = {
  hook: Hook,
  execs: Execs,
  ram: Ram,
  coldboot: Coldboot,
  culprits: Culprits,
  rule: Rule,
  cta: Cta,
};
