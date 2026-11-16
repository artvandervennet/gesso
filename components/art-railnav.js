import { sheet, define } from './brush.js';

/**
 * <art-railnav> — section navigation drawn as a git branch.
 * A painted lane runs beside the links with a dab per section: sections you've passed are
 * filled, the one you're in is bigger with a ring, the ones ahead are hollow. As you scroll,
 * paint runs down the lane to the current dab. The current link gets aria-current="location".
 *
 *   <art-railnav label="On this page">
 *     <a href="#principles">Principles</a>
 *     <a href="#pigments">Pigments</a>
 *   </art-railnav>
 *
 * Attributes
 *   label  accessible name of the navigation landmark (default "Sections")
 */
const css = sheet(`
  :host { display: block; }
  nav {
    position: relative; display: flex; flex-direction: column;
    padding: var(--space-4) var(--space-4) var(--space-4) calc(var(--space-8) + var(--space-2));
    background: var(--surface-raised); color: var(--ink);
    border-radius: var(--radius-chip); box-shadow: 0 0 0 1px var(--rule), var(--shadow-tape);
  }
  ::slotted(a) {
    display: block; min-block-size: 2rem; padding-block: 0.4rem;
    color: var(--ink-muted); text-decoration: none;
    font: var(--weight-medium) var(--step--1)/1.25 var(--font-body);
    transition: color var(--dur-wash) var(--ease-brush);
  }
  ::slotted(a:hover) { color: var(--ink); text-decoration: underline; text-decoration-thickness: 0.08em; text-underline-offset: 0.2em; }
  ::slotted(a[aria-current]) { color: var(--ink); font-weight: var(--weight-bold); }
  ::slotted(a:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: 2px; }

  .lane {
    display: block; position: absolute; inline-size: 4px; border-radius: 2px;
    inset-inline-start: calc(var(--space-4) + 3px);
    background: color-mix(in oklch, var(--accent) 28%, transparent);
  }
  .wet {
    display: block; inline-size: 100%; block-size: var(--progress, 0px); border-radius: inherit; background: var(--accent);
    transition: block-size var(--dur-wash) var(--ease-brush);
  }
  .dab {
    position: absolute; inline-size: 10px; block-size: 10px; margin: -5px 0 0 -5px;
    inset-inline-start: calc(var(--space-4) + 5px);
    border-radius: 48% 52% 45% 55% / 55% 45% 55% 45%;
    background: var(--surface-raised); box-shadow: inset 0 0 0 2px var(--accent);
    transition: background-color var(--dur-wash) var(--ease-settle), transform var(--dur-wash) var(--ease-settle), box-shadow var(--dur-wash) var(--ease-settle);
  }
  .dab.done { background: var(--accent); }
  .dab.cur {
    background: var(--accent); transform: scale(1.45);
    box-shadow: inset 0 0 0 2px var(--accent), 0 0 0 2px var(--surface-raised), 0 0 0 3.5px color-mix(in oklch, var(--accent) 50%, transparent);
  }
  @media (prefers-reduced-motion: reduce) { .wet, .dab, ::slotted(a) { transition: none; } }
`);

class ArtRailnav extends HTMLElement {
  #io; #ro;
  constructor() { super(); this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [css]; }

  connectedCallback() {
    this.links = [...this.querySelectorAll(':scope > a[href^="#"]')];
    this.shadowRoot.innerHTML = `<nav part="rail"><span class="lane" aria-hidden="true"><span class="wet"></span></span>${this.links.map(() => '<span class="dab" aria-hidden="true"></span>').join('')}<slot></slot></nav>`;
    this.shadowRoot.querySelector('nav').setAttribute('aria-label', this.getAttribute('label') || 'Sections');
    this.dabs = [...this.shadowRoot.querySelectorAll('.dab')];
    this.current = -1;

    this.#ro = new ResizeObserver(() => this.layout());
    this.#ro.observe(this);
    document.fonts?.ready.then(() => this.layout());

    const targets = this.links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))));
    const visible = new Set();
    this.#io = new IntersectionObserver((entries) => {
      for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
      const i = targets.findIndex((t) => t && visible.has(t));
      if (i !== -1) this.select(i);
    }, { rootMargin: '-20% 0px -55% 0px' });
    targets.forEach((t) => t && this.#io.observe(t));
  }

  disconnectedCallback() { this.#io?.disconnect(); this.#ro?.disconnect(); }

  /** Put a dab beside each link and size the lane from the first dab to the last. */
  layout() {
    const nav = this.shadowRoot.querySelector('nav').getBoundingClientRect();
    this.ys = this.links.map((a) => { const r = a.getBoundingClientRect(); return r.top - nav.top + r.height / 2; });
    this.dabs.forEach((d, i) => { d.style.top = `${this.ys[i]}px`; });
    const lane = this.shadowRoot.querySelector('.lane');
    lane.style.top = `${this.ys[0]}px`;
    lane.style.height = `${this.ys.at(-1) - this.ys[0]}px`;
    this.paint();
  }

  select(i) {
    if (i === this.current) return;
    this.current = i;
    this.links.forEach((a, k) => (k === i ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
    this.paint();
  }

  paint() {
    if (!this.ys) return;
    const i = this.current;
    this.dabs.forEach((d, k) => { d.classList.toggle('done', k < i); d.classList.toggle('cur', k === i); });
    const wet = i < 0 ? 0 : this.ys[i] - this.ys[0];
    this.shadowRoot.querySelector('.lane').style.setProperty('--progress', `${wet}px`);
  }
}

define('art-railnav', ArtRailnav);
export { ArtRailnav };
