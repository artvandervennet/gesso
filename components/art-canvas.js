import { strokePath, roughFilter, paint, rng, seedFrom, PIGMENTS, sheet, define } from './brush.js';

/**
 * <art-canvas> — a stretched canvas for a project, post or case study.
 * Put an image in slot="media", or leave it out and the canvas paints its own study.
 * The first link inside becomes the card's target: clicking anywhere on the canvas follows it,
 * while keyboard and screen reader users get one clean link.
 *
 *   <art-canvas pigment="complement">
 *     <h3><a href="/work/solid-notes">Solid notes</a></h3>
 *     <p>A notes app that keeps your data in your own pod.</p>
 *   </art-canvas>
 *
 * Attributes
 *   pigment  main colour of the painted study (default: brand)
 *   seed     changes the painted study
 *   wet      mark as work in progress: shows a "Still wet" tag
 *   bare     no painted study when there is no image: a text-only canvas
 */
const css = sheet(`
  :host {
    display: flex; flex-direction: column;
    background: var(--surface-raised);
    border-radius: var(--radius-canvas);
    /* no outline: the canvas stands off the wall by its shadow alone */
    box-shadow: var(--shadow-tape), 0 10px 28px -18px oklch(20% 0.03 200 / 0.45);
    position: relative;
    transition: scale var(--dur-dab) var(--ease-brush), box-shadow var(--dur-dab) var(--ease-brush);
  }
  :host([data-linked]) { cursor: pointer; }
  /* On hover a linked canvas grows a little, in place: it is scaled, not resized, so the
     canvases around it stay exactly where they are. */
  :host([data-linked]:hover) { scale: 1.03; z-index: 1; box-shadow: var(--shadow-tape), var(--shadow-lifted); }
  @media (prefers-reduced-motion: reduce) { :host { transition: none; } }
  /* bare: no painted study. For a canvas with nothing to show, which is better than decoration. */
  :host([bare]) .media:not(.has-image) { display: none; }
  :host([bare]) .body { padding-block-start: var(--space-6); }
  :host(:focus-within) { box-shadow: var(--shadow-tape), 0 0 0 3px var(--surface), 0 0 0 6px var(--focus); }
  .media { aspect-ratio: 4 / 3; overflow: hidden; border-block-end: 1px solid var(--rule); background: var(--canvas); }
  ::slotted([slot="media"]) { display: block; inline-size: 100%; block-size: 100%; object-fit: cover; }
  .study { inline-size: 100%; block-size: 100%; }
  .body { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-4) var(--space-6) var(--space-6); flex: 1; }
  ::slotted(h2), ::slotted(h3) { font-size: var(--step-2) !important; margin: 0; }
  ::slotted(p) { color: var(--ink-muted); margin: 0; }
  .wet {
    position: absolute; inset-block-start: var(--space-3); inset-inline-end: var(--space-3);
    font: var(--weight-bold) var(--step--1)/1 var(--font-body);
    background: var(--tape); color: var(--on-tape);
    padding: var(--space-1) var(--space-3); transform: rotate(3deg);
    box-shadow: var(--shadow-tape);
    clip-path: polygon(2% 0, 98% 4%, 100% 100%, 0 96%);
  }
`);

class ArtCanvas extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [css];
  }
  connectedCallback() {
    const seed = seedFrom(this.getAttribute('seed') ?? this.textContent.trim().slice(0, 40), 9);
    const hasMedia = !!this.querySelector(':scope > [slot="media"]');
    this.shadowRoot.innerHTML = `
      <div class="media${hasMedia ? ' has-image' : ''}" part="media"><slot name="media">${hasMedia || this.hasAttribute('bare') ? '' : this.study(seed)}</slot></div>
      <div class="body" part="body"><slot></slot></div>
      ${this.hasAttribute('wet') ? '<span class="wet">Still wet</span>' : ''}`;
    const link = this.querySelector('a[href]');
    if (link) {
      this.setAttribute('data-linked', '');
      this.addEventListener('click', (e) => {
        if (e.target.closest('a, button, input, select, textarea, summary')) return;
        if (getSelection()?.toString()) return; // let people select text
        link.click();
      });
    }
  }

  /** A small abstract painting: three strokes in the main pigment and two supporting ones. */
  study(seed) {
    const r = rng(seed);
    const main = this.getAttribute('pigment') || 'brand';
    const others = PIGMENTS.filter((p) => p !== main);
    const pick = () => others[Math.floor(r() * others.length)];
    const strokes = [
      [main, 0.12, 0.2, 0.9, 0.24], [main, 0.3, 0.48, 0.75, 0.2], [pick(), 0.05, 0.7, 0.6, 0.14],
      [main, 0.45, 0.78, 0.5, 0.12], ['partner', 0.6, 0.12, 0.3, 0.1],
    ].map(([p, x, y, w, h], i) => {
      const W = 400 * w, H = 300 * h, rot = (r() - 0.5) * (i === 4 ? 70 : 26);
      return `<g transform="translate(${400 * x} ${300 * y}) rotate(${rot.toFixed(1)})"><path d="${strokePath(W, H, seed + i)}" fill="${paint(p)}" filter="url(#s${seed})" opacity="${(0.85 + r() * 0.15).toFixed(2)}"/></g>`;
    }).join('');
    return `<svg class="study" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>${roughFilter(`s${seed}`, seed, 5, 0.035)}</defs>${strokes}</svg>`;
  }
}

define('art-canvas', ArtCanvas);
export { ArtCanvas };
