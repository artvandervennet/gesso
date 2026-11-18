import { sheet, define } from './brush.js';

/**
 * <art-password> — a password field with an eye at its end that shows and hides what was typed.
 * Wrap the native <input type="password">; it keeps its label, autofill, validation and form.
 *
 *   <label for="pw">Password</label>
 *   <art-password><input id="pw" type="password" autocomplete="current-password"></art-password>
 *
 * The eye is a real button inside the field. Pressed, the input becomes a text field and the eye
 * closes; pressed again, or when the form is sent, it is a password field again, so a password
 * manager sees a password field when it offers to save. A mouse press leaves the cursor in the
 * field.
 *
 * Attributes
 *   label  the button's name (default "Show password"). It stays the same; the button says
 *          whether the password shows through aria-pressed, the way a toggle button should.
 *
 * Parts
 *   toggle  the eye button
 */
const css = sheet(`
  :host { display: block; position: relative; }
  /* room for the eye, so a long password never runs under it */
  ::slotted(input) { inline-size: 100% !important; padding-inline-end: 2.75rem !important; }
  button {
    all: unset; box-sizing: border-box; cursor: pointer;
    position: absolute; inset-block: 0; inset-inline-end: 0;
    display: grid; place-items: center;
    inline-size: 2.75rem; min-block-size: 2.75rem; /* 44px target */
    color: var(--ink-muted); border-radius: var(--radius-chip);
  }
  button:hover { color: var(--ink); }
  button:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; }
  svg { inline-size: 1.25rem; block-size: 1.25rem; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
  .shut { display: none; }
  :host([data-shown]) .open { display: none; }
  :host([data-shown]) .shut { display: block; }
`);

// An eye, and the same eye closed: its lid and lashes. Drawn with the ink, no fill.
const EYES = `
  <svg class="open" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M2.5 12c2.2-4.2 5.6-6.5 9.5-6.5s7.3 2.3 9.5 6.5c-2.2 4.2-5.6 6.5-9.5 6.5S4.7 16.2 2.5 12z"/>
    <circle cx="12" cy="12" r="3.2"/>
  </svg>
  <svg class="shut" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M2.5 10.5c2.2 3.4 5.6 5.3 9.5 5.3s7.3-1.9 9.5-5.3"/>
    <path d="M5.4 13.8 3.8 16M9.5 15.5l-.7 2.6M14.5 15.5l.7 2.6M18.6 13.8l1.6 2.2"/>
  </svg>`;

class ArtPassword extends HTMLElement {
  #button;
  #form = null;
  #hide = () => this.toggle(false);

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [css];
    this.shadowRoot.innerHTML = `<slot></slot><button type="button" part="toggle" aria-pressed="false">${EYES}</button>`;
    this.#button = this.shadowRoot.querySelector('button');
    // A mouse press keeps the focus, and so the cursor, in the field.
    this.#button.addEventListener('pointerdown', (event) => { if (event.pointerType === 'mouse') event.preventDefault(); });
    this.#button.addEventListener('click', () => this.toggle());
  }

  static get observedAttributes() { return ['label']; }
  attributeChangedCallback() { this.#sync(); }

  connectedCallback() {
    this.#form = this.input?.form ?? this.closest('form');
    this.#form?.addEventListener('submit', this.#hide, true);
    this.#sync();
  }
  disconnectedCallback() { this.#form?.removeEventListener('submit', this.#hide, true); }

  /** The wrapped input. */
  get input() { return this.querySelector('input'); }

  /** Whether the password shows. */
  get shown() { return this.hasAttribute('data-shown'); }

  /** Shows the password, hides it, or (without an argument) switches. */
  toggle(show = !this.shown) {
    const input = this.input;
    if (!input) return;
    input.type = show ? 'text' : 'password';
    this.toggleAttribute('data-shown', show);
    this.#sync();
  }

  #sync() {
    const shown = this.shown;
    const label = this.getAttribute('label') || 'Show password';
    this.#button.setAttribute('aria-pressed', String(shown));
    this.#button.setAttribute('aria-label', label);
    this.#button.title = label;
  }
}

define('art-password', ArtPassword);
export { ArtPassword };
