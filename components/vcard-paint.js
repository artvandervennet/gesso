// Paints <solid-vcard-card> (Kilian Leroy's Solid vCard element, @kiliankil/solid-vcard-card)
// in Gesso. The element comes with its own black-and-gold look inside its shadow root and has
// no styling hooks, but the shadow root is open, so this stylesheet is adopted into each card.
// Adopted stylesheets come after the card's own <style>, so equal selectors win. Gesso's custom
// properties inherit into the shadow root, so the card follows the theme, the paint and the scheme.
//
//   import { paintVcards } from '@vandervennet/gesso/components/vcard-paint.js';
//   const stop = paintVcards(document.querySelector('.card-wall'));   // now, and whenever one is added
//
// Not part of the component index: import it only where you use the element.

const css = `
  :host { display: block; font-family: var(--font-body); }
  p { margin: 0; padding: var(--space-6); color: var(--ink-muted); font-size: var(--step--1);
    background: var(--surface-raised); border-radius: var(--radius-canvas); box-shadow: var(--shadow-card); }
  .card {
    grid-template-columns: 4.5rem 1fr; gap: var(--space-4); align-items: start;
    max-width: none; padding: var(--space-6);
    background: var(--surface-raised); color: var(--ink);
    border: 0; border-radius: var(--radius-canvas);
    box-shadow: var(--shadow-card);
  }
  .card::before, .card::after { content: none; }
  .avatar {
    width: 4.5rem; height: 4.5rem;
    border: 0; border-radius: var(--radius-dab);
    background: var(--surface-sunken); box-shadow: 0 0 0 1px var(--rule);
  }
  .content { row-gap: var(--space-1); }
  .name {
    font: var(--weight-regular) var(--step-2)/var(--leading-snug) var(--font-display);
    letter-spacing: -0.01em; text-transform: none; text-shadow: none; color: var(--ink);
  }
  .meta { color: var(--ink); font-size: var(--step-0); font-weight: var(--weight-medium); letter-spacing: 0; }
  .org { color: var(--ink-muted); font-size: var(--step--1); letter-spacing: 0; }
  .divider { height: 1px; margin: var(--space-2) 0; background: var(--rule); }
  .contact { gap: var(--space-1); margin-top: 0; font-size: var(--step--1); }
  .contact-item { gap: var(--space-2); flex-wrap: wrap; }
  .contact-item::before {
    content: ''; inline-size: 0.5em; block-size: 0.5em; flex: none;
    border-radius: 45% 55% 50% 50%; background: var(--pigment-complement);
  }
  .label { color: var(--ink-muted); margin-right: 0; }
  .contact a {
    color: var(--link); text-decoration: underline; text-decoration-thickness: 0.08em;
    text-underline-offset: 0.22em; overflow-wrap: anywhere; transition: none;
  }
  .contact a:hover { color: var(--link); text-decoration-thickness: 0.18em; }
  .contact a:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; border-radius: 2px; }
  @media (max-width: 420px) {
    .card { grid-template-columns: 3.5rem 1fr; padding: var(--space-4); }
    .avatar { width: 3.5rem; height: 3.5rem; }
    .name { font-size: var(--step-1); }
  }
`;

let sheet;

/**
 * Repaint every <solid-vcard-card> inside `container`, now and whenever one is added.
 * Returns a function that stops watching.
 */
export function paintVcards(container = document.body) {
  sheet ??= new CSSStyleSheet();
  if (!sheet.cssRules.length) sheet.replaceSync(css);
  const paint = () => {
    for (const card of container.querySelectorAll('solid-vcard-card')) {
      if (card.shadowRoot && !card.shadowRoot.adoptedStyleSheets.includes(sheet)) {
        card.shadowRoot.adoptedStyleSheets = [...card.shadowRoot.adoptedStyleSheets, sheet];
      }
    }
  };
  const observer = new MutationObserver(paint);
  customElements.whenDefined('solid-vcard-card').then(() => {
    paint();
    observer.observe(container, { childList: true, subtree: true });
  });
  return () => observer.disconnect();
}
