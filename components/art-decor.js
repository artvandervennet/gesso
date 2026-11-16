import { dripEdge, splatter, roughFilter, paint, rng, seedFrom, sheet, define, reducedMotion } from './brush.js';

/**
 * <art-drip> — a wet edge with paint running down. Use it to end a coloured band,
 * a hero or a footer. Purely decorative (aria-hidden).
 *
 *   <art-drip pigment="brand" seed="hero"></art-drip>
 *
 * Attributes: pigment, seed, height (CSS length, default 4rem),
 *             count (number of drips on a 1200px edge, default 7; a narrower edge gets fewer,
 *                    never the same drips squeezed together),
 *             run (the drips run down once, together, when they scroll into view; the edge shows at once)
 *             stagger (the drips are not there at first: each waits a few seconds, then runs down
 *                      on its own time. Use it on the hero; <art-header> picks the same drips up.)
 *             flush (the drips hang directly off the edge above, with no band of paint under it.
 *                    Use it on the hero, so its drips line up with the header's.)
 */
const dripCss = sheet(`
  :host { display: block; block-size: var(--art-drip-height, 4rem); pointer-events: none; margin-block-start: -1px; }
  svg { inline-size: 100%; block-size: 100%; overflow: visible; }
  /* flush: no band of paint under the edge it hangs from. The band (the top 22%) slides up
     behind that edge, so the drips hang directly off it. */
  :host([flush]) { margin-block-start: calc(var(--art-drip-height, 4rem) * -0.22); }
  /* paint runs down: the wet edge is there at once, the drips grow out of it */
  :host([run]) svg { clip-path: inset(-20% -1% 72% -1%); }
  :host([run][data-running]) svg { clip-path: inset(-20% -1% -20% -1%); transition: clip-path var(--dur-drip) var(--ease-drip); }
  /* staggered: every drip sits behind its own shutter, which opens downwards after its own wait */
  .shutter {
    transform-box: fill-box; transform-origin: 50% 0;
    /* long drips take longer: they have further to run */
    /* --art-drip-elapsed lets a copy join in mid-run, in step with the original */
    animation: open calc(var(--dur-drip) * var(--k)) var(--ease-drip) calc(var(--wait) - var(--art-drip-elapsed, 0s) - var(--since, 0s)) both;
  }
  @keyframes open { from { transform: scaleY(0); } to { transform: scaleY(1); } }
  @media (prefers-reduced-motion: reduce) { .shutter { animation: none; } }
`);

// The drips are designed on a 1200-unit wide edge: `count` is how many hang from that much edge,
// and each unit is drawn 1.2px wide. A narrower edge is not that picture squeezed: it gets
// fewer drips, each at its normal width.
const DESIGN_WIDTH = 1200, UNIT = 1.2, H = 100;

class ArtDrip extends HTMLElement {
  #ro; #width = 0;
  constructor() { super(); this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [dripCss]; }
  connectedCallback() {
    this.setAttribute('aria-hidden', 'true');
    if (this.hasAttribute('height')) this.style.setProperty('--art-drip-height', this.getAttribute('height'));
    this.startedAt = performance.now(); // so <art-header> can show the same drips at the same moment
    this.render();
    // paint again when the edge gets wider or narrower (not on every pixel: the drips would jump)
    this.#ro = new ResizeObserver(() => {
      const width = this.getBoundingClientRect().width;
      if (width && Math.abs(width - this.#width) > 24) this.render();
    });
    this.#ro.observe(this);
    if (this.hasAttribute('run') && !reducedMotion()) {
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { this.setAttribute('data-running', ''); io.disconnect(); }
      }, { threshold: 0.3 });
      io.observe(this);
    } else this.setAttribute('data-running', '');
  }
  disconnectedCallback() { this.#ro?.disconnect(); }

  render() {
    const width = this.getBoundingClientRect().width || DESIGN_WIDTH * UNIT;
    this.#width = width;
    const seed = seedFrom(this.getAttribute('seed'), 11);
    const full = Number(this.getAttribute('count')) || 7;
    // as many drips as fit this edge at the designed spacing, at least two
    const W = Math.round(width / UNIT);
    const count = Math.max(2, Math.min(full, Math.round(full * W / DESIGN_WIDTH)));
    const { d, drips } = dripEdge(W, H, seed, count);
    const fill = paint(this.getAttribute('pigment'), 'accent');
    const stagger = this.hasAttribute('stagger');
    // painted again after a resize, staggered drips carry on from where they were
    const since = ((performance.now() - this.startedAt) / 1000).toFixed(2);
    this.shadowRoot.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" focusable="false" style="--since:${since}s">
        <defs>${roughFilter(`d${seed}`, seed, 3, 0.02)}${stagger ? this.shutters(`m${seed}`, drips, W, H, seed) : ''}</defs>
        <g${stagger ? ` mask="url(#m${seed})"` : ''}><path class="drop" d="${d}" fill="${fill}" filter="url(#d${seed})"/></g>
      </svg>`;
  }

  /** A mask for staggered drips: the wet edge shows at once, each drip has a shutter of its own. */
  shutters(id, drips, W, H, seed) {
    const base = H * 0.22, r = rng(seed + 1);
    const rects = drips.map(({ x, len, w }) => {
      const wait = (1.5 + r() * 4).toFixed(2), k = (0.6 + (len - base) / (H - base)).toFixed(2);
      return `<rect class="shutter" style="--wait:${wait}s;--k:${k}" x="${(x - 8).toFixed(1)}" y="${base + 3}" width="${(w + 16).toFixed(1)}" height="${(len - base + 12).toFixed(1)}" fill="#fff"/>`;
    }).join('');
    return `<mask id="${id}" maskUnits="userSpaceOnUse" x="-20" y="-20" width="${W + 40}" height="${H + 60}">
      <rect x="-20" y="-20" width="${W + 40}" height="${base + 23}" fill="#fff"/>${rects}</mask>`;
  }

  /** Let the paint run again (used by the docs demo). */
  replay() {
    if (this.hasAttribute('stagger')) { this.startedAt = performance.now(); this.render(); return; }
    if (reducedMotion()) return;
    this.removeAttribute('data-running');
    requestAnimationFrame(() => requestAnimationFrame(() => this.setAttribute('data-running', '')));
  }
}

/**
 * <art-splatter> — a flick of paint. Use one per view at most: on an empty state, a 404,
 * or tucked behind a heading. Purely decorative (aria-hidden).
 *
 *   <art-splatter pigment="complement" seed="404" size="14rem"></art-splatter>
 *
 * Attributes: pigment, seed, size (CSS length, default 10rem)
 */
const splatCss = sheet(`
  :host { display: inline-block; inline-size: var(--art-splatter-size, 10rem); aspect-ratio: 1; pointer-events: none; }
  svg { inline-size: 100%; block-size: 100%; overflow: visible; }
`);

class ArtSplatter extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [splatCss]; }
  connectedCallback() {
    this.setAttribute('aria-hidden', 'true');
    if (this.hasAttribute('size')) this.style.setProperty('--art-splatter-size', this.getAttribute('size'));
    const seed = seedFrom(this.getAttribute('seed'), 21);
    const fill = paint(this.getAttribute('pigment'), 'accent');
    this.shadowRoot.innerHTML = `
      <svg viewBox="0 0 200 200" focusable="false">
        <defs>${roughFilter(`sp${seed}`, seed, 4, 0.06)}</defs>
        <g filter="url(#sp${seed})">${splatter(200, 200, seed, fill)}</g>
      </svg>`;
  }
}

define('art-drip', ArtDrip);
define('art-splatter', ArtSplatter);
export { ArtDrip, ArtSplatter };
