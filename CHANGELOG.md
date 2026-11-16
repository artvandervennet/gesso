# Changelog

## 1.1.0 — 2026-11-16

A new page anatomy, taken from the portfolio. This is the standard for every project.

- New `art-header`: the sticky page header with the section links. It wears the paint of the section above the one you are reading, marks the current link, and carries the hero's drips along: the same drips, at the same point in their run, left behind on the hero when you scroll back up. Each later section repaints it with a soft OKLCH blend that follows the scroll, and it drips again.
- `art-drip` gets `stagger`: the drips are not there at first; each waits a few seconds, then runs down on its own time. Use it on the hero.
- Drips are rare now. Only the hero and the header drip; sections and the footer have straight edges.
- The footer goes after `</main>`, in the deep paint, and nothing follows it.
- `art-gitflow` gets `newest-first`: the list runs from newest to oldest, like `git log`, and an open branch runs off the top. This is the standard way to write a timeline. `data-pigment` can now sit on any item of a branch.
- `base.css` leaves links inside `art-header` alone, styles the header before it loads, and sets `scroll-padding` so anchors land below it.
- `art-button`: the two drips on hover are drawn by the brush engine now, like every other drip. No drip in Gesso is a plain CSS shape any more. `brush.js` exports `dripShape()` for a single drip.
- Nothing changes place on hover any more: `art-canvas` no longer lifts; it grows 3% in place and its neighbours stay put. This is a rule now (see Animation in the docs).
- `art-canvas` has no outline: it stands off the page by a soft shadow. New `bare` attribute for a text-only canvas with no painted study.
- `art-drip` no longer squeezes on a narrow edge: `count` is the number of drips on a 1200px edge, and a narrower one gets fewer drips at their normal width.
- `art-header` folds on small screens: under 48rem the links sit behind a labelled Menu button whose three lines turn into a cross.
- `art-railnav` stays, for navigation inside a page.
- The docs page follows the new anatomy.

## 1.0.0 — 2026-11-16

First release as a package.

- Install from git: `npm install github:artvandervennet/gesso#v1.0.0`.
- Every project picks one theme: `themes/studio.css`, `themes/harbour.css`, `themes/plum.css`, or its own with `npx gesso-theme`.
- `core.css` holds everything except colours; `tokens.css` holds every theme for pages that switch.
- Self-hosted fonts in `fonts.css`.
- Eleven components: `art-stroke`, `art-button`, `art-swatch`, `art-canvas`, `art-tape`, `art-railnav`, `art-gitflow`, `art-drip`, `art-splatter`, `art-signature`, `art-theme`.
