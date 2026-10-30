#!/usr/bin/env node
// Refresh the requested account window, preserving older posts. Detailed reading is format owned.
import { P } from './_lib.mjs';
import { execFileSync } from 'node:child_process';
const args = process.argv.slice(2);
const days = args.includes('--days') ? args[args.indexOf('--days') + 1] : '90';
execFileSync(process.execPath, [P('scripts', 'profile.mjs'), '--days', days], { stdio: 'inherit' });
if (!args.includes('--no-read')) execFileSync(process.execPath, [P('scripts', 'context.mjs')], { stdio: 'inherit' });
console.log('Account context refreshed. Trial Reels refreshes its best 50 when that format runs.');
