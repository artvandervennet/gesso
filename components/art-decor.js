import { dripEdge, splatter, roughFilter, paint, seedFrom, sheet, define, reducedMotion } from './brush.js';

/**
 * <art-drip> — a wet edge with paint running down. Use it to end a coloured band,
 * a hero or a footer. Purely decorative (aria-hidden).
 *
 *   <art-drip pigment="brand" seed="hero"></art-drip>
 *
 * Attributes: pigment, seed, count (number of drips, default 7), height (CSS length, default 4rem),
 *             run (the drips run down once when they scroll into view; the edge shows at once)
 */
const dripCss = sheet(`
  :host { display: block; block-size: var(--art-drip-height, 4rem); pointer-events: none; margin-block-start: -1px; }
  svg { inline-size: 100%; block-size: 100%; overflow: visible; }
  /* paint runs down: the wet edge is there at once, the drips grow out of it */
  :host([run]) svg { clip-path: inset(-20% -1% 72% -1%); }
  :host([run][data-running]) svg { clip-path: inset(-20% -1% -20% -1%); transition: clip-path var(--dur-drip) var(--ease-drip); }
`);

class ArtDrip extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [dripCss]; }
  connectedCallback() {
    this.setAttribute('aria-hidden', 'true');
    if (this.hasAttribute('height')) this.style.setProperty('--art-drip-height', this.getAttribute('height'));
    const seed = seedFrom(this.getAttribute('seed'), 11);
    const count = Number(this.getAttribute('count')) || 7;
    const W = 1200, H = 100;
    const { d } = dripEdge(W, H, seed, count);
    const fill = paint(this.getAttribute('pigment'), 'accent');
    this.shadowRoot.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" focusable="false">
        <defs>${roughFilter(`d${seed}`, seed, 3, 0.02)}</defs>
        <path class="drop" d="${d}" fill="${fill}" filter="url(#d${seed})"/>
      </svg>`;
    if (this.hasAttribute('run') && !reducedMotion()) {
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { this.setAttribute('data-running', ''); io.disconnect(); }
      }, { threshold: 0.3 });
      io.observe(this);
    } else this.setAttribute('data-running', '');
  }

  /** Let the paint run again (used by the docs demo). */
  replay() {
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
