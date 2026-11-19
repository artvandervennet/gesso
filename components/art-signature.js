import { strokePath, rng, seedFrom, paint, sheet, define, reducedMotion } from './brush.js';
import { ink } from './signature-ink.js';

/**
 * <art-signature> — the artist's signature, painted in the corner like on a canvas.
 * Put it in the footer of every page, once.
 *
 *   <art-signature year="2026">Art Van der Vennet</art-signature>
 *
 * Attributes
 *   year     shown after the name, as painters do ("’26"); leave out for none
 *   pigment  colour of the paint (default: stroke, which suits every paint)
 *   animate  sign once when it scrolls into view (skipped with reduced motion)
 *
 * The name stays real text, so it's read out as "Signed: Art Van der Vennet, 2026".
 *
 * The signature itself is drawn from outlines (signature-ink.js), not set in a font, so it is
 * the same hand on every site and in every browser, also when the fonts are late or blocked.
 * Another name than the artist's is set in --font-signature, which does need the font.
 */
const css = sheet(`
  :host {
    display: inline-block; position: relative;
    color: var(--art-signature-colour);
    transform: rotate(-5deg); transform-origin: right bottom;
    padding: 0 var(--space-2) var(--space-3) !important; /* holds against a page reset; see art-button.js */
  }
  .name {
    font-family: var(--font-signature); font-size: calc(var(--step-3) * 1.35); line-height: 1;
    white-space: nowrap; letter-spacing: 0; font-feature-settings: "liga" 1, "calt" 1;
  }
  .year { font-family: var(--font-signature); font-size: var(--step-2); margin-inline-start: 0.35em; }
  /* Drawn letters take the place the same letters in the font would: one line high, and the
     baseline where the font puts it in a line of that height. */
  svg.name, svg.year { block-size: 1lh; vertical-align: calc(${(ink.rise / ink.em - 0.5).toFixed(4)}em - 0.5lh); overflow: visible; }
  /* A Mac draws text heavier than its outline, by the same 0.37px at every size (measured in
     Chrome). The hairline gives the drawing that weight, on every device. */
  svg.name path, svg.year path { stroke: currentColor; stroke-width: 0.37px; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
  .flourish { position: absolute; inset-inline: 0; inset-block-end: 0; inline-size: 100%; block-size: 0.7rem; overflow: visible; }
  .ink { display: inline-block; white-space: nowrap; clip-path: inset(-60% -10% -60% -10%); }
  :host([animate]:not([data-signed])) .ink { clip-path: inset(-60% 110% -60% -10%); }
  :host([animate][data-signed]) .ink { transition: clip-path var(--dur-stroke) var(--ease-brush); }
  .sr { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`);

// Letters as a drawing, `width` font units wide, in the box the same letters in the font would have.
const drawn = (cls, width, paths) =>
  `<svg class="${cls}" viewBox="0 ${-ink.rise} ${width} ${ink.em}" style="inline-size:${(width / ink.em).toFixed(4)}em" focusable="false">${paths}</svg>`;
const outline = (d, x = 0) => `<path d="${d}"${x ? ` transform="translate(${x})"` : ''} fill="currentColor"/>`;

// The year's characters side by side: '' for no year, null when a character has no outline.
function drawnYear(text) {
  let width = 0, paths = '';
  for (const ch of text) {
    const glyph = ink.glyphs[ch];
    if (!glyph) return null;
    paths += outline(glyph[1], width);
    width += glyph[0];
  }
  return text ? drawn('year', width, paths) : '';
}

class ArtSignature extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [css]; }

  connectedCallback() {
    const name = this.textContent.trim() || 'Art Van der Vennet';
    const year = this.getAttribute('year');
    const short = year ? `’${String(year).slice(-2)}` : '';
    this.style.setProperty('--art-signature-colour', paint(this.getAttribute('pigment'), 'stroke'));
    const seed = seedFrom(name, 7);
    const r = rng(seed);
    // the flourish under the name: a thin, fast brushstroke
    const flourish = strokePath(300, 10, seed, { taper: 0.45, wobble: 0.2 });
    // The artist's own name is drawn, and the year with it. Any other name is set in the font,
    // and then the year is too, so the two stay one hand.
    const own = name === ink.name ? drawnYear(short) : null;
    const signed = own === null
      ? `<span class="name">${name}</span>${short ? `<span class="year">${short}</span>` : ''}`
      : `${drawn('name', ink.width, outline(ink.path))}${own}`;
    this.shadowRoot.innerHTML = `
      <span class="sr">Signed: ${name}${year ? `, ${year}` : ''}</span>
      <span class="ink" aria-hidden="true">
        ${signed}
        <svg class="flourish" viewBox="0 0 300 10" preserveAspectRatio="none" focusable="false"><path d="${flourish}" fill="currentColor" transform="rotate(${((r() - 0.5) * 2).toFixed(1)} 150 5)"/></svg>
      </span>`;
    if (this.hasAttribute('animate')) {
      if (reducedMotion()) { this.setAttribute('data-signed', ''); return; }
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { requestAnimationFrame(() => this.setAttribute('data-signed', '')); io.disconnect(); }
      }, { threshold: 0.8 });
      io.observe(this);
    }
  }
}

define('art-signature', ArtSignature);
export { ArtSignature };
