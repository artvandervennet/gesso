import { sheet, define } from './brush.js';

/**
 * <art-share> — makes a button share a link. Where the browser has a share sheet (phones,
 * Safari, Chrome and Edge) the button opens it, with your words and the link, to send on with
 * any app there. Where it has none the button copies the link and says so.
 * Wrap the native <button>, in its <art-button> or bare; it stays the button it was.
 *
 *   <art-share url="/lists/kerst" text="Here is my wishlist.">
 *     <art-button variant="secondary"><button type="button">
 *       <span class="wordings">
 *         <span data-when="share">Share</span>
 *         <span data-when="copy">Copy link</span>
 *         <span data-when="copied">Copied</span>
 *       </span>
 *     </button></art-button>
 *   </art-share>
 *
 * The button says what it will do: one <span data-when> per wording, and the one for the
 * moment shows (`.wordings` in layout.css lays them on top of each other, so the button keeps
 * the width of the longest and nothing beside it moves). "share" where there is a sheet, "copy"
 * where there isn't, "copied" for three seconds after copying. A button with plain words works
 * too, it only never changes them. A screen reader doesn't read a button's new words while the
 * focus is on it, so "copied" is also said in a status line nobody sees.
 *
 * The link goes to the sheet inside the words, on a line of its own under them. Handed over
 * apart, as the API allows, the apps in the sheet of a Mac or an iPhone (WhatsApp, Messages,
 * Mail) send the address and drop the words.
 *
 * Without a clipboard (a page on plain http, or permission refused) a field appears under the
 * button with the address in it, selected, to copy by hand.
 *
 * Attributes
 *   url           the address to share; one that starts with / is on this site. Default: this page.
 *   text          the words that go with it. Leave it out to share the bare link.
 *   heading       a subject for the apps that have one, such as mail.
 *   nosheet       always copy, also where there is a share sheet. Leave the "share" wording out.
 *   copied-label  what a screen reader hears after copying (default "Link copied").
 *   manual-label  the label of the field to copy by hand (default "Copy this link").
 *   data-state    set by the element: "share" | "copy" | "copied". Style on it.
 *
 * Methods
 *   share()  opens the sheet. Resolves false when there is none or the browser wouldn't open
 *            it, which it only does shortly after a press. For a link you have just made:
 *            show the button, call share(), and the button is still there if it resolves false.
 *   copy()   copies the link. Resolves false when it could only show it to copy by hand.
 *
 * Events
 *   gesso:share  after the link went out; detail.via is "sheet" | "clipboard" | "manual".
 *
 * Parts
 *   manual   the block with the field to copy by hand
 *   address  the field in it
 */
const css = sheet(`
  :host { display: inline-flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
  .status { position: absolute; inline-size: 1px; block-size: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .manual { flex: 1 1 100%; display: grid; gap: var(--space-1); }
  .manual[hidden] { display: none; }
  label { font-weight: var(--weight-medium); }
  input {
    box-sizing: border-box; inline-size: 100%; min-block-size: 2.75rem;
    font: inherit; color: inherit;
    background: var(--surface-raised);
    border: 1.5px solid var(--rule-strong);
    border-radius: var(--radius-chip);
    padding: var(--space-2) var(--space-3);
    text-overflow: ellipsis;
  }
  input:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
`);

// How long the button says "copied".
const COPIED_MS = 3000;

class ArtShare extends HTMLElement {
  #status;
  #manual;
  #address;
  #label;
  #timer;
  #said = '';

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [css];
    this.shadowRoot.innerHTML = `<slot></slot><span class="status" role="status"></span>
      <div class="manual" part="manual" hidden><label for="address"></label><input id="address" part="address" type="text" readonly></div>`;
    this.#status = this.shadowRoot.querySelector('.status');
    this.#manual = this.shadowRoot.querySelector('.manual');
    this.#address = this.shadowRoot.querySelector('input');
    this.#label = this.shadowRoot.querySelector('label');
    this.#address.addEventListener('focus', () => this.#address.select());
    // Any button inside is the share button: the wrapped one, however deep it sits.
    this.addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest('button') : null;
      if (button && this.contains(button)) this.#press();
    });
  }

  static get observedAttributes() { return ['nosheet', 'manual-label']; }
  attributeChangedCallback() { this.#sync(); }
  connectedCallback() { this.#sync(); }
  disconnectedCallback() { clearTimeout(this.#timer); }

  /** Whether the button opens a share sheet here. */
  get canShare() { return !this.hasAttribute('nosheet') && typeof navigator.share === 'function'; }

  /** The full address that goes out. */
  get address() { return new URL(this.getAttribute('url') || location.href, location.href).href; }

  /**
   * Opens the share sheet. Resolves false when there is none here, or the browser wouldn't
   * open it; closing the sheet without choosing counts as done.
   */
  async share() {
    if (!this.canShare) return false;
    const url = this.address;
    const text = this.getAttribute('text');
    const heading = this.getAttribute('heading');
    // With words, the link goes in them and not beside them as `url`: given both, the apps in
    // the sheet of a Mac or an iPhone send the address alone.
    const what = text ? { text: `${text}\n${url}` } : { url };
    if (heading) what.title = heading;
    try {
      await navigator.share(what);
    }
    catch (failure) {
      return failure?.name === 'AbortError';
    }
    this.#sent('sheet');
    return true;
  }

  /** Copies the link. Resolves false when it could only show it, to copy by hand. */
  async copy() {
    const url = this.address;
    try {
      await navigator.clipboard.writeText(url);
    }
    catch {
      this.#address.value = url;
      this.#manual.hidden = false;
      this.#address.select();
      this.#sent('manual');
      return false;
    }
    this.#manual.hidden = true;
    this.#say(this.getAttribute('copied-label') || 'Link copied');
    this.#sent('clipboard');
    return true;
  }

  /** The button itself: the sheet, or the link at least. */
  async #press() {
    if (!(await this.share())) await this.copy();
  }

  #say(message) {
    clearTimeout(this.#timer);
    // VoiceOver skips a message equal to the one before it. A no-break space makes it differ
    // without being read out.
    this.#said = message === this.#said ? `${message} ` : message;
    this.#status.textContent = this.#said;
    this.dataset.state = 'copied';
    // Back to what the button does, and emptied, so no stale "copied" stays behind for someone
    // reading the page later.
    this.#timer = setTimeout(() => {
      this.#status.textContent = '';
      this.#sync();
    }, COPIED_MS);
  }

  #sent(via) {
    this.dispatchEvent(new CustomEvent('gesso:share', { bubbles: true, composed: true, detail: { via, url: this.address } }));
  }

  #sync() {
    this.#label.textContent = this.getAttribute('manual-label') || 'Copy this link';
    if (this.dataset.state === 'copied' && this.#status.textContent) return;
    this.dataset.state = this.canShare ? 'share' : 'copy';
  }
}

define('art-share', ArtShare);
export { ArtShare };
