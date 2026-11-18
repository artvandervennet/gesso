# Changelog

## 1.5.0 — 2026-11-19

- A name that takes more than one line in the hero can fly into the header too. Mark each line, not the `<h1>`: `<h1><span data-wordmark>Art Van</span> <span data-wordmark>der Vennet</span></h1>`. Each line flies to its own words in the wordmark, so the lines come together into one on the way up. A whole `<h1 data-wordmark>` on two lines used to land as two small lines on top of the one-line wordmark. `layout.css` keeps each marked line together, so the name breaks between them. A title marked on the `<h1>` flies the same as before.

## 1.4.0 — 2026-11-18

- New `art-password`: wrap an `<input type="password">` and it gets an eye at its end that shows and hides what was typed. The eye is a real button with a fixed name (`label`, default "Show password") and `aria-pressed`. A mouse press leaves the cursor in the field, and the field is a password field again when its form is sent, so a password manager still offers to save it.

## 1.3.0 — 2026-11-18

- `art-header` can take its wordmark from the hero. Give the hero's title `data-wordmark` on a home page whose title is the site name: at the top of the page the header has no wordmark, and as you scroll the title moves up and shrinks into the wordmark's place, where the header's own wordmark takes over. Scroll back and it comes down again. Pages without `data-wordmark` look the same as before. With reduced motion the title scrolls away as usual and the wordmark appears once it has gone under the header.
- The docs page's title flies into its header.

## 1.2.5 — 2026-11-17

- `art-canvas` follows the link in its heading, not the first link of any kind. A link elsewhere in the card, such as a name in the credits, used to turn the whole card into a link to that address when the heading had none. To point a card at a link outside its heading, give that link `data-card-link`.

## 1.2.4 — 2026-11-16

- `art-scheme` has parts, `button` and `name`, so a crowded header can hide the word and keep the dab: `art-scheme::part(name) { display: none; }`.

## 1.2.3 — 2026-11-16

- `art-stroke` no longer leaves a space after the word it paints, so a full stop or comma right after it sits tight.

## 1.2.2 — 2026-11-16

- `art-button`, `art-header`, `art-tape` and `art-signature` keep their padding, fonts and colours on a page with a reset such as Tailwind's. A page rule like `* { padding: 0 }` or `a { color: inherit }` used to win over what a component gives the link or button inside it; those declarations are now `!important`. Pages without such a reset look the same as before.
- README: the layer order for loading Gesso inside a framework was wrong. `gesso.layout` sorts together with `gesso.tokens`, ahead of the framework's reset. Import `layout.css` with `layer(gesso-layout)` instead.

## 1.2.1 — 2026-11-16

- `.prose` is now `.longform`. `.prose` is Tailwind Typography's class, and the two fought wherever both were loaded. **Rename it in your markup when you update.**
- README: how to load Gesso inside a framework that has its own base styles.
- MIT licence.

## 1.2.0 — 2026-11-16

Dark schemes, and what an app needs.

- Every theme has a dark scheme. The paints keep their hues and go deep, the ink goes gesso white, the deep paint stays the brand. All pairings are contrast-checked in both schemes (`npm run check`, `gesso-theme`). Dark is opt-in per page: `<html data-scheme="dark">` or `class="dark"`, or `data-scheme="auto"` to follow the system. A page that says nothing stays light.
- New `art-scheme`: one labelled button that switches between light, dark and system.
- `art-header` works as an app header: an `actions` slot for buttons at the right, route links marked with `aria-current="page"` get the brushstroke, and it notices when the page under it changes without a scroll.
- `layout.css` gains patterns for apps: `.stack`, `.avatar`, `.dialog` (native dialog), `.menu` (popover API), `.tabs`, `.skeleton`, `.empty`.
- New `components/vcard-paint.js`: repaints `<solid-vcard-card>` in Gesso.
- The repository is public, so installing no longer needs a key.

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
- New `layout.css`: the page anatomy as classes (`.band`, `.inner`, `.hero`, `.section` with a pinned title column, `.card`, `.card-grid`, `.page-footer`), in the cascade layer `gesso.layout`. The docs page uses it and nothing else.
- New `scss/`: tokens as functions that fail the build on a wrong name, breakpoints and layers as mixins.
- New token `--shadow-card`: the one card look, with no outline. `art-canvas` uses it.
- The docs page loads the self-hosted fonts, not Google's.
- `art-railnav` stays, for navigation inside a page.
- The docs page follows the new anatomy.

## 1.0.0 — 2026-11-16

First release as a package.

- Install from git: `npm install github:artvandervennet/gesso#v1.0.0`.
- Every project picks one theme: `themes/studio.css`, `themes/harbour.css`, `themes/plum.css`, or its own with `npx gesso-theme`.
- `core.css` holds everything except colours; `tokens.css` holds every theme for pages that switch.
- Self-hosted fonts in `fonts.css`.
- Eleven components: `art-stroke`, `art-button`, `art-swatch`, `art-canvas`, `art-tape`, `art-railnav`, `art-gitflow`, `art-drip`, `art-splatter`, `art-signature`, `art-theme`.
