// Exports the designer kit from tokens/tokens.json and the brush engine.
// Usage: node scripts/export-design-kit.mjs
//
// design-kit/
//   tokens/       hex-valued tokens for design tools (Figma variables, Tokens Studio)
//   assets/       SVG strokes, drips, splatters, tape, canvas studies, gitflow parts, palette sheet
//   fonts/        the three typefaces (SIL Open Font License)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { oklchToHex } from './color.mjs';
import { strokePath, bristleHoles, splatter, dripEdge, rng } from '../components/brush.js';
import { loadThemes, rolesIn, PAINT_COUNT } from './theme.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const kit = join(root, 'design-kit');
const t = JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8')); // shared tokens
const out = (rel, content) => {
  const p = join(kit, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, typeof content === 'string' ? content : JSON.stringify(content, null, 2) + '\n');
};

// ───────── values ─────────
const themes = loadThemes(JSON.parse(readFileSync(join(root, 'tokens/themes.json'), 'utf8')));
const hex = (v) => oklchToHex(v);
const px = (rem) => Math.round(parseFloat(rem) * (String(rem).includes('rem') ? 16 : 1) * 10) / 10;
const entries = (o) => Object.entries(o).filter(([k]) => !k.startsWith('$'));
const clampEnds = (v) => { const m = v.match(/clamp\(([^,]+),[^,]+,([^)]+)\)/); return m ? [px(m[1].trim()), px(m[2].trim())] : [px(v), px(v)]; };
const color = (value, description) => ({ $type: 'color', $value: value, ...(description ? { $description: description } : {}) });
const dim = (n, description) => ({ $type: 'dimension', $value: `${n}px`, ...(description ? { $description: description } : {}) });
const PAINT_IDS = ['deep', ...Array.from({ length: PAINT_COUNT }, (_, i) => String(i + 1))];

// ───────── 1. Figma variables (W3C design tokens, literal hex) ─────────
// Shared: one Primitives file and two Size modes.
const shared = { space: {}, radius: {} };
for (const [k, v] of entries(t.space)) shared.space[k] = dim(px(v.$value));
for (const k of ['canvas', 'chip', 'round']) shared.radius[k] = dim(px(t.radius[k].$value));
shared.radius.dab = { $type: 'dimension', $value: '12px', $description: 'In code the dab is irregular: 14px 9px 16px 8px / 9px 15px 8px 14px. In design tools, use 12px or set each corner: 14, 9, 16, 8.' };
out('tokens/figma/primitives.tokens.json', shared);
for (const [mode, i] of [['mobile', 0], ['desktop', 1]]) {
  const size = { type: {}, layout: {} };
  for (const [k, v] of entries(t.font.size)) size.type[`step-${k}`] = dim(clampEnds(v.$value)[i]);
  size.layout.gutter = dim(clampEnds(t.layout.gutter.$value)[i]);
  size.layout['canvas-max'] = dim(1280);
  size.layout.measure = { $type: 'dimension', $value: '68ch', $description: 'About 640px at body size' };
  size.layout['frame-width'] = dim(i ? 1280 : 360, 'Design at these frame widths');
  out(`tokens/figma/size.${mode}.tokens.json`, size);
}
// Per theme: its pigments and shades, and one Color mode per paint.
for (const th of themes) {
  const prim = { pigment: {}, neutral: {} };
  for (const [role, p] of Object.entries(th.pigment)) prim.pigment[role] = { body: color(hex(p.body), `${p.name} (${p.code})`), light: color(hex(p.light)), wash: color(hex(p.wash)) };
  for (const [n, v] of Object.entries(th.neutral)) prim.neutral[n] = color(hex(v));
  out(`tokens/figma/${th.id}/pigments.tokens.json`, prim);
  for (const paint of PAINT_IDS) {
    const roles = Object.fromEntries(Object.entries(rolesIn(th, paint)).map(([k, v]) => [k, color(hex(v))]));
    out(`tokens/figma/${th.id}/color.${paint}.tokens.json`, { color: roles });
  }
}

// ───────── 2. Tokens Studio: one file, a set per theme and per paint ─────────
const ts = { core: { space: {}, borderRadius: {}, fontFamilies: {}, fontWeights: {}, lineHeights: {}, fontSizes: {} } };
for (const [k, v] of Object.entries(shared.space)) ts.core.space[k] = { value: v.$value, type: 'spacing' };
for (const [k, v] of Object.entries(shared.radius)) ts.core.borderRadius[k] = { value: v.$value, type: 'borderRadius' };
ts.core.fontFamilies = { signature: { value: 'Kristi', type: 'fontFamilies' }, display: { value: 'Young Serif', type: 'fontFamilies' }, body: { value: 'Atkinson Hyperlegible Next', type: 'fontFamilies' }, mono: { value: 'Atkinson Hyperlegible Mono', type: 'fontFamilies' } };
for (const [k, v] of entries(t.font.weight)) ts.core.fontWeights[k] = { value: String(v.$value), type: 'fontWeights' };
for (const [k, v] of entries(t.font.leading)) ts.core.lineHeights[k] = { value: `${Math.round(v.$value * 100)}%`, type: 'lineHeights' };
for (const [k, v] of entries(t.font.size)) { const [m, d] = clampEnds(v.$value); ts.core.fontSizes[`step-${k}`] = { mobile: { value: `${m}px`, type: 'fontSizes' }, desktop: { value: `${d}px`, type: 'fontSizes' } }; }
// Text styles: typography tokens Tokens Studio can turn into Figma text styles, at both frame sizes.
const famName = { '{font.family.display}': 'Young Serif', '{font.family.body}': 'Atkinson Hyperlegible Next', '{font.family.mono}': 'Atkinson Hyperlegible Mono', '{font.family.signature}': 'Kristi' };
const sizeAt = (v, i) => (v.startsWith('{') ? clampEnds(t.font.size[v.match(/(-?\d+)\}$/)[1]].$value)[i] : clampEnds(v)[i]);
const textStyles = { mobile: {}, desktop: {} };
for (const [mode, i] of [['mobile', 0], ['desktop', 1]]) {
  ts.core.typography = ts.core.typography || {};
  ts.core.typography[mode] = {};
  for (const [name, tok] of entries(t.text)) {
    const v = tok.$value, size = sizeAt(v.fontSize, i);
    const val = { fontFamily: famName[v.fontFamily], fontWeight: String(v.fontWeight), fontSize: `${size}px`, lineHeight: `${Math.round(v.lineHeight * 100)}%`, letterSpacing: v.letterSpacing === '0' ? '0%' : `${parseFloat(v.letterSpacing) * 100}%` };
    ts.core.typography[mode][name] = { value: val, type: 'typography', description: tok.$description };
    textStyles[mode][name] = { $type: 'typography', $value: { fontFamily: val.fontFamily, fontWeight: v.fontWeight, fontSize: `${size}px`, lineHeight: v.lineHeight, letterSpacing: v.letterSpacing === '0' ? '0em' : v.letterSpacing }, $description: tok.$description };
  }
  out(`tokens/figma/text-styles.${mode}.tokens.json`, { text: textStyles[mode] });
}
ts.$themes = [];
for (const th of themes) {
  ts[`${th.id}/base`] = {
    pigment: Object.fromEntries(Object.entries(th.pigment).map(([r, p]) => [r, { body: { value: hex(p.body), type: 'color', description: `${p.name} (${p.code})` }, light: { value: hex(p.light), type: 'color' }, wash: { value: hex(p.wash), type: 'color' } }])),
    neutral: Object.fromEntries(Object.entries(th.neutral).map(([n, v]) => [n, { value: hex(v), type: 'color' }])),
    ...Object.fromEntries(Object.entries(th.roles).map(([k, v]) => [k, { value: hex(v), type: 'color' }])),
  };
  for (const paint of PAINT_IDS) {
    ts[`${th.id}/paint-${paint}`] = Object.fromEntries(Object.entries(th.paints[paint]).map(([k, v]) => [k, { value: hex(v), type: 'color' }]));
    ts.$themes.push({ id: `${th.id}-${paint}`, name: `${th.label}, paint ${paint}`, group: th.label, selectedTokenSets: { core: 'source', [`${th.id}/base`]: 'enabled', [`${th.id}/paint-${paint}`]: 'enabled' } });
  }
}
ts.$metadata = { tokenSetOrder: Object.keys(ts).filter((k) => !k.startsWith('$')) };
out('tokens/tokens-studio.json', ts);

// ───────── 3. SVG assets, in the first theme's colours. Recolour with variables. ─────────
const T0 = themes[0];
const P = Object.fromEntries(Object.entries(T0.pigment).map(([k, v]) => [k, hex(v.body)]));
const L = Object.fromEntries(Object.entries(T0.pigment).map(([k, v]) => [k, hex(v.light)]));
const ROLE = Object.fromEntries(Object.entries(rolesIn(T0, '1')).map(([k, v]) => [k, hex(v)]));
ROLE.band = hex(T0.paints.deep.surface);
const PIG = ['brand', 'partner', 'complement'];
const svg = (w, h, body, title) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><title>${title}</title>${body}</svg>\n`;
const rough = { steps: 64, wobble: 0.22 };

// strokes
[3, 7, 12, 19, 25, 31].forEach((seed, i) => {
  out(`assets/strokes/underline-${i + 1}.svg`, svg(600, 48, `<path fill="${ROLE.stroke}" fill-rule="evenodd" d="${strokePath(600, 48, seed, { ...rough, taper: 0.2 })}${bristleHoles(600, 48, seed, 4)}"/>`, `Underline stroke ${i + 1}`));
});
[4, 9, 15].forEach((seed, i) => {
  out(`assets/strokes/highlight-${i + 1}.svg`, svg(600, 110, `<path fill="${ROLE.highlight}" fill-opacity=".7" fill-rule="evenodd" d="${strokePath(600, 110, seed, { ...rough, taper: 0.08 })}${bristleHoles(600, 110, seed, 7)}"/>`, `Highlight stroke ${i + 1}`));
});
out('assets/strokes/strike-1.svg', svg(600, 30, `<path fill="${P.complement}" fill-rule="evenodd" d="${strokePath(600, 30, 5, rough)}${bristleHoles(600, 30, 5, 2)}"/>`, 'Strike stroke'));

// drips
[11, 23, 37].forEach((seed, i) => {
  const { d } = dripEdge(1440, 120, seed, 9);
  // the deep paint; in a page, a drip always takes its own section's paint
  out(`assets/drips/drip-${i + 1}.svg`, svg(1440, 120, `<path fill="${ROLE.band}" d="${d.replace('M0 -12', 'M0 0')}"/>`, `Drip edge ${i + 1}`));
});

// splatters
[21, 42, 77, 404].forEach((seed, i) => {
  out(`assets/splatters/splatter-${i + 1}.svg`, svg(400, 400, `<g transform="scale(2)">${splatter(200, 200, seed, [P.partner, P.complement, P.brand, L.complement][i])}</g>`, `Splatter ${i + 1}`));
});

// tape
const tapeHex = ROLE.tape;
[2, 8, 14].forEach((seed, i) => {
  const r = rng(seed), j = () => (r() * 6).toFixed(1);
  const W = 220, H = 44;
  const left = [0, 11, 22, 33, 44].map((y) => `${j()},${y}`);
  const right = [44, 33, 22, 11, 0].map((y) => `${(W - Number(j())).toFixed(1)},${y}`);
  out(`assets/tape/tape-${i + 1}.svg`, svg(W, H, `<polygon fill="${tapeHex}" points="${[...left, ...right].join(' ')}"/>`, `Tape ${i + 1}`));
});

// canvas studies (one per pigment)
const study = (main, seed) => {
  const r = rng(seed);
  const others = PIG.filter((p) => p !== main);
  const pick = () => others[Math.floor(r() * others.length)];
  return [[main, 0.12, 0.2, 0.9, 0.24], [main, 0.3, 0.48, 0.75, 0.2], [pick(), 0.05, 0.7, 0.6, 0.14], [main, 0.45, 0.78, 0.5, 0.12], ['partner', 0.6, 0.12, 0.3, 0.1]]
    .map(([p, x, y, w, h], i) => {
      const W = 800 * w, H = 600 * h, rot = (r() - 0.5) * (i === 4 ? 70 : 26);
      return `<path transform="translate(${800 * x} ${600 * y}) rotate(${rot.toFixed(1)})" fill="${P[p]}" fill-rule="evenodd" d="${strokePath(W, H, seed + i, rough)}${bristleHoles(W, H, seed + i, 3)}"/>`;
    }).join('');
};
PIG.forEach((p, i) => out(`assets/canvas-studies/study-${p}.svg`, svg(800, 600, `<rect width="800" height="600" fill="${ROLE.canvas}"/>${study(p, 101 + i * 17)}`, `Canvas study in the ${p} pigment`)));

// gitflow parts
const WALL = ROLE.surface, INK = ROLE.ink;
const g = (x, y, body, label) => `<g id="${label}" transform="translate(${x} ${y})">${body}<text x="0" y="-14" font-family="Atkinson Hyperlegible Next" font-size="13" fill="${INK}">${label}</text></g>`;
const line = (d, c, w) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
const dabP = (cx, cy, s, c) => `<path d="M${cx - s} ${cy} C${cx - s} ${cy - s * 1.05} ${cx + s * 0.95} ${cy - s} ${cx + s} ${cy} C${cx + s * 1.05} ${cy + s * 0.95} ${cx - s * 0.9} ${cy + s * 1.05} ${cx - s} ${cy}Z" fill="${c}" stroke="${WALL}" stroke-width="2.5" paint-order="stroke"/>`;
const parts = [
  g(30, 40, line('M10 0 V160', ROLE.accent, 7), 'main-lane'),
  g(150, 40, line('M10 0 C10 30 42 50 42 80 V160', P.complement, 5.5), 'fork'),
  g(270, 40, line('M42 0 V80 C42 110 10 130 10 160', P.complement, 5.5), 'merge'),
  g(390, 40, line('M42 0 V160', P.partner, 5.5) + `<rect x="30" y="120" width="24" height="40" fill="url(#fade)"/>`, 'open-branch'),
  g(520, 40, dabP(20, 20, 10, ROLE.accent), 'commit-main'),
  g(650, 40, dabP(20, 20, 8.5, P.complement), 'commit-branch'),
  g(790, 40, `<circle cx="20" cy="20" r="14.5" fill="none" stroke="${P.partner}" stroke-width="2" opacity=".7"/>` + dabP(20, 20, 8.5, P.partner), 'commit-current'),
].join('');
out('assets/gitflow/gitflow-parts.svg', svg(920, 230, `<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${WALL}" stop-opacity="0"/><stop offset="1" stop-color="${WALL}"/></linearGradient></defs><rect width="920" height="230" fill="${WALL}"/>${parts}`, 'Gitflow parts: lanes 32px apart at desktop, 20px on mobile'));

// palette sheet: one per theme
const sw = (x, y, w, h, fill, name, sub, ink) => `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="5" fill="${fill}" stroke="#00000014"/><text x="14" y="${h - 34}" font-family="Young Serif" font-size="20" fill="${ink}">${name}</text><text x="14" y="${h - 14}" font-family="Atkinson Hyperlegible Mono" font-size="13" fill="${ink}">${sub}</text></g>`;
for (const th of themes) {
  const R = Object.fromEntries(Object.entries(rolesIn(th, '1')).map(([k, v]) => [k, hex(v)]));
  const DARK = hex(th.neutral[950]), LIGHT = hex(th.neutral[50]);
  let sheet = `<rect width="1100" height="1000" fill="${hex(th.neutral[50])}"/><text x="40" y="70" font-family="Young Serif" font-size="44" fill="${DARK}">Gesso theme: ${th.label}</text>`;
  Object.entries(th.pigment).forEach(([k, p], i) => {
    const x = 40 + i * 345, y = 110, b = hex(p.body);
    sheet += sw(x, y, 325, 200, b, p.name, `${p.code}  ${b}  the ${k}`, k === 'partner' ? DARK : LIGHT);
    sheet += sw(x, y + 210, 158, 80, hex(p.light), 'light', hex(p.light), DARK);
    sheet += sw(x + 167, y + 210, 158, 80, hex(p.wash), 'wash', hex(p.wash), DARK);
  });
  sheet += `<text x="40" y="465" font-family="Atkinson Hyperlegible Next" font-size="16" fill="${DARK}">Shades of the brand: 600 is the brand itself, 950 is text on light paints</text>`;
  Object.entries(th.neutral).forEach(([k, v], i) => { sheet += sw(40 + i * 93, 485, 86, 170, hex(v), k, hex(v).slice(1), Number(k) >= 500 ? LIGHT : DARK); });
  sheet += `<text x="40" y="720" font-family="Atkinson Hyperlegible Next" font-size="16" fill="${DARK}">Section paints, in page order: deep first and last, 1 to 8 in between</text>`;
  PAINT_IDS.forEach((paint, i) => {
    const r = rolesIn(th, paint), bg = hex(r.surface);
    sheet += sw(40 + i * 113, 740, 105, 150, bg, paint, bg, hex(r.ink));
  });
  sheet += `<text x="40" y="935" font-family="Atkinson Hyperlegible Next" font-size="16" fill="${DARK}">Text ${R.ink}, links and buttons ${R.accent}, strokes ${R.stroke}, errors ${R.danger}</text>`;
  out(`assets/palette-${th.id}.svg`, svg(1100, 1000, sheet, `Gesso theme: ${th.label}`));
}

console.log('design-kit exported');
