import { rng, seedFrom, dripShape, roughFilter, sheet, define } from './brush.js';

/**
 * <art-button> — styles a real <button> or <a> as a dab of paint.
 * Wrap the native element; it keeps its semantics, focus, forms and keyboard behaviour.
 *
 *   <art-button><button type="submit">Send message</button></art-button>
 *   <art-button variant="secondary"><a href="/work">See my work</a></art-button>
 *
 * Attributes
 *   variant  "primary" (default) | "secondary" | "quiet"
 *   size     "s" | "m" (default) | "l"
 *   nodrip   turn off the drip on hover
 */
const css = sheet(`
  :host { display: inline-block; position: relative; vertical-align: middle; isolation: isolate;
    --base: var(--accent); --fill: color-mix(in oklch, var(--accent), black 24%); --ink-base: var(--on-accent); --ink-fill: var(--on-accent); --ring: transparent; }
  ::slotted(button), ::slotted(a) {
    all: unset;
    box-sizing: border-box; position: relative; z-index: 1;
    display: inline-flex; align-items: center; gap: var(--space-2);
    min-block-size: 2.75rem; /* 44px target */
    padding: var(--space-2) var(--space-6);
    font: var(--weight-bold) var(--step-0)/1.2 var(--font-body);
    border-radius: var(--radius-dab);
    cursor: pointer;
    text-decoration: none;
    background: transparent;
    color: var(--ink-base);
    /* text changes colour when the paint is about halfway, coming and going */
    transition: color var(--dur-dab) linear calc(var(--dur-wash) * 0.55);
  }
  :host([size="s"]) ::slotted(*) { min-block-size: 2.25rem; padding: var(--space-1) var(--space-4); font-size: var(--step--1); }
  :host([size="l"]) ::slotted(*) { min-block-size: 3.25rem; padding: var(--space-3) var(--space-8); font-size: var(--step-1); }

  /* The button never moves. On hover or focus, paint spreads from the centre until it's full. */
  .paint { position: absolute; inset: 0; z-index: 0; border-radius: var(--radius-dab); overflow: hidden; background: var(--base); box-shadow: inset 0 0 0 2px var(--ring); pointer-events: none; }
  .blob {
    position: absolute; inset-block-start: 50%; inset-inline-start: 50%;
    inline-size: var(--d, 300px); aspect-ratio: 1; margin: calc(var(--d, 300px) / -2) 0 0 calc(var(--d, 300px) / -2);
    border-radius: 47% 53% 44% 56% / 56% 44% 56% 44%;
    background: var(--fill); transform: scale(0) rotate(-20deg);
    transition: transform calc(var(--dur-wash) * 1.25) var(--ease-brush);
  }
  :host(:hover:not([data-disabled])) .blob, :host(:focus-within:not([data-disabled])) .blob { transform: scale(1) rotate(0deg); }
  :host(:hover:not([data-disabled])) ::slotted(*), :host(:focus-within:not([data-disabled])) ::slotted(*) { color: var(--ink-fill); transition-delay: calc(var(--dur-wash) * 0.45); }

  /* primary: the brand pigment, deepening from the centre */
  /* secondary: an outline that fills with the brand pigment */
  :host([variant="secondary"]) { --base: transparent; --ring: var(--accent); --fill: var(--accent); --ink-base: var(--accent); --ink-fill: var(--on-accent); }
  /* quiet: a text link that fills with a wash */
  :host([variant="quiet"]) { --base: transparent; --fill: var(--accent-wash); --ink-base: var(--accent); --ink-fill: var(--accent); }
  :host([variant="quiet"]) ::slotted(*) { padding-inline: var(--space-3); text-decoration: underline; text-decoration-thickness: 0.08em; text-underline-offset: 0.25em; }

  ::slotted(*:focus-visible) { outline: 3px solid var(--focus); outline-offset: 3px; }
  ::slotted([disabled]), ::slotted([aria-disabled="true"]) { cursor: not-allowed; }
  :host([data-disabled]) { opacity: 0.45; }

  /* a dab of paint spreads from where the button is pressed */
  .press { position: absolute; inset: 0; z-index: 2; border-radius: var(--radius-dab); overflow: hidden; pointer-events: none; }
  .dab-press {
    position: absolute; inline-size: 12px; block-size: 12px; margin: -6px 0 0 -6px;
    border-radius: 48% 52% 45% 55% / 55% 45% 55% 45%;
    background: var(--on-accent); opacity: 0.28; transform: scale(0);
    animation: art-press calc(var(--dur-wash) * 1.5) var(--ease-settle) forwards;
  }
  :host([variant="secondary"]) .dab-press, :host([variant="quiet"]) .dab-press { background: var(--accent); opacity: 0.16; }
  @keyframes art-press { 0% { transform: scale(0); opacity: 0.32; } 55% { opacity: 0.26; } 100% { transform: scale(var(--s, 20)); opacity: 0; } }
  /* Two drips of the button's paint, drawn by the brush engine like every other drip in
     Gesso. Each hangs behind a shutter that opens downwards on hover or focus. */
  .drips { position: absolute; inset: calc(100% - 2px) 0 auto; block-size: 0; pointer-events: none; }
  .drip {
    position: absolute; inset-block-start: 0; overflow: visible;
    clip-path: inset(0 -6px 100% -6px);
    transition: clip-path var(--dur-dab) var(--ease-brush);
  }
  .drip path { fill: var(--fill); }
  :host(:hover:not([data-disabled])) .drip, :host(:focus-within:not([data-disabled])) .drip {
    clip-path: inset(0 -6px -8px -6px);
    transition: clip-path var(--dur-drip) var(--ease-drip) var(--delay);
  }
  :host([variant="secondary"]) .drips, :host([variant="quiet"]) .drips, :host([nodrip]) .drips { display: none; }
  @media (prefers-reduced-motion: reduce) { .drips, .press { display: none; } .blob { transition: none; } ::slotted(*) { transition: none !important; } }
`);

class ArtButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [css];
  }
  connectedCallback() {
    const seed = seedFrom(this.textContent.trim(), 5);
    const r = rng(seed);
    const drips = Array.from({ length: 2 }, (_, i) => {
      const left = 22 + i * 38 + r() * 18, w = 5 + r() * 4, len = 12 + r() * 10;
      const id = `b${seed}-${i}`;
      return `<svg class="drip" style="left:${left.toFixed(1)}%;--delay:${(i * 120 + r() * 80).toFixed(0)}ms" width="${w.toFixed(1)}" height="${len.toFixed(1)}" viewBox="0 0 ${w.toFixed(1)} ${len.toFixed(1)}" focusable="false">
        <defs>${roughFilter(id, seed + i, 1.2, 0.09)}</defs><path d="${dripShape(w, len)}" filter="url(#${id})"/></svg>`;
    }).join('');
    this.shadowRoot.innerHTML = `<span class="paint" aria-hidden="true"><span class="blob"></span></span><slot></slot><span class="press" aria-hidden="true"></span><span class="drips" aria-hidden="true">${drips}</span>`;
    // the paint blob has to cover the corners, so size it to the button's diagonal
    const size = () => { const b = this.getBoundingClientRect(); this.style.setProperty('--d', `${Math.ceil(Math.hypot(b.width, b.height) * 1.15)}px`); };
    new ResizeObserver(size).observe(this);
    // mirror the native disabled state so a disabled button never fills
    const el = this.firstElementChild;
    const syncDisabled = () => this.toggleAttribute('data-disabled', !!el && (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true'));
    if (el) new MutationObserver(syncDisabled).observe(el, { attributes: true, attributeFilter: ['disabled', 'aria-disabled'] });
    syncDisabled();
    this.addEventListener('pointerdown', (e) => this.press(e));
    this.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') this.press(); });
  }

  /** Decoration only: the click itself is never delayed. */
  press(e) {
    const box = this.getBoundingClientRect();
    const x = e ? e.clientX - box.left : box.width / 2, y = e ? e.clientY - box.top : box.height / 2;
    const dab = document.createElement('span');
    dab.className = 'dab-press';
    dab.style.left = `${x}px`; dab.style.top = `${y}px`;
    dab.style.setProperty('--s', String(Math.ceil((Math.hypot(box.width, box.height) * 2) / 12)));
    dab.addEventListener('animationend', () => dab.remove());
    this.shadowRoot.querySelector('.press').append(dab);
  }
}

define('art-button', ArtButton);
export { ArtButton };
