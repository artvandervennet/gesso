// Draws the artist's signature as outlines, so <art-signature> needs no font to paint it.
// Usage: node scripts/build-signature.mjs
//
// Reads the letters of the name, the ten digits and the apostrophe out of Kristi and writes
// them to components/signature-ink.js as SVG paths. A font that is late, blocked or missing
// then can't change the signature into another hand.
//
// It lays the letters out by their advance widths alone. That is right for this name and for
// every year: Kristi kerns none of these pairs and has no ligature for them (checked with
// hb-shape). Change NAME and that has to be checked again.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const NAME = 'Art Van der Vennet';
const YEAR = '’0123456789';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const font = readFileSync(join(root, 'design-kit/fonts/Kristi-Regular.ttf'));

// ---- the tables of a TrueType font ----
const tables = {};
for (let i = 0, n = font.readUInt16BE(4); i < n; i++) {
  const at = 12 + i * 16;
  tables[font.toString('latin1', at, at + 4)] = font.readUInt32BE(at + 8);
}
const need = (tag) => {
  if (!(tag in tables)) throw new Error(`Kristi has no ${tag} table`);
  return tables[tag];
};

const head = need('head');
const em = font.readUInt16BE(head + 18);
const longLoca = font.readInt16BE(head + 50) === 1;
const hhea = need('hhea');
const ascent = font.readInt16BE(hhea + 4);
const descent = -font.readInt16BE(hhea + 6);
const metricCount = font.readUInt16BE(hhea + 34);
const hmtx = need('hmtx');
const loca = need('loca');
const glyf = need('glyf');

const advanceOf = (gid) => font.readUInt16BE(hmtx + Math.min(gid, metricCount - 1) * 4);
const glyphAt = (gid) => {
  const read = (i) => (longLoca ? font.readUInt32BE(loca + i * 4) : font.readUInt16BE(loca + i * 2) * 2);
  const from = read(gid), to = read(gid + 1);
  return to > from ? glyf + from : null; // null: a glyph without an outline, such as the space
};

// character → glyph, from the Windows Unicode subtable (format 4)
const glyphOf = (() => {
  const cmap = need('cmap');
  let sub = null;
  for (let i = 0, n = font.readUInt16BE(cmap + 2); i < n; i++) {
    const rec = cmap + 4 + i * 8;
    const at = cmap + font.readUInt32BE(rec + 4);
    if (font.readUInt16BE(rec) === 3 && font.readUInt16BE(rec + 2) === 1 && font.readUInt16BE(at) === 4) sub = at;
  }
  if (sub === null) throw new Error('Kristi has no format 4 cmap');
  const segs = font.readUInt16BE(sub + 6) / 2;
  const ends = sub + 14, starts = ends + segs * 2 + 2, deltas = starts + segs * 2, offsets = deltas + segs * 2;
  return (ch) => {
    const code = ch.codePointAt(0);
    for (let s = 0; s < segs; s++) {
      if (code > font.readUInt16BE(ends + s * 2)) continue;
      const start = font.readUInt16BE(starts + s * 2);
      if (code < start) break;
      const delta = font.readUInt16BE(deltas + s * 2);
      const offset = font.readUInt16BE(offsets + s * 2);
      if (!offset) return (code + delta) & 0xffff;
      const gid = font.readUInt16BE(offsets + s * 2 + offset + (code - start) * 2);
      return gid ? (gid + delta) & 0xffff : 0;
    }
    return 0;
  };
})();

// ---- a glyph's outline, as contours of points in font units (y up) ----
function contoursOf(gid) {
  const at = glyphAt(gid);
  if (at === null) return [];
  const count = font.readInt16BE(at);
  if (count < 0) return compound(at + 10);

  const ends = [];
  for (let i = 0; i < count; i++) ends.push(font.readUInt16BE(at + 10 + i * 2));
  const points = ends[count - 1] + 1;
  let p = at + 10 + count * 2;
  p += 2 + font.readUInt16BE(p); // skip the hinting instructions

  const flags = [];
  while (flags.length < points) {
    const flag = font[p++];
    flags.push(flag);
    if (flag & 8) for (let r = font[p++]; r > 0; r--) flags.push(flag);
  }
  const axis = (short, same) => {
    const out = [];
    let v = 0;
    for (const flag of flags) {
      if (flag & short) { const d = font[p++]; v += flag & same ? d : -d; }
      else if (!(flag & same)) { v += font.readInt16BE(p); p += 2; }
      out.push(v);
    }
    return out;
  };
  const xs = axis(2, 16), ys = axis(4, 32);

  const contours = [];
  for (let c = 0, first = 0; c < count; first = ends[c] + 1, c++) {
    const contour = [];
    for (let i = first; i <= ends[c]; i++) contour.push({ x: xs[i], y: ys[i], on: !!(flags[i] & 1) });
    contours.push(contour);
  }
  return contours;
}

// a glyph built from other glyphs, each moved and possibly scaled
function compound(p) {
  const contours = [];
  for (let more = true; more;) {
    const flags = font.readUInt16BE(p), gid = font.readUInt16BE(p + 2);
    p += 4;
    if (!(flags & 2)) throw new Error('compound glyph placed by matching points: not handled');
    let dx, dy;
    if (flags & 1) { dx = font.readInt16BE(p); dy = font.readInt16BE(p + 2); p += 4; }
    else { dx = font.readInt8(p); dy = font.readInt8(p + 1); p += 2; }
    const f = () => { const v = font.readInt16BE(p) / 16384; p += 2; return v; };
    let a = 1, b = 0, c = 0, d = 1;
    if (flags & 8) a = d = f();
    else if (flags & 0x40) { a = f(); d = f(); }
    else if (flags & 0x80) { a = f(); b = f(); c = f(); d = f(); }
    for (const contour of contoursOf(gid)) {
      contours.push(contour.map(({ x, y, on }) => ({ x: a * x + c * y + dx, y: b * x + d * y + dy, on })));
    }
    more = !!(flags & 0x20);
  }
  return contours;
}

// ---- contours → SVG path, moved right by `shift`, y down with the baseline at 0 ----
function pathOf(contours, shift = 0) {
  const n = (v) => String(Math.round(v));
  const pt = (q) => `${n(q.x + shift)} ${n(-q.y)}`;
  const mid = (q, r) => ({ x: (q.x + r.x) / 2, y: (q.y + r.y) / 2 });
  let d = '';
  for (const contour of contours) {
    if (contour.length < 2) continue;
    // start on the curve; between two control points there is always a point on it
    let pts = contour;
    const firstOn = pts.findIndex((q) => q.on);
    let start;
    if (firstOn >= 0) { pts = [...pts.slice(firstOn), ...pts.slice(0, firstOn)]; start = pts.shift(); }
    else start = mid(pts[pts.length - 1], pts[0]);
    d += `M${pt(start)}`;
    for (let i = 0; i < pts.length; i++) {
      const q = pts[i];
      if (q.on) { d += `L${pt(q)}`; continue; }
      const next = pts[i + 1] ?? start;
      if (next.on === false) d += `Q${pt(q)} ${pt(mid(q, next))}`;
      else { d += `Q${pt(q)} ${pt(next)}`; i++; }
    }
    d += 'Z';
  }
  return d;
}

const glyph = (ch) => {
  const gid = glyphOf(ch);
  if (!gid) throw new Error(`Kristi has no glyph for "${ch}"`);
  return gid;
};

let width = 0, path = '';
for (const ch of NAME) {
  const gid = glyph(ch);
  path += pathOf(contoursOf(gid), width);
  width += advanceOf(gid);
}

const glyphs = {};
for (const ch of YEAR) {
  const gid = glyph(ch);
  glyphs[ch] = [advanceOf(gid), pathOf(contoursOf(gid))];
}

// A line of text with line-height 1 is one em high, and the font's own height (ascent plus
// descent) sits centred in it. `rise` is how far the baseline then lies under the top.
const rise = Math.round(ascent + (em - (ascent + descent)) / 2);

const out = `// Made by scripts/build-signature.mjs from design-kit/fonts/Kristi-Regular.ttf. Don't edit by hand.
// The signature as outlines, in the font's units with the baseline at y = 0, so that
// <art-signature> paints the same hand whether or not the font has arrived.
//
// Kristi is by Birgit Pulk, under the SIL Open Font License (design-kit/fonts/OFL-Kristi.txt).
export const ink = {
  name: ${JSON.stringify(NAME)},
  em: ${em}, // units in one em
  rise: ${rise}, // from the top of a line of line-height 1 down to the baseline
  width: ${width},
  path: ${JSON.stringify(path)},
  // the apostrophe and the digits, for the year: character → [advance, path]
  glyphs: {
${Object.entries(glyphs).map(([ch, [adv, d]]) => `    ${JSON.stringify(ch)}: [${adv}, ${JSON.stringify(d)}],`).join('\n')}
  },
};
`;
writeFileSync(join(root, 'components/signature-ink.js'), out);
console.log(`signature: "${NAME}" is ${width} units wide, ${out.length} bytes in components/signature-ink.js`);
