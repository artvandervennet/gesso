import { strokePath, bristles, roughFilter, sheet, define } from './brush.js';
import './art-decor.js'; // the header carries an <art-drip>

/**
 * <art-header> — the sticky page header: a wordmark, the section links, and paint dripping
 * off its bottom edge.
 *
 * A page is a stack of painted bands (every top-level element with data-paint). The header
 * wears the paint of the band above the one you are reading, so it looks like the previous
 * section is still dripping onto this one. The link to the current band gets
 * aria-current="location".
 *
 * The repaint follows the scroll: while a section boundary passes behind the header, the new
 * paint comes up through it as a soft blend, from the bottom edge upwards on the way down the
 * page and from the top edge downwards on the way back up. The two paints are mixed in OKLCH,
 * so the blend never goes grey.
 *
 * The first band (the hero) ends in an <art-drip>. When the hero scrolls away, the header takes
 * those same drips along on its bottom edge, without starting them again, and leaves them
 * behind on the hero when you scroll back up. Every later band repaints the header, and fresh
 * paint drips again: new drips, each waiting a few seconds before it runs down.
 * The drips hang straight off the header, and never into the next band: as that band comes
 * up they get shorter, all together, and are gone when it reaches the header.
 *
 *   <art-header label="Sections" data-paint="deep">
 *     <a slot="wordmark" href="#top">Art Van der Vennet</a>
 *     <a href="#about">About</a>
 *     <a href="#work">Work</a>
 *   </art-header>
 *
 * In an app with pages, the links can be routes. Mark the one you are on with
 * aria-current="page" and the header leaves it alone and puts its brushstroke under it.
 * Things to do, as opposed to places to go, sit at the right in the actions slot:
 *
 *   <art-header label="Main" data-paint="deep">
 *     <a slot="wordmark" href="/">OdyFeed</a>
 *     <a href="/about" aria-current="page">About</a>
 *     <art-scheme slot="actions"></art-scheme>
 *     <art-button slot="actions" size="s"><a href="/login">Log in</a></art-button>
 *   </art-header>
 *
 * Put it first in <body>, before the hero, and end the hero in an <art-drip stagger flush>.
 * The hero and the header are the only things on the page that drip.
 *
 * On a home page the hero's title can be the site's name, and the wordmark at the same time.
 * Mark it with data-wordmark:
 *
 *   <div class="band hero" data-paint="deep" id="top">
 *     <div class="inner"><h1 data-wordmark>Gesso</h1> …</div>
 *   </div>
 *
 * At the top of the page the header then has no wordmark. As you scroll, the title moves up and
 * shrinks until it sits where the wordmark goes, and there the header's own wordmark takes
 * over. Scroll back up and the title comes back down. Pages whose hero holds a page title
 * leave data-wordmark off: their header shows the wordmark all the time. With reduced motion
 * the title scrolls away as usual and the wordmark appears once it is gone under the header.
 *
 * A name that takes more than one line in the hero is marked line by line, not on the <h1>:
 *
 *   <h1><span data-wordmark>Art Van</span> <span data-wordmark>der Vennet</span></h1>
 *
 * Each line flies to its own words in the wordmark, so the lines come together into one on
 * the way up. Keep the same words in the same order as the wordmark. layout.css makes each
 * marked line a block that stays together, so the name breaks between them.
 *
 * On small screens (under 48rem) the links fold away under a "Menu" button. The button says
 * whether the menu is open (aria-expanded), its three lines turn into a cross, and the list
 * opens by growing. A link, the button or Escape closes it again.
 *
 * Attributes
 *   label   accessible name of the navigation landmark (default "Sections")
 *   nodrip  never carry the drips
 *   drips, seed  only used when the first band has no <art-drip> to take along
 *
 * Custom properties
 *   --art-header-height  minimum height of the bar (default 3.5rem)
 *   --art-header-stroke  colour of the brushstroke under the current link (default: the partner pigment)
 *   --art-header-drip    how far the drips hang down when there is no hero drip to copy (default 4rem)
 */
const css = sheet(`
  /* The header repaints itself in step with the scroll (see .wipe), so the timed colour fade
     Gesso gives every painted element is switched off here. */
  :host { display: block; position: sticky; inset-block-start: 0; z-index: 30; transition: none !important; }
  .bar {
    display: flex; align-items: center; column-gap: var(--space-6);
    min-block-size: var(--art-header-height, 3.5rem);
    max-inline-size: var(--canvas-max); margin-inline: auto; padding-inline: var(--gutter);
  }
  /* The wordmark, the links and the menu button are as tall as the bar, so the repaint's seam
     (a mask on each of them) runs through all three at the same height. */
  .lead, nav, .wipe .links, .toggle { align-self: stretch; display: flex; align-items: center; }
  .lead { margin-inline-end: auto; }
  /* Actions: buttons and switches at the right. They are not part of the two-coat repaint;
     they change ink in one go, halfway through it. */
  .acts { display: flex; align-items: center; gap: var(--space-3); }
  .acts:not(.filled), .wipe .acts:not(.filled) { display: none; }
  .wipe .acts { inline-size: var(--acts-width, 0); flex: none; }
  /* !important on the slotted links: a page's reset (a { color: inherit }, * { padding: 0 })
     would otherwise win over these rules. See art-button.js. */
  ::slotted([slot="wordmark"]), .wipe .wordmark {
    font: var(--step-1)/1 var(--font-display) !important; color: var(--ink) !important; text-decoration: none !important; white-space: nowrap;
  }
  /* The hero's title flying up to become the wordmark (see fly()): the wordmark comes in as
     the title lands, and until then it is hidden for real, so it can't take keyboard focus. */
  ::slotted([slot="wordmark"]), .wipe .wordmark { opacity: var(--wordmark-in, 1) !important; }
  :host([data-wordmark-away]) ::slotted([slot="wordmark"]), :host([data-wordmark-away]) .wipe .wordmark { visibility: hidden !important; }
  nav, .wipe .links { min-inline-size: 0; }
  .list {
    display: flex; gap: var(--space-2) clamp(var(--space-3), 3vw, var(--space-8));
    overflow-x: auto; scrollbar-width: none;
  }
  /* The menu button: only on small screens. Three lines that turn into a cross. */
  .toggle {
    display: none; align-items: center; gap: var(--space-2);
    min-block-size: 2.75rem; padding: 0 var(--space-1); margin-inline-end: calc(-1 * var(--space-1));
    border: 0; background: none; color: var(--ink); cursor: pointer;
    font: var(--weight-medium) var(--step--1)/1 var(--font-body);
  }
  .toggle:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: 2px; }
  .lines { position: relative; inline-size: 1.25rem; block-size: 1rem; }
  .lines span {
    position: absolute; inset-inline: 0; inset-block-start: calc(50% - 1px); block-size: 2px;
    border-radius: 1px; background: currentColor;
    transition: translate var(--dur-wash) var(--ease-brush), rotate var(--dur-wash) var(--ease-brush), opacity var(--dur-dab) linear;
  }
  /* closed: the outer two sit above and below the middle one */
  .lines span:first-child { translate: 0 -6px; }
  .lines span:last-child { translate: 0 6px; }
  /* open: the outer two come to the middle and cross, the middle one goes */
  :host([data-open]) .lines span:first-child { translate: 0; rotate: 45deg; }
  :host([data-open]) .lines span:last-child { translate: 0; rotate: -45deg; }
  :host([data-open]) .lines span:nth-child(2) { opacity: 0; }
  ::slotted(a:not([slot])), .wipe .links .list span {
    display: block; padding-block: var(--space-3) !important; white-space: nowrap;
    color: var(--ink-muted) !important; text-decoration: none !important;
    font: var(--weight-medium) var(--step--1)/1.25 var(--font-body) !important;
  }
  ::slotted(a:not([slot]):hover) { color: var(--ink) !important; }
  /* where you are: bolder, darker and with a brushstroke under it, never colour alone */
  ::slotted(a[aria-current]), .wipe .links .current { color: var(--ink) !important; font-weight: var(--weight-bold) !important; }
  /* the brushstroke: the same paint engine as <art-stroke>, laid under the current link and
     painted in from the left each time you arrive in a section */
  .mark {
    display: none; position: absolute; pointer-events: none; overflow: visible;
    inset-inline-start: var(--mark-x, 0); inset-block-start: var(--mark-y, 0);
    inline-size: var(--mark-w, 0); block-size: 0.5rem;
  }
  .mark[data-on] { display: block; }
  /* always the theme's partner pigment, whatever paint the header is wearing */
  .mark .body { fill: var(--art-header-stroke, var(--pigment-partner)); }
  .mark .streak { stroke: var(--surface); }
  .mark .ink { clip-path: inset(-50% 100% -50% 0); }
  .mark[data-painted] .ink { clip-path: inset(-50% 0 -50% 0); transition: clip-path var(--dur-stroke) var(--ease-brush); }
  @media (prefers-reduced-motion: reduce) { .mark .ink { clip-path: none !important; } }

  /* The repaint. While a section boundary passes behind the header, the new paint comes up
     through it as a soft, wet blend, in step with the scroll: from the bottom edge upwards on
     the way down the page, from the top edge downwards on the way back up.
     --from and --to are where the blend starts and ends, as fractions of the header's height
     (old paint above --from, new paint below --to); update() moves them with the scroll.
     The paints are mixed in OKLCH, so the blend passes through real in-between colours
     and never through grey. */
  .paint {
    display: none; position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(to bottom, var(--surface) calc(var(--from) * 100%), var(--fresh) calc(var(--to) * 100%));
    background: linear-gradient(to bottom in oklch, var(--surface) calc(var(--from) * 100%), var(--fresh) calc(var(--to) * 100%));
  }
  .bar { position: relative; }
  /* The words change colour with the paint behind them. They can't blend the way the paint
     does: half-faded words on a half-way colour are unreadable. So the bar in the old paint's
     inks is shown above the middle of the blend and a second coat of it, in the new paint's
     inks, below it, with only a thin soft seam between the two.
     The mask sits on the real bar's wordmark, links and menu button; the copy inside .wipe has its own. */
  .paint, .bar, .wipe {
    --seam-top: calc(((var(--from) + var(--to)) / 2 - 0.06) * 100%);
    --seam-end: calc(((var(--from) + var(--to)) / 2 + 0.06) * 100%);
  }
  :host([data-repainting]) .bar[part] > :is(.lead, nav, .toggle) {
    -webkit-mask-image: linear-gradient(to bottom, #000 var(--seam-top), transparent var(--seam-end));
    mask-image: linear-gradient(to bottom, #000 var(--seam-top), transparent var(--seam-end));
  }
  .wipe {
    display: none; position: absolute; inset: 0; pointer-events: none; color: var(--ink);
    -webkit-mask-image: linear-gradient(to bottom, transparent var(--seam-top), #000 var(--seam-end));
    mask-image: linear-gradient(to bottom, transparent var(--seam-top), #000 var(--seam-end));
  }
  :host([data-repainting]) .paint { display: block; }
  .wipe[data-on] { display: block; }
  ::slotted(a:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: 2px; }

  /* the hero's drips, carried along on the bottom edge in the header's paint, with a wet edge:
     the same paint a shade darker */
  art-drip {
    position: absolute; inset: calc(100% - 1px) 0 auto; --art-drip-height: var(--art-header-drip, 4rem);
    filter: drop-shadow(0 2px 0 color-mix(in oklch, var(--surface), black 16%));
  }

  /* Small screens: the links fold away under a menu button. The bar keeps the wordmark and
     the button; the links are a list that opens and closes by growing its grid row from
     nothing to its own height. While closed it is hidden for real (visibility), so the
     links can't be reached with the keyboard or a screen reader.
     The list hangs under the bar, over the page: it takes no room in the layout. If it pushed
     the page down, closing it after you picked a link would pull the page back up, and the
     section you asked for would end up behind the header. */
  @media (max-width: 48rem) {
    .toggle { display: inline-flex; }
    nav, .wipe .links {
      position: absolute; inset: 100% 0 auto; padding-inline: var(--gutter);
      background: var(--surface); box-shadow: 0 1px 0 var(--rule), var(--shadow-lifted);
      display: grid; grid-template-rows: 0fr; visibility: hidden;
      transition: grid-template-rows var(--dur-wash) var(--ease-brush), visibility 0s var(--dur-wash);
    }
    :host([data-open]) nav, :host([data-open]) .wipe .links {
      grid-template-rows: 1fr; visibility: visible;
      transition: grid-template-rows var(--dur-wash) var(--ease-brush), visibility 0s;
    }
    .fold { min-block-size: 0; overflow: hidden; }
    .list { flex-direction: column; align-items: flex-start; gap: 0; padding-block: var(--space-1) var(--space-4); overflow: visible; }
    ::slotted(a:not([slot])), .wipe .links .list span { font-size: var(--step-0) !important; padding-block: var(--space-3) !important; }
    /* the open list covers the bar's bottom edge, so there is nothing for drips to hang from */
    :host([data-open]) .drips { visibility: hidden; }
  }
  @media (prefers-reduced-motion: reduce) { .lines span, nav, .wipe .links { transition: none !important; } }
`);

// the colours a paint gives to the things in the bar
const ROLES = ['--surface', '--ink', '--ink-muted', '--accent', '--rule', '--focus'];
const esc = (text) => text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const still = matchMedia('(prefers-reduced-motion: reduce)');
// what fly() writes on the hero's title, so it can be taken off again
const FLIGHT = ['translate', 'scale', 'transform-origin', 'opacity', 'position', 'z-index'];

class ArtHeader extends HTMLElement {
  #raf = 0; #schedule; #under = -1; #reading = -1; #source = null; #coat = null; #drip = null; #fresh = ''; #resized; #marked; #title = [];
  constructor() { super(); this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [css]; }

  connectedCallback() {
    if (!this.hasAttribute('data-paint')) this.setAttribute('data-paint', 'deep');
    this.shadowRoot.innerHTML = `
      <div class="paint" aria-hidden="true"></div>
      <div class="bar" part="bar">
        <div class="lead"><slot name="wordmark"></slot></div>
        <nav id="links" part="nav"><div class="fold"><div class="list"><slot></slot></div></div></nav>
        <div class="acts" part="actions"><slot name="actions"></slot></div>
        <button class="toggle" type="button" aria-expanded="false" aria-controls="links">
          <span>Menu</span><span class="lines" aria-hidden="true"><span></span><span></span><span></span></span>
        </button>
      </div>
      <div class="wipe" aria-hidden="true"></div>
      <div class="drips" part="drips"></div>`;
    this.shadowRoot.querySelector('nav').setAttribute('aria-label', this.getAttribute('label') || 'Sections');
    // every link in the navigation, and the ones that point at a band of this page
    this.navLinks = [...this.querySelectorAll(':scope > a:not([slot])')];
    this.links = this.navLinks.filter((a) => (a.getAttribute('href') || '').startsWith('#'));
    // the second coat: a picture of the bar, for the wipe to show in the new colours
    const wordmark = this.querySelector(':scope > [slot="wordmark"]');
    this.shadowRoot.querySelector('.wipe').innerHTML = `<div class="bar">
      <div class="lead">${wordmark ? `<span class="wordmark">${esc(wordmark.textContent)}</span>` : ''}</div>
      <div class="links"><div class="fold"><div class="list">${this.navLinks.map((a) => `<span>${esc(a.textContent)}</span>`).join('')}</div></div></div>
      <div class="acts"></div>
      <span class="toggle"><span>Menu</span><span class="lines"><span></span><span></span><span></span></span></span></div>`;
    const filled = !!this.querySelector(':scope > [slot="actions"]');
    for (const acts of this.shadowRoot.querySelectorAll('.acts')) acts.classList.toggle('filled', filled);
    // the menu button (small screens only)
    this.toggle = this.shadowRoot.querySelector('button.toggle');
    this.toggle.addEventListener('click', () => this.open(!this.hasAttribute('data-open')));
    // following a link closes the menu; so does Escape, which hands focus back to the button
    for (const a of this.navLinks) a.addEventListener('click', () => this.open(false));
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.hasAttribute('data-open')) { this.open(false); this.toggle.focus(); }
    });
    // the brushstroke can only be placed once the list has finished opening
    this.shadowRoot.querySelector('nav').addEventListener('transitionend', () => this.update());
    // the brushstroke under the current link, once in each coat
    const W = 300, H = 24, seed = 11;
    const stroke = `<svg class="mark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>${roughFilter('mark', seed, 2.5)}</defs>
      <g class="ink" filter="url(#mark)"><path class="body" d="${strokePath(W, H, seed, { taper: 0.2 })}"/>
        ${bristles(W, H, seed, 3).map((b) => `<path class="streak" d="${b.d}" stroke-width="${b.w}" stroke-linecap="round" fill="none" opacity=".55"/>`).join('')}</g></svg>`;
    for (const bar of this.shadowRoot.querySelectorAll('.bar')) bar.insertAdjacentHTML('beforeend', stroke);
    this.marks = [...this.shadowRoot.querySelectorAll('.mark')];
    this.#under = -1; this.#reading = -1; this.#coat = null;
    this.removeAttribute('data-open');
    this.#schedule = () => { cancelAnimationFrame(this.#raf); this.#raf = requestAnimationFrame(() => this.update()); };
    addEventListener('scroll', this.#schedule, { passive: true });
    addEventListener('resize', this.#schedule);
    // In an app the page under the header changes without a scroll: a route change swaps the
    // bands and moves aria-current. Watch for both.
    this.#resized = new ResizeObserver(this.#schedule);
    this.#resized.observe(document.body);
    this.#marked = new MutationObserver(this.#schedule);
    this.#marked.observe(this, { attributes: true, subtree: true, attributeFilter: ['aria-current'] });
    this.update();
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.#raf);
    removeEventListener('scroll', this.#schedule);
    removeEventListener('resize', this.#schedule);
    this.#resized?.disconnect();
    this.#marked?.disconnect();
    this.fly([]);
  }

  /** Open or close the folded menu (small screens). */
  open(yes) {
    this.toggleAttribute('data-open', yes);
    this.toggle.setAttribute('aria-expanded', String(yes));
    this.update();
  }

  /** True when the links are folded under the menu button. */
  get compact() { return getComputedStyle(this.toggle).display !== 'none'; }

  /** The painted bands of the page, top to bottom: every data-paint element that isn't inside another. */
  bands() {
    return [...document.querySelectorAll('[data-paint]')]
      .filter((el) => el !== this && !this.contains(el) && !el.parentElement?.closest('[data-paint]'));
  }

  /**
   * Two questions, two lines across the page.
   * Paint: which band is passing under the header's bottom edge? The header takes the paint of
   * the one before it, so it always stands out against what is directly underneath.
   * Current link: which band is a quarter of the way down the viewport? That is where people
   * read, and where an anchor link lands its section.
   */
  update() {
    const bands = this.bands();
    if (!bands.length) return;
    const tops = bands.map((band) => band.getBoundingClientRect().top);
    const box = this.getBoundingClientRect();
    const open = this.hasAttribute('data-open');
    if (open && !this.compact) { this.open(false); return; } // the window got wide while it was open
    const edge = box.bottom + 1;
    const at = (line) => Math.max(0, tops.findLastIndex((top) => top <= line));
    const under = at(edge), reading = at(edge + innerHeight * 0.25);
    const wipe = this.shadowRoot.querySelector('.wipe');
    this.fly([...bands[0].querySelectorAll('[data-wordmark]')], box, open);

    if (reading !== this.#reading) {
      this.#reading = reading;
      const here = bands[reading].id ? `#${bands[reading].id}` : null;
      for (const a of this.links) {
        if (decodeURIComponent(a.hash) === here) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      }
      // paint the stroke afresh under the new link
      for (const mark of this.marks) mark.removeAttribute('data-painted');
      requestAnimationFrame(() => { for (const mark of this.marks) mark.setAttribute('data-painted', ''); });
    }
    // keep the stroke under the current link (its place changes with the window and the weight)
    // the current link is the band you are in, or the page you are on (aria-current="page")
    const current = this.navLinks.find((a) => a.hasAttribute('aria-current'));
    const spans = wipe.querySelectorAll('.links .list span');
    this.navLinks.forEach((a, i) => spans[i]?.classList.toggle('current', a === current));
    wipe.querySelector('.acts').style.setProperty('--acts-width', `${this.shadowRoot.querySelector('.bar[part] > .acts').offsetWidth}px`);
    const bar = this.shadowRoot.querySelector('.bar[part]').getBoundingClientRect();
    // folded away, there is no link to put it under
    const shown = !!current && (!this.compact || open);
    for (const mark of this.marks) {
      mark.toggleAttribute('data-on', shown);
      if (!shown) continue;
      const link = current.getBoundingClientRect();
      mark.style.setProperty('--mark-x', `${(link.left - bar.left - 3).toFixed(1)}px`);
      mark.style.setProperty('--mark-w', `${(link.width + 6).toFixed(1)}px`);
      mark.style.setProperty('--mark-y', `${(link.bottom - bar.top - 11).toFixed(1)}px`);
    }

    // The repaint follows the scroll. It starts when the boundary of the band under the
    // header's edge reaches that edge, and is done two header heights of scrolling later.
    // Until then the header blends from its old paint (the band two back) at the top into its
    // new one (the band just above the edge) at the bottom, and the blend, one header height
    // tall, travels up through it. Scrolling back up runs the same thing the other way.
    const fresh = bands[Math.max(0, under - 1)], old = bands[Math.max(0, under - 2)];
    const done = under === 0 ? 1 : Math.min(1, Math.max(0, (box.bottom - tops[under]) / (box.height * 2)));
    // no half-way paint behind an open menu: it shows whichever paint the blend is nearer to
    const blending = done < 1 && fresh.dataset.paint !== old.dataset.paint;
    const repainting = blending && !open;
    const paint = (repainting || (blending && done < 0.5) ? old : fresh).dataset.paint || 'deep';
    if (this.getAttribute('data-paint') !== paint) this.setAttribute('data-paint', paint);

    // a new band under the edge: sort out which drips hang there before colouring them
    if (under !== this.#under) {
      const from = this.#under;
      this.#under = under;
      this.drip(under, from, repainting);
    }

    const stale = repainting ? getComputedStyle(old).getPropertyValue('--surface') : '';
    if (repainting) {
      const from = 1 - 2 * done, to = 2 - 2 * done;
      if (this.#coat !== fresh) {
        this.#coat = fresh;
        const style = getComputedStyle(fresh);
        for (const role of ROLES) wipe.style.setProperty(role, style.getPropertyValue(role));
        this.shadowRoot.querySelector('.paint').style.setProperty('--fresh', style.getPropertyValue('--surface'));
        this.#fresh = style.getPropertyValue('--surface');
      }
      for (const part of this.shadowRoot.querySelectorAll('.paint, .bar, .wipe, .lead, nav, .toggle')) {
        part.style.setProperty('--from', from.toFixed(3));
        part.style.setProperty('--to', to.toFixed(3));
      }
      // the actions take the new paint's inks once the blend has passed the middle of the bar
      const acts = this.shadowRoot.querySelector('.bar[part] > .acts');
      for (const role of ROLES) {
        if (done >= 0.5) acts.style.setProperty(role, wipe.style.getPropertyValue(role)); else acts.style.removeProperty(role);
      }
      wipe.querySelector('.list').scrollLeft = this.shadowRoot.querySelector('nav .list').scrollLeft;
      wipe.setAttribute('data-on', '');
      this.setAttribute('data-repainting', '');
    } else if (this.#coat) {
      this.#coat = null;
      wipe.removeAttribute('data-on');
      this.removeAttribute('data-repainting');
      for (const role of ROLES) this.shadowRoot.querySelector('.bar[part] > .acts').style.removeProperty(role);
    }

    // The drips never hang into the next band. As its top edge comes up towards the header
    // they are cut off at that edge, all together, shorter and shorter, and are gone by the
    // time it arrives. Scrolling back up they come out again the same way.
    // The band of paint above the drips is always cut away, so they hang straight off the header.
    if (this.#drip) {
      const height = this.#drip.offsetHeight, band = height * 0.22;
      const room = under + 1 < tops.length ? Math.max(0, tops[under + 1] - box.bottom) : Infinity;
      const cut = height - band - room;
      this.#drip.style.clipPath = `inset(${(band - 2).toFixed(1)}px -1% ${cut > 0 ? `${cut.toFixed(1)}px` : '-40%'} -1%)`;
      // while the header is being repainted they take the colour the blend has at its bottom edge
      if (repainting) this.#drip.style.setProperty('--surface', `color-mix(in oklch, ${this.#fresh} ${(Math.min(1, done * 2) * 100).toFixed(1)}%, ${stale})`);
      else this.#drip.style.removeProperty('--surface');
    }
  }

  /**
   * The hero's title (data-wordmark) on its way up to become the wordmark. The flight follows
   * the scroll: it starts at the top of the page and ends when the title's own place has gone
   * under the header's bottom edge. On the way the title moves from its own place to the
   * wordmark's and shrinks to the wordmark's size, over the header. Over the last stretch it
   * fades out while the header's wordmark fades in; after that it stays in its place, unseen,
   * so the page keeps its heading for screen readers. With no title to fly, the wordmark is
   * simply there.
   * A title marked line by line flies line by line: each one goes to its own words in the
   * wordmark, so the lines of a long name come together into one on the way up.
   */
  fly(lines, box, open) {
    if (lines.length !== this.#title.length || lines.some((line, i) => line !== this.#title[i])) {
      for (const line of this.#title) for (const prop of FLIGHT) line.style.removeProperty(prop);
      this.#title = lines;
    }
    const wordmark = this.querySelector(':scope > [slot="wordmark"]');
    if (!lines.length || !wordmark) {
      this.removeAttribute('data-wordmark-away');
      this.style.removeProperty('--wordmark-in');
      return;
    }
    // where each line is when nothing moves it: offsets leave transforms out
    const places = lines.map((line) => {
      let top = 0, left = 0;
      for (let el = line; el; el = el.offsetParent) { top += el.offsetTop; left += el.offsetLeft; }
      return { top, left, bottom: top + line.offsetHeight };
    });
    const length = Math.max(...places.map((place) => place.bottom)) - box.bottom; // how far you scroll before it is under the header
    const done = length > 0 ? Math.min(1, Math.max(0, scrollY / length)) : 1;
    // the last stretch: the title goes, the wordmark comes
    const handover = still.matches ? Math.floor(done) : Math.min(1, Math.max(0, (done - 0.85) / 0.15));
    this.toggleAttribute('data-wordmark-away', handover === 0);
    this.style.setProperty('--wordmark-in', handover.toFixed(3));

    if (still.matches || done === 0 || done === 1) {
      for (const { style } of lines) {
        for (const prop of FLIGHT) if (prop !== 'opacity') style.removeProperty(prop);
        if (done === 1) style.setProperty('opacity', '0'); else style.removeProperty('opacity');
      }
      return;
    }
    const landings = this.landings(lines, wordmark);
    const small = parseFloat(getComputedStyle(wordmark).fontSize);
    // From where it stood at the top of the page to the wordmark, in step with the scroll but
    // slower than the page, so it never overshoots. It is there when the hand-over starts, so
    // the two swap in the same place. The page moved it by the scroll; undo that.
    const flown = Math.min(1, done / 0.85);
    lines.forEach((line, i) => {
      const { top, left } = places[i], to = landings[i], s = line.style;
      const size = small / parseFloat(getComputedStyle(line).fontSize);
      const x = left + (to.left - left) * flown, y = top + (to.top - top) * flown;
      s.setProperty('transform-origin', '0 0');
      s.setProperty('translate', `${(x - left + scrollX).toFixed(1)}px ${(y - top + scrollY).toFixed(1)}px`);
      s.setProperty('scale', (size ** flown).toFixed(4)); // even steps to the eye: shrinking by a factor, not by an amount
      s.setProperty('opacity', (1 - handover).toFixed(3));
      // over the header, except when the open menu hangs there
      if (open) { s.removeProperty('position'); s.removeProperty('z-index'); }
      else { s.setProperty('position', 'relative'); s.setProperty('z-index', '31'); }
    });
  }

  /**
   * Where each line of the title lands. A title in one piece lands on the wordmark's corner.
   * Lines land on their own words: the first on the wordmark's first word, the next on the
   * word after the first line's last, and so on. A line the wordmark has no words left for
   * lands on the corner too.
   */
  landings(lines, wordmark) {
    const corner = wordmark.getBoundingClientRect();
    if (lines.length === 1) return [corner];
    const words = []; // where each word of the wordmark starts: its text node, and how far in
    const texts = document.createTreeWalker(wordmark, NodeFilter.SHOW_TEXT);
    for (let node; (node = texts.nextNode());) for (const word of node.data.matchAll(/\S+/g)) words.push([node, word.index]);
    let at = 0;
    return lines.map((line) => {
      const word = words[at];
      at += line.textContent.trim().split(/\s+/).length;
      if (!word) return corner;
      const first = document.createRange(); // the word's first letter
      first.setStart(...word);
      first.setEnd(word[0], word[1] + 1);
      return { left: first.getBoundingClientRect().left, top: corner.top };
    });
  }

  /**
   * Leaving the hero, the header takes the hero's drips along: the very same drips (same seed,
   * count, height, and at the same point in their run) on its own bottom edge, where the
   * hero's just were. Scroll back up and they are left behind on the hero.
   * Crossing into any other band repaints the header, and fresh paint drips again: new drips
   * in the new colour, each waiting a few seconds before it runs. The old ones are gone by
   * then: update() has shortened them to nothing as the band came up.
   */
  drip(under, from, repainting) {
    const box = this.shadowRoot.querySelector('.drips');
    if (this.hasAttribute('nodrip')) return;
    if (under === 0) {
      // back at the hero: its drips are its own again
      box.replaceChildren();
      this.#drip = null;
      this.#source?.style.removeProperty('visibility');
      return;
    }
    const source = this.#source = this.bands()[0]?.querySelector('art-drip');
    const carried = from === 0 && source; // straight off the hero
    // same paint as before (the last section and the footer, say): the drips just stay
    if (this.#drip && !carried && !repainting && under > from) return;

    const seed = source?.getAttribute('seed') ?? this.getAttribute('seed') ?? 'header';
    const drip = document.createElement('art-drip');
    drip.setAttribute('flush', '');
    drip.setAttribute('pigment', '--surface');
    drip.setAttribute('seed', carried ? seed : `${seed}-${under}`);
    drip.setAttribute('count', source?.getAttribute('count') ?? this.getAttribute('drips') ?? '9');
    if (source) drip.style.setProperty('--art-drip-height', `${source.getBoundingClientRect().height}px`);
    if (!carried || source.hasAttribute('stagger')) drip.setAttribute('stagger', '');
    if (carried) drip.style.setProperty('--art-drip-elapsed', `${((performance.now() - (source.startedAt ?? 0)) / 1000).toFixed(2)}s`);
    this.#drip = drip;
    box.replaceChildren(drip);
    // the hero's own drips would otherwise slide up behind the header's and show double
    source?.style.setProperty('visibility', 'hidden');
  }
}

define('art-header', ArtHeader);
export { ArtHeader };
