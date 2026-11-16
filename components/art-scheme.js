import { sheet, define } from './brush.js';

/**
 * <art-scheme> — one button that switches the page between light, dark and the visitor's system.
 * Every Gesso theme has a dark scheme; a page gets it through <html data-scheme>:
 *   "light" (or nothing)  light
 *   "dark"                dark
 *   "auto"                dark when the system is
 * The button shows the current choice in words and moves to the next one when pressed.
 * Sets data-scheme on <html>, fires `gesso:schemechange` on the document.
 *
 *   <art-scheme remember></art-scheme>
 *
 * To stop a flash of the wrong scheme on load, put this in <head> before the stylesheets:
 *   <script>try { const s = localStorage.getItem('gesso-scheme'); if (s) document.documentElement.dataset.scheme = s; } catch {}</script>
 *
 * Attributes
 *   remember  keep the choice in localStorage (off unless present)
 *   label     what the button switches, for its accessible name (default "Colour scheme")
 */
const KEY = 'gesso-scheme';
const ORDER = ['auto', 'light', 'dark'];
const NAME = { auto: 'System', light: 'Light', dark: 'Dark' };

const css = sheet(`
  :host { display: inline-block; }
  button {
    all: unset; box-sizing: border-box; cursor: pointer;
    display: inline-flex; align-items: center; gap: var(--space-2);
    min-block-size: 2.75rem; padding-inline: var(--space-2);
    color: var(--ink); font: var(--weight-medium) var(--step--1)/1 var(--font-body);
    border-radius: var(--radius-chip);
  }
  button:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  /* a dab of paint that shows the scheme: hollow for light, full for dark, half for the system */
  .dab {
    inline-size: 1rem; aspect-ratio: 1; flex: none;
    border-radius: 48% 52% 45% 55% / 55% 45% 55% 45%;
    box-shadow: inset 0 0 0 2px currentColor;
    background: linear-gradient(to right, currentColor var(--fill, 0%), transparent var(--fill, 0%));
  }
  :host([data-scheme="dark"]) .dab { --fill: 100%; }
  :host([data-scheme="auto"]) .dab { --fill: 50%; }
`);

function read() { try { return localStorage.getItem(KEY); } catch { return null; } }
function write(v) { try { localStorage.setItem(KEY, v); } catch {} }

class ArtScheme extends HTMLElement {
  #sync;
  constructor() { super(); this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [css]; }

  connectedCallback() {
    if (this.hasAttribute('remember')) {
      const saved = read();
      if (ORDER.includes(saved) && document.documentElement.dataset.scheme !== saved) document.documentElement.dataset.scheme = saved;
    }
    this.shadowRoot.innerHTML = '<button type="button"><span class="dab" aria-hidden="true"></span><span class="name"></span></button>';
    this.shadowRoot.querySelector('button').addEventListener('click', () => this.choose(ORDER[(ORDER.indexOf(this.current) + 1) % ORDER.length]));
    // stay in step with other switches on the page
    this.#sync = () => this.sync();
    document.addEventListener('gesso:schemechange', this.#sync);
    this.sync();
  }
  disconnectedCallback() { document.removeEventListener('gesso:schemechange', this.#sync); }

  /** "light", "dark" or "auto". A page that says nothing is light. */
  get current() {
    const scheme = document.documentElement.dataset.scheme;
    return ORDER.includes(scheme) ? scheme : 'light';
  }

  choose(scheme) {
    document.documentElement.dataset.scheme = scheme;
    if (this.hasAttribute('remember')) write(scheme);
    document.dispatchEvent(new CustomEvent('gesso:schemechange', { detail: { scheme } }));
  }

  sync() {
    const scheme = this.current, next = ORDER[(ORDER.indexOf(scheme) + 1) % ORDER.length];
    this.setAttribute('data-scheme', scheme);
    this.shadowRoot.querySelector('.name').textContent = NAME[scheme];
    this.shadowRoot.querySelector('button').setAttribute('aria-label',
      `${this.getAttribute('label') || 'Colour scheme'}: ${NAME[scheme].toLowerCase()}. Switch to ${NAME[next].toLowerCase()}.`);
  }
}

define('art-scheme', ArtScheme);
export { ArtScheme };
