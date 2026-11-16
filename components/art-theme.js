import { sheet, define } from './brush.js';
import { THEMES } from './themes.js';

/**
 * <art-theme> — a row of palettes to switch the page's theme.
 * Each website normally sets its theme once: <html data-theme="harbour">. Use this picker
 * where people should be able to compare themes, like these docs.
 * Sets data-theme on <html>, remembers the choice on this device, fires `gesso:themechange`.
 *
 *   <art-theme></art-theme>
 *
 * Attributes
 *   label  accessible name of the group (default "Theme")
 *   remember  keep the choice in localStorage (off unless present)
 */
const KEY = 'gesso-theme';
const css = sheet(`
  :host { display: block; }
  .group { display: flex; flex-wrap: wrap; gap: var(--space-3); }
  button {
    all: unset; box-sizing: border-box; cursor: pointer;
    display: grid; gap: var(--space-2); min-inline-size: 9.5rem; padding: var(--space-3);
    background: var(--surface-raised); color: var(--ink);
    border-radius: var(--radius-chip); box-shadow: 0 0 0 1px var(--rule), var(--shadow-tape);
    font: var(--weight-medium) var(--step--1)/1.2 var(--font-body);
    transition: box-shadow var(--dur-dab) var(--ease-brush);
  }
  button:hover { box-shadow: 0 0 0 2px var(--ink-muted), var(--shadow-tape); }
  button:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
  button[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--ink), var(--shadow-tape); font-weight: var(--weight-bold); }
  .dabs { display: flex; gap: 4px; }
  .dab { inline-size: 1.25rem; aspect-ratio: 1; border-radius: 48% 52% 45% 55% / 55% 45% 55% 45%; box-shadow: inset 0 0 0 1px oklch(0% 0 0 / 0.12); }
  .strip { display: flex; block-size: 0.55rem; border-radius: 2px; overflow: hidden; }
  .strip span { flex: 1; }
  .name { display: flex; justify-content: space-between; gap: var(--space-2); }
  .check { visibility: hidden; }
  button[aria-pressed="true"] .check { visibility: visible; }
`);

function read() { try { return localStorage.getItem(KEY); } catch { return null; } }
function write(v) { try { localStorage.setItem(KEY, v); } catch {} }

class ArtTheme extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [css]; }

  connectedCallback() {
    if (this.hasAttribute('remember')) {
      const saved = read();
      if (saved && THEMES.some((t) => t.id === saved) && document.documentElement.dataset.theme !== saved) {
        document.documentElement.dataset.theme = saved;
        queueMicrotask(() => document.dispatchEvent(new CustomEvent('gesso:themechange', { detail: { theme: saved } })));
      }
    }
    this.shadowRoot.innerHTML = `<div class="group" role="group">${THEMES.map((t) => `
      <button type="button" data-id="${t.id}" aria-pressed="false" title="${t.description}">
        <span class="name"><span>${t.label}</span><span class="check" aria-hidden="true">●</span></span>
        <span class="dabs" aria-hidden="true">${['brand', 'partner', 'complement'].map((k) => `<span class="dab" style="background:${t.pigments[k].hex}"></span>`).join('')}</span>
        <span class="strip" aria-hidden="true"><span style="background:${t.deep}"></span>${t.paints.map((c) => `<span style="background:${c}"></span>`).join('')}</span>
      </button>`).join('')}</div>`;
    this.shadowRoot.querySelector('.group').setAttribute('aria-label', this.getAttribute('label') || 'Theme');
    this.shadowRoot.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => this.choose(b.dataset.id)));
    this.sync();
    // stay in step with other pickers on the page
    document.addEventListener('gesso:themechange', () => this.sync());
  }

  get current() { return document.documentElement.dataset.theme || THEMES[0].id; }

  choose(id) {
    document.documentElement.dataset.theme = id;
    if (this.hasAttribute('remember')) write(id);
    this.sync();
    document.dispatchEvent(new CustomEvent('gesso:themechange', { detail: { theme: id } }));
  }

  sync() {
    this.shadowRoot.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === this.current)));
  }
}

define('art-theme', ArtTheme);
export { ArtTheme };
