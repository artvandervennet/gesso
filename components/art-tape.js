import { rng, seedFrom, paint, sheet, define } from './brush.js';

/**
 * <art-tape> — a strip of masking tape used as a tag or label.
 * Dark ink on tape in the complement colour.
 *
 *   <art-tape>ActivityPub</art-tape>
 *   <art-tape pigment="brand">Live</art-tape>
 *
 * Attributes
 *   pigment  adds a dab of colour before the text (the text must still say what the colour means)
 *   seed     changes the tear and tilt; defaults to the text
 *   flat     no tilt, for dense lists
 */
const css = sheet(`
  :host {
    display: inline-flex; align-items: center; gap: 0.4em;
    font: var(--weight-medium) var(--step--1)/1.2 var(--font-body);
    color: var(--on-tape);
    background: var(--tape);
    background-image: repeating-linear-gradient(90deg, oklch(100% 0 0 / 0.08) 0 2px, transparent 2px 5px);
    padding: 0.3em 0.85em !important; /* holds against a page reset; see art-button.js */
    box-shadow: var(--shadow-tape);
    transform: rotate(var(--tilt, 0deg));
    clip-path: var(--tear);
    white-space: nowrap;
  }
  :host([flat]) { transform: none; }
  .dab { inline-size: 0.7em; aspect-ratio: 1; border-radius: 48% 52% 45% 55% / 55% 45% 55% 45%; background: var(--dab); flex: none; }
`);

class ArtTape extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [css]; }
  connectedCallback() {
    const r = rng(seedFrom(this.getAttribute('seed') ?? this.textContent.trim(), 2));
    const j = () => (r() * 3).toFixed(1);
    // torn ends: a zig-zag on the left and right edges
    const left = [0, 25, 50, 75, 100].map((y) => `${j()}% ${y}%`);
    const right = [100, 75, 50, 25, 0].map((y) => `${(100 - Number(j())).toFixed(1)}% ${y}%`);
    this.style.setProperty('--tear', `polygon(${[...left, ...right].join(', ')})`);
    this.style.setProperty('--tilt', `${((r() - 0.5) * 4).toFixed(1)}deg`);
    const pigment = this.getAttribute('pigment');
    this.shadowRoot.innerHTML = `${pigment ? `<span class="dab" style="--dab:${paint(pigment)}" aria-hidden="true"></span>` : ''}<slot></slot>`;
  }
}

define('art-tape', ArtTape);
export { ArtTape };
