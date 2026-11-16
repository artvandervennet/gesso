// Turns a theme recipe (brand, partner, complement) into a full, contrast-checked theme.
// Used by build-tokens, check-contrast and export-design-kit, so all three always agree.
import { contrast } from './color.mjs';

export const PAINT_COUNT = 8;

const fmt = ([L, C, H]) => `oklch(${+L.toFixed(1)}% ${+Math.max(0, C).toFixed(3)} ${+(((H % 360) + 360) % 360).toFixed(1)})`;
const minContrast = (c, others) => Math.min(...others.map((o) => contrast(c, o)));

/** Nudge lightness (darker by default) until `color` reaches `min` against every background. */
function ensure(lch, against, min, dir = -1) {
  let [L, C, H] = lch;
  for (let i = 0; i < 200 && minContrast(fmt([L, C, H]), against) < min; i++) {
    L += dir * 0.5;
    if (L <= 5 || L >= 99) break;
  }
  return [L, C, H];
}

/** Walk the colour wheel from a to b the short way. */
const arc = (a, b) => { let d = ((b - a + 540) % 360) - 180; return d; };

export function buildTheme(id, recipe) {
  const B = recipe.brand.oklch, P = recipe.partner.oklch, X = recipe.complement.oklch;
  const hB = B[2], k = Math.min(1, B[1] / 0.105);

  // Neutrals: shades of the brand, from gesso to near-black. 600 is the brand itself.
  const shades = { 50: [97.5, 0.008], 100: [93, 0.016], 200: [87, 0.028], 300: [77, 0.04], 400: [65, 0.055], 500: [53, 0.075],
    600: [B[0], B[1] / k], 700: [B[0] - 6, 0.09], 800: [B[0] - 11.5, 0.075], 900: [B[0] - 17, 0.055], 950: [Math.max(12, B[0] - 23), 0.04] };
  const neutral = Object.fromEntries(Object.entries(shades).map(([n, [L, C]]) => [n, fmt([L, C * k, hB])]));

  // Section paints: washes walking the wheel brand → partner → complement, alternating light and deeper.
  const a1 = arc(hB, P[2]), a2 = arc(P[2], X[2]), total = Math.abs(a1) + Math.abs(a2);
  const hueAt = (t) => { const d = t * total; return d <= Math.abs(a1) ? hB + Math.sign(a1) * d : P[2] + Math.sign(a2) * (d - Math.abs(a1)); };
  const paintsRaw = Array.from({ length: PAINT_COUNT }, (_, i) => {
    const h = hueAt(i / (PAINT_COUNT - 1));
    // Alternate a light and a deeper tint, so each section's drip stands out on the next.
    const L = i % 2 === 0 ? 95 : 88, C = i % 2 === 0 ? 0.04 : 0.06;
    return { surface: [L, C, h], sunken: [L - 4, C + 0.005, h], rule: [L - 9, C, h] };
  });
  const lightBgs = paintsRaw.flatMap((p) => [fmt(p.surface), fmt(p.sunken)]).concat([fmt([99.6, 0.002, hB]), neutral[50]]);

  // Deep: the brand, dark enough for gesso text.
  const deep = ensure(B, [neutral[50]], 7);
  const deepS = fmt(deep), raisedDeep = fmt([deep[0] - 6, deep[1] * 0.86, hB]), sunkDeep = fmt([deep[0] - 11.5, deep[1] * 0.72, hB]);
  const deepBgs = [deepS, raisedDeep, sunkDeep];

  // Pigments, each nudged until it does its job.
  const brand = ensure(B, lightBgs, 4.5);                       // text and buttons on light paints
  const partner = ensure(P, [neutral[950]], 7, +1);             // a fill under dark text
  const partnerOnDeep = ensure(P, deepBgs, 4.5, +1);           // buttons on the deep paint
  const partnerText = ensure([P[0] - 30, P[1] * 0.8, P[2]], lightBgs, 4.5); // warnings
  const complement = ensure(X, lightBgs, 4.5);                  // errors and focus on light paints
  // Errors must read as errors: use the complement when it's red to orange, otherwise mix a red.
  const reddish = (h) => { const n = ((h % 360) + 360) % 360; return n >= 340 || n <= 60; };
  const errorBase = reddish(X[2]) ? X : [52, 0.16, 25];
  const danger = ensure(errorBase, lightBgs, 4.5);
  const dangerLight = ensure([84, errorBase[1] * 0.5, errorBase[2]], deepBgs, 4.5, +1);
  const complementLight = ensure([86, X[1] * 0.45, X[2]], deepBgs, 4.5, +1);
  const brandLight = ensure([80, B[1] * 0.95, hB], deepBgs, 4.5, +1);
  const partnerLight = ensure([89, P[1] * 0.7, P[2]], deepBgs, 4.5, +1);
  const inkMuted = ensure([44, 0.035 * k, hB], lightBgs, 4.5);
  const ruleStrong = ensure([55, 0.06 * k, hB], lightBgs, 3);

  const pigment = {
    brand: { body: fmt(brand), light: fmt(brandLight), wash: fmt([94, B[1] * 0.3, hB]), name: recipe.brand.name, code: recipe.brand.code },
    partner: { body: fmt(partner), light: fmt(partnerLight), wash: fmt([96, P[1] * 0.27, P[2]]), name: recipe.partner.name, code: recipe.partner.code },
    complement: { body: fmt(complement), light: fmt(complementLight), wash: fmt([96, X[1] * 0.15, X[2]]), name: recipe.complement.name, code: recipe.complement.code },
  };

  const roles = {
    'surface': fmt(paintsRaw[0].surface), 'surface-raised': fmt([99.6, 0.002, hB]), 'surface-sunken': fmt(paintsRaw[0].sunken),
    'canvas': fmt([99.6, 0.002, hB]), 'on-canvas': neutral[950],
    'ink': neutral[950], 'ink-muted': fmt(inkMuted), 'rule': fmt(paintsRaw[0].rule), 'rule-strong': fmt(ruleStrong),
    'accent': pigment.brand.body, 'accent-wash': pigment.brand.wash, 'on-accent': neutral[50],
    'link': pigment.brand.body, 'focus': pigment.complement.body,
    'success': pigment.brand.body, 'warning': fmt(partnerText), 'danger': fmt(danger), 'info': fmt(inkMuted),
    'stroke': pigment.partner.body, 'highlight': pigment.partner.body,
    'tape': pigment.complement.light, 'on-tape': fmt([28, X[1] * 0.55, X[2]]),
  };

  const deepRoles = {
    'surface': deepS, 'surface-raised': raisedDeep, 'surface-sunken': sunkDeep,
    'ink': neutral[50], 'ink-muted': fmt(ensure([87, 0.028 * k, hB], deepBgs, 4.5, +1)), 'rule': fmt([deep[0] + 12, deep[1] * 0.7, hB]), 'rule-strong': fmt(ensure([77, 0.04 * k, hB], deepBgs, 3, +1)),
    'accent': fmt(partnerOnDeep), 'accent-wash': fmt([deep[0] - 4, 0.07, (hB + P[2]) / 2]), 'on-accent': neutral[950],
    'link': pigment.partner.light, 'focus': pigment.complement.light,
    'success': pigment.brand.light, 'warning': fmt(partnerOnDeep), 'danger': fmt(dangerLight), 'info': neutral[100],
    'stroke': fmt(partnerOnDeep), 'highlight': fmt(ensure([44, X[1] * 0.85, X[2]], [neutral[50]], 4.5)),
  };

  const paints = { deep: deepRoles };
  paintsRaw.forEach((p, i) => { paints[i + 1] = { surface: fmt(p.surface), 'surface-sunken': fmt(p.sunken), rule: fmt(p.rule) }; });

  return { id, label: recipe.label, description: recipe.description, pigment, neutral, roles, paints };
}

export function loadThemes(json) {
  return Object.entries(json).filter(([k]) => !k.startsWith('$')).map(([id, r]) => buildTheme(id, r));
}

/** Every pairing that has to pass, per paint. [fg, bg, min, why] */
export const PAIRS = [
  ['ink', 'surface', 7, 'body text'], ['ink', 'surface-raised', 7, 'text on cards'], ['ink', 'surface-sunken', 7, 'text in code blocks'],
  ['ink-muted', 'surface', 4.5, 'secondary text'], ['ink-muted', 'surface-sunken', 4.5, 'secondary text, sunken'],
  ['accent', 'surface', 4.5, 'accent text'], ['link', 'surface', 4.5, 'links'], ['link', 'surface-raised', 4.5, 'links on cards'],
  ['on-accent', 'accent', 4.5, 'primary button label'], ['ink', 'accent-wash', 4.5, 'text on accent wash'],
  ['rule-strong', 'surface', 3, 'input borders'], ['focus', 'surface', 3, 'focus ring'],
  ['success', 'surface', 4.5, 'status text'], ['warning', 'surface', 4.5, 'status text'], ['danger', 'surface', 4.5, 'status text'],
  ['ink', 'highlight', 4.5, 'text on a highlight'], ['on-tape', 'tape', 4.5, 'tape labels'], ['on-canvas', 'canvas', 7, 'text on a white canvas'],
];

/** Roles as they resolve inside one paint. */
export const rolesIn = (theme, paint) => ({ ...theme.roles, ...theme.paints[paint] });
