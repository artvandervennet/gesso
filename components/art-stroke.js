import { strokePath, bristles, roughFilter, paint, seedFrom, sheet, define } from './brush.js';

/**
 * <art-stroke> — a hand-painted brushstroke behind or under inline text.
 *
 * Attributes
 *   variant  "underline" (default) | "highlight" | "strike"
 *   pigment  pigment or role: brand, partner, complement, …, stroke, highlight. Default depends on variant.
 *   seed     any number or word; the same seed paints the same stroke
 *   animate  paint the stroke in when it scrolls into view (skipped with reduced motion)
 *
 * Custom properties: --art-stroke-offset, --art-stroke-size (underline position and thickness, in em),
 *                    --art-stroke-paper (colour showing through dry-brush streaks; set it on coloured backgrounds)
 *
 * The text stays plain text: the stroke is aria-hidden decoration.
 */
const css = sheet(`
  :host { position: relative; display: inline; isolation: isolate; }
  svg {
    position: absolute; z-index: -1; pointer-events: none; overflow: visible;
    inset-inline: -0.12em; inline-size: calc(100% + 0.24em);
  }
  :host([variant="underline"]) svg, :host(:not([variant])) svg { inset-block-end: var(--art-stroke-offset, -0.28em); block-size: var(--art-stroke-size, 0.38em); }
  :host([variant="highlight"]) svg { inset-block: 0.12em -0.04em; block-size: auto; inset-inline: -0.25em; inline-size: calc(100% + 0.5em); }
  :host([variant="strike"]) svg { inset-block-start: 0.48em; block-size: 0.22em; z-index: 1; opacity: 0.85; }
  .paint { clip-path: inset(0 100% 0 0); }
  :host(:not([animate])) .paint, :host([data-painted]) .paint { clip-path: inset(0 0 0 0); }
  :host([data-painted]) .paint { transition: clip-path var(--dur-stroke) var(--ease-brush); }
  :host([variant="highlight"]) .paint { opacity: var(--art-stroke-highlight-opacity, 0.55); }
  @media (prefers-reduced-motion: reduce) { .paint { clip-path: none !important; } }
`);

class ArtStroke extends HTMLElement {
  static observedAttributes = ['variant', 'pigment', 'seed'];
  #io;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [css];
  }

  connectedCallback() {
    this.render();
    if (this.hasAttribute('animate')) {
      this.#io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { requestAnimationFrame(() => this.setAttribute('data-painted', '')); this.#io.disconnect(); }
      }, { threshold: 0.6 });
      this.#io.observe(this);
    }
  }
  disconnectedCallback() { this.#io?.disconnect(); }
  attributeChangedCallback() { if (this.shadowRoot.childElementCount) this.render(); }

  render() {
    const variant = this.getAttribute('variant') || 'underline';
    const seed = seedFrom(this.getAttribute('seed') ?? this.textContent, 3);
    const pigment = paint(this.getAttribute('pigment'), variant === 'highlight' ? 'highlight' : 'stroke');
    const W = 300, H = variant === 'highlight' ? 60 : 24;
    const id = `r${seed}`;
    const streaks = bristles(W, H, seed, variant === 'highlight' ? 6 : 3)
      .map((b) => `<path d="${b.d}" stroke="var(--art-stroke-paper, var(--surface))" stroke-width="${b.w}" stroke-linecap="round" opacity=".55"/>`).join('');
    // no white space around the slot: it would show as a gap between the word and a full stop after it
    this.shadowRoot.innerHTML = `<slot></slot><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs>${roughFilter(id, seed, variant === 'highlight' ? 4 : 2.5)}</defs>
        <g class="paint" filter="url(#${id})">
          <path d="${strokePath(W, H, seed, { taper: variant === 'highlight' ? 0.08 : 0.2 })}" fill="${pigment}"/>
          ${streaks}
        </g>
      </svg>`;
  }
}

define('art-stroke', ArtStroke);
export { ArtStroke };
