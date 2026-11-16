import { sheet, define } from './brush.js';

/**
 * <art-swatch> — a paint chip that documents one colour token.
 * Shows the colour, its pigment code, its hex value in the current theme and its contrast
 * against the page. Activating the chip copies `var(--token)`.
 *
 *   <art-swatch token="--pigment-brand" name="Brand"></art-swatch>
 *
 * Attributes
 *   token  CSS custom property (required)
 *   name   display name; defaults to the token
 *   code   pigment code or short note
 *   size   "s" for a compact chip
 */
const css = sheet(`
  :host { display: block; container-type: inline-size; }
  button {
    all: unset; box-sizing: border-box; display: grid; inline-size: 100%;
    background: var(--surface-raised); color: var(--ink);
    border-radius: var(--radius-chip);
    box-shadow: 0 0 0 1px var(--rule), var(--shadow-tape);
    cursor: copy; overflow: hidden;
    transition: box-shadow var(--dur-dab) var(--ease-brush);
  }
  button:hover { box-shadow: 0 0 0 2px var(--ink), var(--shadow-tape); }
  button:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
  .paint {
    block-size: 6.5rem; background: var(--c);
    /* a wet sheen across the top of the chip */
    background-image: linear-gradient(170deg, oklch(100% 0 0 / 0.22), transparent 40%);
    position: relative;
  }
  :host([size="s"]) .paint { block-size: 3.5rem; }
  .label { display: grid; gap: 0.1rem; padding: var(--space-3) var(--space-4) var(--space-4); }
  .name { font: var(--step-1)/1.2 var(--font-display); }
  :host([size="s"]) .name { font-size: var(--step-0); }
  .meta { font: 0.8rem/1.5 var(--font-mono); color: var(--ink-muted); }
  .meta > span { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  :host([size="s"]) .token, :host([size="s"]) .ratios { display: none; }
  .ratios { display: flex; gap: var(--space-3); margin-block-start: var(--space-2); font: var(--weight-medium) var(--step--1)/1.3 var(--font-body); color: var(--ink-muted); }
  .toast {
    position: absolute; inset-inline-end: var(--space-2); inset-block-start: var(--space-2);
    background: var(--surface-raised); color: var(--ink); font: var(--weight-bold) var(--step--1)/1 var(--font-body);
    padding: var(--space-1) var(--space-2); border-radius: var(--radius-chip); opacity: 0;
    transition: opacity var(--dur-dab);
  }
  .toast[data-show] { opacity: 1; }
`);

const ctx = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 1;
  return c.getContext('2d', { willReadFrequently: true });
})();

function rgbOf(color) {
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = '#000'; ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
  return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
}
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const hex = (rgb) => '#' + rgb.map((n) => n.toString(16).padStart(2, '0')).join('');

class ArtSwatch extends HTMLElement {
  #off = [];
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [css];
  }
  connectedCallback() {
    const token = this.getAttribute('token');
    const name = this.getAttribute('name') || token;
    const code = this.getAttribute('code') || '';
    this.shadowRoot.innerHTML = `
      <button type="button" part="chip">
        <span class="paint" style="--c: var(${token})"><span class="toast" role="status" aria-live="polite"></span></span>
        <span class="label">
          <span class="name">${name}</span>
          <span class="meta">${code ? `<span>${code}</span>` : ''}<span class="token">${token}</span><span class="hex"></span></span>
          <span class="ratios"></span>
        </span>
      </button>`;
    const btn = this.shadowRoot.querySelector('button');
    btn.setAttribute('aria-label', `${name}. Copy var(${token})`);
    btn.addEventListener('click', () => this.copy());
    this.measure();
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const re = () => requestAnimationFrame(() => this.measure());
    mq.addEventListener('change', re);
    document.addEventListener('gesso:themechange', re);
    this.#off = [() => mq.removeEventListener('change', re), () => document.removeEventListener('gesso:themechange', re)];
  }
  disconnectedCallback() { this.#off.forEach((f) => f()); }

  measure() {
    const cs = getComputedStyle(this);
    const token = this.getAttribute('token');
    const c = rgbOf(cs.getPropertyValue(token).trim());
    const surface = rgbOf(cs.getPropertyValue('--surface').trim());
    const ink = rgbOf(cs.getPropertyValue('--ink').trim());
    const onSurface = contrast(c, surface), withInk = contrast(c, ink);
    this.shadowRoot.querySelector('.hex').textContent = hex(c);
    this.shadowRoot.querySelector('.ratios').innerHTML =
      `<span title="Contrast against the page background">${onSurface.toFixed(1)}:1 on page</span>` +
      `<span title="Contrast with the body text colour">${withInk.toFixed(1)}:1 with ink</span>`;
  }

  async copy() {
    const toast = this.shadowRoot.querySelector('.toast');
    const value = `var(${this.getAttribute('token')})`;
    try { await navigator.clipboard.writeText(value); toast.textContent = 'Copied'; }
    catch { toast.textContent = value; }
    toast.setAttribute('data-show', '');
    clearTimeout(this._t);
    this._t = setTimeout(() => toast.removeAttribute('data-show'), 1600);
  }
}

define('art-swatch', ArtSwatch);
export { ArtSwatch };
