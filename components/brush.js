// Shared paint engine for Gesso components.
// Everything is seeded, so the same seed always paints the same stroke (stable SSR, stable screenshots).

/** Small, fast seeded PRNG. */
export function rng(seed = 1) {
  let a = (Number(seed) || 1) >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Turn a string into a seed, so `seed="about"` works as well as `seed="7"`. */
export function seedFrom(value, fallback = 1) {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  if (Number.isFinite(n)) return n;
  let h = 2166136261;
  for (const c of String(value)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Resolve a pigment name or semantic role to a CSS colour. */
export function paint(name, fallback = 'stroke') {
  const roles = ['accent', 'stroke', 'highlight', 'ink', 'ink-muted', 'surface', 'canvas', 'tape', 'band', 'success', 'warning', 'danger', 'info', 'rule'];
  const n = (name || fallback).trim();
  if (roles.includes(n)) return `var(--${n})`;
  if (n.startsWith('--')) return `var(${n})`;
  if (/^(neutral-\d+)$/.test(n)) return `var(--${n})`;
  return `var(--pigment-${n})`;
}

export const PIGMENTS = ['brand', 'partner', 'complement'];
/** Colours for lanes, chips and dabs on the page. Each comes with a name, never colour alone. */
export const ON_WALL = ['brand', 'complement', 'partner', 'neutral-500'];

const f = (n) => Math.round(n * 10) / 10;
const smooth = (t) => t * t * (3 - 2 * t);

/**
 * A filled, horizontal brushstroke inside a W×H box.
 * Loaded (blunt) at the start, tapering and breaking up where the brush runs dry.
 */
export function strokePath(W = 300, H = 24, seed = 1, { taper = 0.18, wobble = 0.12, steps = 28 } = {}) {
  const r = rng(seed);
  const mid = H / 2;
  const top = [], bottom = [];
  const bend = (r() - 0.5) * H * 0.35; // the whole stroke arcs a little, like a wrist
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t * W;
    const start = smooth(Math.min(1, t / 0.06));             // blunt start
    const end = smooth(Math.min(1, (1 - t) / taper));         // long taper
    const half = (H / 2) * (0.82 + r() * 0.18) * Math.max(start, 0.55) * end;
    const y = mid + Math.sin(t * Math.PI) * bend;
    top.push([x, y - half * (1 - r() * wobble)]);
    bottom.push([x, y + half * (1 - r() * wobble)]);
  }
  const pts = [...top, ...bottom.reverse()];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    d += ` Q${f(x0)} ${f(y0)} ${f((x0 + x1) / 2)} ${f((y0 + y1) / 2)}`;
  }
  return d + ' Z';
}

/** Dry-brush streaks: thin gaps that show the canvas through the paint. */
export function bristles(W = 300, H = 24, seed = 1, count = 4) {
  const r = rng(seed * 7 + 3);
  const out = [];
  for (let i = 0; i < count; i++) {
    const y = H * (0.25 + r() * 0.5);
    const x0 = W * (0.35 + r() * 0.35);
    const x1 = W * (0.9 + r() * 0.1);
    out.push({ d: `M${f(x0)} ${f(y)} L${f(x1)} ${f(y + (r() - 0.5) * 2)}`, w: f(0.6 + r() * 1.4) });
  }
  return out;
}

/**
 * Dry-brush gaps as thin closed slivers. Append to a stroke path and fill with
 * fill-rule="evenodd" to cut real holes: no filters, so design tools import it intact.
 */
export function bristleHoles(W = 300, H = 24, seed = 1, count = 5) {
  const r = rng(seed * 13 + 5);
  let d = '';
  for (let i = 0; i < count; i++) {
    const y = H * (0.22 + r() * 0.56), x0 = W * (0.3 + r() * 0.4), x1 = Math.min(W * 0.97, x0 + W * (0.2 + r() * 0.35));
    const t = Math.max(0.6, H * (0.015 + r() * 0.035)), mid = (x0 + x1) / 2, sag = (r() - 0.5) * H * 0.1;
    d += ` M${f(x0)} ${f(y)} Q${f(mid)} ${f(y + sag - t)} ${f(x1)} ${f(y)} Q${f(mid)} ${f(y + sag + t)} ${f(x0)} ${f(y)} Z`;
  }
  return d;
}

/** An SVG filter that roughens edges like bristles on canvas. */
export function roughFilter(id, seed = 1, scale = 2.5, freq = 0.05) {
  return `<filter id="${id}" x="-5%" y="-30%" width="110%" height="160%">
    <feTurbulence type="fractalNoise" baseFrequency="${freq} ${freq * 3}" numOctaves="2" seed="${seed % 100}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/>
  </filter>`;
}

/** Splatter: a few big drops, many specks, a couple of flicked tails. Returns SVG markup. */
export function splatter(W, H, seed, fill) {
  const r = rng(seed);
  const cx = W * (0.4 + r() * 0.2), cy = H * (0.4 + r() * 0.2);
  let s = `<g fill="${fill}">`;
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(Math.min(W, H) * (0.15 + r() * 0.05))}"/>`;
  s += `<circle cx="${f(cx + W * 0.09)}" cy="${f(cy - H * 0.07)}" r="${f(Math.min(W, H) * 0.08)}"/>`;
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2;
    const dist = Math.pow(r(), 0.6) * Math.min(W, H) * 0.48;
    const x = cx + Math.cos(a) * dist, y = cy + Math.sin(a) * dist;
    const size = Math.max(0.8, (1 - dist / (Math.min(W, H) * 0.5)) * (r() * 9 + 1.5));
    if (r() < 0.14 && dist > 20) {
      // a flicked drop: elongated along its direction of travel
      const len = size * (2.5 + r() * 3);
      s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(len)}" ry="${f(size * 0.7)}" transform="rotate(${f((a * 180) / Math.PI)} ${f(x)} ${f(y)})"/>`;
    } else {
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(size)}"/>`;
    }
  }
  return s + '</g>';
}

/** A wet edge with drips running down. Returns { edge, drips: [{x, len, w}] } in a W×H box. */
export function dripEdge(W, H, seed, count = 7) {
  const r = rng(seed);
  const base = H * 0.22;
  let d = `M0 -12 H${W} V${f(base)}`;
  const drips = [];
  const slots = Array.from({ length: count }, (_, i) => (i + 0.3 + r() * 0.4) * (W / count)).reverse();
  let x = W;
  for (const sx of slots) {
    const w = 6 + r() * 12;
    const len = base + (H - base) * (0.25 + r() * 0.75);
    drips.push({ x: sx, len, w });
    // wavy edge to the drip, the drip itself, wavy edge onward
    d += ` Q${f((x + sx + w) / 2)} ${f(base + (r() - 0.5) * 6)} ${f(sx + w)} ${f(base)}`;
    d += ` C${f(sx + w * 0.55)} ${f(base + 4)} ${f(sx + w * 0.5)} ${f(len - w)} ${f(sx + w / 2 + w * 0.45)} ${f(len - w * 0.4)}`;
    d += ` A${f(w / 2)} ${f(w / 2)} 0 1 1 ${f(sx + w / 2 - w * 0.45)} ${f(len - w * 0.4)}`;
    d += ` C${f(sx + w * 0.5)} ${f(len - w)} ${f(sx + w * 0.45)} ${f(base + 4)} ${f(sx)} ${f(base)}`;
    x = sx;
  }
  d += ` Q${f(x / 2)} ${f(base + (r() - 0.5) * 6)} 0 ${f(base)} Z`;
  return { d, drips };
}

/**
 * One drip on its own, hanging from y = 0: a thin run of paint with a bead at the end, the same
 * shape dripEdge() draws along an edge. Returns a path for a box w wide and len tall; it starts
 * a little above 0 so it joins whatever it hangs from.
 */
export function dripShape(w, len) {
  return `M${f(w)} -3 V0 C${f(w * 0.55)} 4 ${f(w * 0.5)} ${f(len - w)} ${f(w / 2 + w * 0.45)} ${f(len - w * 0.4)}`
    + ` A${f(w / 2)} ${f(w / 2)} 0 1 1 ${f(w / 2 - w * 0.45)} ${f(len - w * 0.4)}`
    + ` C${f(w * 0.5)} ${f(len - w)} ${f(w * 0.45)} 4 0 0 V-3 Z`;
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Build a constructable stylesheet once per component class. */
export function sheet(css) {
  const s = new CSSStyleSheet();
  s.replaceSync(css);
  return s;
}

/** Register without throwing when a bundle loads twice. */
export function define(name, ctor) {
  if (!customElements.get(name)) customElements.define(name, ctor);
}
