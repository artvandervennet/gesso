# Changelog

## 1.8.0 — 2026-11-19

All of it is `art-header`.

- An action can fold away with the links. The `actions` slot stays in the bar on a small screen, which is right for the one or two things that must always be in reach, and left no place for a button that may go under "Menu". Give it `fold`: `<art-button slot="actions" fold size="s" variant="secondary"><button type="button">Log out</button></art-button>`. On a wide screen it stands with the other actions, in the order you wrote them; under 48rem the header moves it into the menu as its last line (it changes the element's `slot` to `folded`), and pressing it closes the menu.
- New `nofold`: the links stay in the bar at every width and there is no "Menu" button. For a header with so little in it that it fits a phone's bar.
- The menu is painted down from the bar. It used to open by growing its height, which lays the page out again on every frame and stuttered on a phone. It is now always as tall as its lines and is wiped in from its top edge, which moves nothing; its lines come up one after another behind the edge of the paint, and the drips go and come back in step with it. With reduced motion it opens at once.
- A click outside the header closes the menu, on the page or on a link there. Escape closes it wherever the focus is: Safari gives a button no focus on a click, so with the menu opened by mouse the key did nothing there.

## 1.7.3 — 2026-11-19

- `art-signature` signs in the same hand everywhere. The name was text set in Kristi, so a page where that font was late, blocked or failed to load showed the signature in the browser's own `cursive` font, which on a Mac is Apple Chancery: a different signature. The component now draws "Art Van der Vennet" and the year from Kristi's outlines, kept in `components/signature-ink.js`, and needs no font for them. It takes the same place as before, to within a third of a pixel, and has the weight the text had on a Mac. Another name than the artist's is still set in `--font-signature`.
- New `npm run signature` (`scripts/build-signature.mjs`) reads those outlines out of `design-kit/fonts/Kristi-Regular.ttf`. Run it after changing the font or the name.

## 1.7.2 — 2026-11-19

- The drips no longer flash when `art-header` takes them over. In Safari, for one frame at the moment the header put drips up (leaving the hero, and at every section that repaints it), they were drawn with no styles: both coats at full size and full length, the darker wet one on top, a little under the header. Safari loses the styles a shadow root adopts before it is in the page when anything reads a style between making the element and putting it in, and the header measured the hero's drips in exactly that gap. `art-drip` and `art-splatter` now put their styles on when they are connected, and the header measures first.

## 1.7.1 — 2026-11-19

What went wrong with `art-header` on a phone. All of it was found in Safari on an iPhone.

- The drips have the header's colour again. Their rough edge comes from an SVG filter, and in Safari a colour does not come out of a filter the way it went in: in the dark scheme a header in `rgb(5 24 17)` hung drips in `rgb(0 22 13)`. `art-drip` now uses the filter only to roughen a white shape and paints a flat coat through that shape as a mask, so the paint itself never passes through the filter.
- The wet edge under the drips is a second coat, 2px lower, and no longer a `drop-shadow` on the element, which is a filter over the paint as well. Set its colour with the new `--art-drip-wet` on an `<art-drip>`; without it there is no wet edge. `.band-drip` and `art-header` set it, so the hero and the header look the same as before. A `filter: drop-shadow(…)` of your own on an `<art-drip>` still works.
- The strip above the page, behind the clock, follows the header while a section repaints it. Safari colours that strip with the header's own background, which kept the old paint until the repaint was done: halfway down the page a dark strip stood over a header that had already turned light, and then jumped. The background now follows the top edge of the blend.
- Fresh drips keep their wet edge. Right after the header put new drips up, Safari gave their height as 128px where they are 72px, and the header cut their top edge off until the next scroll. It now uses the height it gave them, which also saves a layout on every scroll.

## 1.7.0 — 2026-11-19

- New `art-share`: wrap a `<button>` and it shares a link. Where the browser has a share sheet (phones, Safari, Chrome and Edge) the button opens it with your words (`text`) and the link (`url`, default the page itself), to send on with any app there. Where it has none, the button copies the link. The link goes to the sheet inside the words, on a line of its own: handed over apart, WhatsApp, Messages and Mail on a Mac or an iPhone send the address and drop the words. Without a clipboard a field with the address appears under the button. `nosheet` makes it a copy button everywhere. `share()` opens the sheet from script, for a link that was just made, and resolves false when the browser won't; `gesso:share` fires when the link went out.
- New `.wordings` in `layout.css`, for a button that changes its words: a `<span data-when="…">` per wording, on top of each other, so the button keeps the width of the longest. `art-share` shows "share", "copy" or "copied", whichever fits the moment, through `data-state`.

## 1.6.2 — 2026-11-19

- The hero's title lands exactly on the wordmark. It used to land up to a pixel beside and under it, which showed as a faint second name while the two swapped. Three causes, all gone:
  - The title's place was read in whole pixels (`offsetTop`, `offsetLeft`). It is now measured to a fraction of a pixel.
  - The title's box was put on the wordmark's box. The two are not the same height around their letters, because their line heights differ. Now the title's first letter is put on the same letter of the wordmark.
  - A browser rounds a font's height to whole pixels, differently at the title's size and at the wordmark's, and Chrome and Firefox do not round the same way. The two now meet on their baselines, which the header measures on a hidden ruler of its own.

## 1.6.1 — 2026-11-19

- The name no longer changes when the hero's title becomes the wordmark. The title is set tighter than the wordmark (`letter-spacing: -0.04em` on `.hero h1`), so the two did not cover each other when they swapped: for a moment you saw the name twice, a few pixels apart, and then it got wider. On the way up the title's letters now move apart to the wordmark's spacing, and every letter lands on its twin. A margin takes back the width that adds, so nothing beside the title moves.
- The name no longer dims during that swap. The title used to fade out while the wordmark faded in, which left both half see-through halfway. Now the wordmark comes in under the title first and the title fades away over it, so one of the two is solid at every moment.

## 1.6.0 — 2026-11-19

- `art-header`'s wordmark can carry a logo. Put an `<img>` (or an inline `<svg>`) inside the wordmark's link, before the name: `<a slot="wordmark" href="/"><img src="/logo.svg" alt="" width="28" height="28">OdyFeed</a>`. `layout.css` makes it one and a half times the name's type size and centres it on the capitals. The header's repaint used to copy the wordmark's words only, so a picture in the link dropped out of the freshly painted half and the name jumped to the left; the copy now holds the logo too. A title that flies up from the hero lands on the name, beside the logo, where it used to land on the link's corner. Wordmarks without a logo look and fly the same as before.

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
