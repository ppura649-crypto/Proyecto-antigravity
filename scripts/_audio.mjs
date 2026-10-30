// Audio fingerprint, shared by sounds.mjs (the account's tracks) and sort.mjs (a file the buyer hands over).
// The landmark method: pairs of spectral peaks at 8 kHz mono, keyed by the two bins and the gap between them, so the
// same track scores in the thousands at any level and any start point, and a different track under 40 (measured
// 2026-09-04 on 75 posted reels). No service is called; nothing leaves the machine.
import { run } from "./_lib.mjs";

export const SR = 8000, N = 1024, HOP = 256, FPS = SR / HOP;

export function decode(ffmpeg, file) {
  const buf = run(ffmpeg, ["-nostdin", "-v", "error", "-i", file, "-vn", "-ac", "1", "-ar", String(SR), "-f", "s16le", "-"], { encoding: "buffer", maxBuffer: 1 << 28 });
  const out = new Float64Array(Math.floor(buf.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = buf.readInt16LE(i * 2) / 32768;
  return out;
}
export function dbfs(x) { let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i]; const rms = Math.sqrt(s / Math.max(1, x.length)); return rms > 0 ? 20 * Math.log10(rms) : -120; }

const WIN = new Float64Array(N); for (let i = 0; i < N; i++) WIN[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1));
const REV = new Uint16Array(N); for (let i = 0, bits = Math.log2(N); i < N; i++) { let r = 0; for (let b = 0; b < bits; b++) r = (r << 1) | ((i >> b) & 1); REV[i] = r; }
const COS = new Float64Array(N / 2), SIN = new Float64Array(N / 2); for (let i = 0; i < N / 2; i++) { COS[i] = Math.cos((2 * Math.PI * i) / N); SIN[i] = -Math.sin((2 * Math.PI * i) / N); }
function fft(re, im) {
  for (let i = 0; i < N; i++) { const j = REV[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let size = 2; size <= N; size <<= 1) {
    const half = size >> 1, step = N / size;
    for (let start = 0; start < N; start += size) for (let k = 0; k < half; k++) {
      const wr = COS[k * step], wi = SIN[k * step], a = start + k, b = a + half;
      const xr = re[b] * wr - im[b] * wi, xi = re[b] * wi + im[b] * wr;
      re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
    }
  }
}

const LO = 5, HI = 384, FAN = 5, AHEAD = 40;
export function peaks(x) {
  const frames = Math.floor((x.length - N) / HOP); const out = [];
  const re = new Float64Array(N), im = new Float64Array(N);
  for (let f = 0; f < frames; f++) {
    for (let i = 0; i < N; i++) { re[i] = x[f * HOP + i] * WIN[i]; im[i] = 0; }
    fft(re, im);
    const mag = new Float64Array(HI + 4); let mean = 0;
    for (let b = LO; b < HI; b++) { mag[b] = Math.log(1e-9 + re[b] * re[b] + im[b] * im[b]); mean += mag[b]; }
    mean /= HI - LO;
    const cand = [];
    for (let b = LO + 3; b < HI - 3; b++) {
      const m = mag[b]; if (m < mean + 1.5) continue;
      if (m > mag[b - 1] && m > mag[b - 2] && m > mag[b - 3] && m >= mag[b + 1] && m >= mag[b + 2] && m >= mag[b + 3]) cand.push([b, m]);
    }
    cand.sort((a, b) => b[1] - a[1]);
    for (const [b] of cand.slice(0, 6)) out.push({ t: f, f: b });
  }
  return out;
}
export function landmarks(pk) {
  const map = new Map();
  for (let i = 0; i < pk.length; i++) {
    let n = 0;
    for (let j = i + 1; j < pk.length && n < FAN; j++) {
      const dt = pk[j].t - pk[i].t; if (dt < 1) continue; if (dt > AHEAD) break;
      const key = (pk[i].f << 15) | (pk[j].f << 6) | dt;
      const arr = map.get(key); if (arr) arr.push(pk[i].t); else map.set(key, [pk[i].t]);
      n++;
    }
  }
  return map;
}
// Score: the number of shared keys that agree on one offset (in frames of HOP samples). Common keys carry no identity.
export function match(a, b) {
  const [small, big] = a.size <= b.size ? [a, b] : [b, a]; const flip = small !== a;
  const hist = new Map();
  for (const [key, ts] of small) {
    const us = big.get(key); if (!us || ts.length > 8 || us.length > 8) continue;
    for (const t1 of ts) for (const t2 of us) { const off = flip ? t1 - t2 : t2 - t1; hist.set(off, (hist.get(off) || 0) + 1); }
  }
  let best = 0, at = 0; for (const [off, n] of hist) if (n > best) { best = n; at = off; }
  return { score: best, offset: at };
}
// One call for a file: level, whether it is silent, and its landmarks.
export function fingerprint(ffmpeg, file) {
  const x = decode(ffmpeg, file);
  const level = dbfs(x);
  return { seconds: Math.round((x.length / SR) * 100) / 100, level: Math.round(level * 10) / 10, silent: level < -50, marks: level < -50 ? new Map() : landmarks(peaks(x)) };
}
