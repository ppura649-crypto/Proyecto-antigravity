#!/usr/bin/env node
/**
 * Evaluador de Ganchos Virales (Myth-Busting Multi-Red: TikTok, Reels, Shorts, Facebook)
 * Uso:
 *   node workspace/library/myth-busting/scorecard_hook.mjs "Dejar cargando tu celular toda la noche no daña la batería, pero este hábito diario le quita el 20% de vida."
 */

const BANNED_OPENERS = [
  /^hola\b/i,
  /^buenas\b/i,
  /^hoy te voy a/i,
  /^en este video/i,
  /^sab[ií]as que\b/i,
  /^mira esto/i,
  /^no desliz/i,
  /^espera\b/i,
  /^alguna vez te has preguntado/i,
];

const WEAK_HEDGES = [
  /\bquiz[aá]s\b/i,
  /\btal vez\b/i,
  /\bpodr[ií]a ser\b/i,
  /\ba veces\b/i,
  /\bdepende\b/i,
];

const MYTH_CONTRAST_MARKERS = [
  /\bno\b/i,
  /\bmentira\b/i,
  /\bmito\b/i,
  /\bfalso\b/i,
  /\berror\b/i,
  /\bpero\b/i,
  /\bsino\b/i,
  /\besto s[ií]\b/i,
  /\ben realidad\b/i,
  /\bnunca\b/i,
  /\bdeja de\b/i,
];

export function scoreHook(hookText) {
  const clean = hookText.trim().replace(/\s+/g, " ");
  const words = clean.split(" ").filter(Boolean);
  const wordCount = words.length;
  const estSeconds = +(wordCount / 3.4).toFixed(1);

  let score = 0;
  const notes = [];

  // 1. Cero saludos o frases muertas al inicio (0-2 pts)
  const hasBannedOpener = BANNED_OPENERS.some((rx) => rx.test(clean));
  if (!hasBannedOpener) {
    score += 2;
    notes.push("ok  [+2] Entra directo al choque sin saludos ni '¿Sabías que...?'");
  } else {
    notes.push("FAIL [+0] Abre con saludo o frase débil (pierde ~40% de retención en el segundo 1)");
  }

  // 2. Velocidad del golpe (< 4.8 s / 10 a 20 palabras) (0-2 pts)
  if (wordCount >= 9 && wordCount <= 20) {
    score += 2;
    notes.push(`ok  [+2] Longitud ideal: ${wordCount} palabras (~${estSeconds} s, entra antes del swipe de 4.5 s)`);
  } else if (wordCount > 20 && wordCount <= 24) {
    score += 1;
    notes.push(`WARN [+1] Un poco largo: ${wordCount} palabras (~${estSeconds} s). Recorta 3-4 palabras.`);
  } else {
    notes.push(`FAIL [+0] Longitud fuera de rango (${wordCount} palabras, ~${estSeconds} s). Apunta a 11-19 palabras.`);
  }

  // 3. Choque de creencia / postura polémica sin tibiezas (0-2 pts)
  const hasContrast = MYTH_CONTRAST_MARKERS.some((rx) => rx.test(clean));
  const hasHedge = WEAK_HEDGES.some((rx) => rx.test(clean));
  if (hasContrast && !hasHedge) {
    score += 2;
    notes.push("ok  [+2] Rompe una creencia con postura firme y sin palabras tibias");
  } else if (hasContrast && hasHedge) {
    score += 1;
    notes.push("WARN [+1] Tiene contraste pero usa palabras tibias ('quizás', 'tal vez', 'depende')");
  } else {
    notes.push("FAIL [+0] No contradice claramente una creencia popular");
  }

  // 4. Ancla concreta (número, %, unidad física o marca/objeto específico) (0-2 pts)
  const hasNumberOrPercent = /\d+|%|\$/.test(clean);
  const hasConcreteNoun = words.some((w) => w.length >= 6);
  if (hasNumberOrPercent) {
    score += 2;
    notes.push("ok  [+2] Incluye cifra o porcentaje concreto que ancla credibilidad inmediata");
  } else if (hasConcreteNoun) {
    score += 1;
    notes.push("WARN [+1] Tiene sustantivo concreto, pero sumar un número o % en el gancho sube la retención");
  } else {
    notes.push("FAIL [+0] Demasiado abstracto");
  }

  // 5. Bucle abierto / promesa de revelación ("esto sí", "la verdadera razón", dos partes) (0-2 pts)
  const hasOpenLoop =
    /,|;|:|\besto s[ií]\b|\bpero\b|\bsino\b|\bpor qu[eé]\b|\beste\b|\besta\b/i.test(clean);
  if (hasOpenLoop) {
    score += 2;
    notes.push("ok  [+2] Abre curiosidad inmediata (obliga a quedarse a ver cuál es la causa real)");
  } else {
    notes.push("WARN [+0] Cierra toda la información en la primera frase sin dejar bucle abierto");
  }

  return { hook: clean, wordCount, estSeconds, score, max: 10, notes };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error('Uso: node scorecard_hook.mjs "Tu gancho aquí" ["Otro gancho..."]');
    process.exit(1);
  }
  for (const h of args) {
    const r = scoreHook(h);
    console.log(`\nGANCHO: "${r.hook}"`);
    console.log(`PUNTAJE VIRAL: ${r.score}/${r.max} (${r.wordCount} palabras · ~${r.estSeconds} s)`);
    for (const n of r.notes) console.log("  " + n);
  }
}
