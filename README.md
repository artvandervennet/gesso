# Gesso

The design system behind **vandervennet.art**. Gesso is the primer painters brush onto a canvas before any colour goes on. This system does the same job for the portfolio, side projects, slides and CV: a reliable ground, then paint on top.

- **Tokens**: shared tokens in `tokens/tokens.json` and theme recipes in `tokens/themes.json`, built to CSS custom properties. A theme is three pigments (brand, partner, complement); everything else is generated and contrast-checked. Ships with three themes: Studio (phthalo green, the portfolio), Harbour and Plum.
- **Paints**: every section of a page has its own background. Paints `1`…`8` walk the colour wheel from brand to partner to complement; `deep` is the brand itself, used for the header, the hero, the last section and the footer. Only the hero and the sticky header drip.
- **Base**: `css/base.css` styles plain HTML: type, links, focus, forms, code, tables.
- **Layout**: `css/layout.css` is the page anatomy as classes: bands, the hero, two-column sections, the one card, the footer. A new site that loads it has the same structure as the portfolio.
- **Sass**: `scss/` has the tokens as checked functions and the breakpoints as mixins.
- **Components**: fourteen framework-free custom elements, prefixed `art-`.
- **Light and dark**: every theme has both schemes, contrast-checked. A page is light unless it asks for dark.
- **Docs**: `index.html` is a living reference that uses the system itself.

## Use it in a project

Gesso is installed straight from git. Every project picks its own theme.

### 1. Install

```sh
npm install github:artvandervennet/gesso#v1.2.0
```

The `#v1.2.0` pins a release, so a project only changes when you bump it. Leave it off to follow `main`.

### 2. Pick a theme

Use a built-in theme (`studio`, `harbour` or `plum`), or make the project its own (see below). Then load the fonts, the core, the base styles, the layout and **one** theme, in that order:

```css
/* src/styles/main.css */
@import "@vandervennet/gesso/fonts.css";      /* self-hosted fonts, no requests to Google */
@import "@vandervennet/gesso/core.css";       /* spacing, type, motion, paints, text styles */
@import "@vandervennet/gesso/base.css";       /* styles for plain HTML */
@import "@vandervennet/gesso/layout.css";     /* the page anatomy: bands, sections, cards */
@import "@vandervennet/gesso/themes/studio.css"; /* this project's theme */
```

Without a bundler, use `<link rel="stylesheet">` to the same files in `node_modules/@vandervennet/gesso/css/`.

### 3. Load the components

```js
import '@vandervennet/gesso';                                 // every component
import '@vandervennet/gesso/components/art-gitflow.js';      // or just the ones you use
```

### 4. Paint the page

Every page follows the same anatomy, and `layout.css` has the classes for it:

```html
<body>
  <a class="skip-link" href="#main">Skip to content</a>

  <!-- 1. The sticky header, first in the body. It carries the hero's drips down the page. -->
  <art-header label="Sections" data-paint="deep">
    <a slot="wordmark" href="#top">Art Van der Vennet</a>
    <a href="#about">About</a>
    <a href="#work">Work</a>
  </art-header>

  <main id="main" tabindex="-1">
    <!-- 2. The hero, in the deep paint. The only band with a drip of its own. -->
    <div class="band hero" data-paint="deep" id="top">
      <div class="inner">
        <h1>…</h1>        <!-- on the home page, <h1 data-wordmark> with the site name -->
        <p class="lead">…</p>
        <div class="actions">…</div>
      </div>
      <art-drip class="band-drip" pigment="--surface" stagger flush></art-drip>
    </div>

    <!-- 3. Sections in paints 1, 2, 3… in order. Title on the left, content on the right. -->
    <section class="band section" data-paint="1" id="about" aria-labelledby="about-h">
      <div class="inner">
        <div class="section-head">
          <h2 id="about-h" class="section-title">…</h2>
          <p class="intro">…</p>
        </div>
        <div class="section-body">…</div>
      </div>
    </section>
    <section class="band section" data-paint="2" id="work" aria-labelledby="work-h">
      <!-- A timeline is a git graph, newest first. -->
      … <art-gitflow newest-first><ol>…</ol></art-gitflow> …
    </section>
    <!-- The last section is deep again. -->
    <section class="band section" data-paint="deep" id="contact" aria-labelledby="contact-h">…</section>
  </main>

  <!-- 4. The footer, after main, in the deep paint. Nothing comes after it, and it doesn't drip. -->
  <footer class="band page-footer" data-paint="deep">
    <div class="inner"><art-signature year="2026">Art Van der Vennet</art-signature></div>
  </footer>
</body>
```

| Class | What it is |
|---|---|
| `.band` | A painted band of the page. Put `data-paint` on it. |
| `.inner` | The content of a band: centred, at most 80rem wide, with the page gutter. |
| `.band-drip` | An `<art-drip>` on the bottom edge of a band. Only the hero has one. |
| `.hero`, `.lead`, `.actions` | The opening band: a large title, one sentence, a row of buttons. |
| `.section` | A band with a title column and a content column from 60rem up: `.section-head` (`.section-title`, optional `.intro`) and `.section-body`. The head stays in view while its section scrolls. |
| `.longform` | Running text meant to be read, a step larger than body text. |
| `.card`, `.card-grid` | The one card (no outline, `--shadow-card`), and a grid of them one or two wide. With an odd number the first card takes the whole first row. |
| `.field-row`, `.form-message` | A field with its button beside it, and what the form says back. |
| `.stack`, `.avatar`, `.dialog`, `.menu`, `.tabs`, `.skeleton`, `.empty` | For apps: a feed, a person, a native dialog, a popover menu, tabs, loading and empty states. |
| `.page-footer` | The footer: same paint as the last section, no rule, the signature bottom right. |

The rules behind it:

- **The header takes the paint of the section above the one you are reading**, and drips it onto the page. `<art-header>` does this by itself: every top-level element with `data-paint` is a band.
- **Drips are rare.** Only the hero and the header drip. A drip under every section is tiring, not fun.
- **Drips are never there at once.** With `stagger`, every drip waits a few seconds, then runs down on its own time, once.
- **The header takes the hero's drips along.** When the hero scrolls away, the same drips hang off the header without starting again; scroll back and they stay on the hero.
- **The repaint follows the scroll.** While a section boundary passes behind the header, the new paint comes up through it as a soft blend: from the bottom edge upwards on the way down the page, from the top edge downwards on the way back up. The paints are mixed in OKLCH, so the blend passes through real in-between colours and never through grey.
- **The home page's title becomes the wordmark.** With `<h1 data-wordmark>` in the hero, the header starts without a wordmark. As you scroll, the title moves up and shrinks into the wordmark's place, and the header's own wordmark takes over. Other pages leave it off and keep the wordmark in the header all the time. A name that takes more than one line is marked line by line, `<h1><span data-wordmark>Art Van</span> <span data-wordmark>der Vennet</span></h1>`: each line flies to its own words in the wordmark, so the lines come together into one on the way up.
- **The wordmark can carry a logo.** Put an `<img>` (or an inline `<svg>`) inside the wordmark's link, before the name: `<a slot="wordmark" href="/"><img src="/logo.svg" alt="" width="28" height="28">OdyFeed</a>`. The link is named by the site's name, so the picture gets an empty `alt`. `layout.css` sizes it to the name, the repaint paints it along with the name, and a title that flies up from the hero lands on the name, beside the logo.
- **Fresh paint drips.** Every later section repaints the header, and it drips again: new drips, each after its own wait.
- **Drips stay in their section.** They hang straight off the header, with no band of paint under it, and never into the next section: as it comes up they get shorter, all together, and are gone when it reaches the header.
- **The footer is outside `<main>`** and is the last thing on the page.
- **Timelines read newest first**, like `git log`.
- **Sections are two columns on wide screens**: the title and intro on the left, pinned while the section scrolls, the content on the right.
- **There is one card.** No outline, square corners, a soft shadow. Every card on a page looks the same, and a grid of them never ends in a hole.
- **Nothing changes place on hover.** Buttons and links respond with paint. A card may grow slightly, in place.
- **A section link lands its section right under the header**, with the title clear of the drips.

### Inside a framework that has its own base

A docs framework or Tailwind already resets the page and styles plain elements. There, skip `base.css` and put Gesso's tokens in a cascade layer **before** the framework's, so its theme wins where the two use the same variable name (Tailwind's `--leading-tight` and `--font-mono`, for instance), and its utilities still win over Gesso's layout:

```css
@layer gesso.tokens, theme, base, gesso-layout, components, utilities;

@import "tailwindcss";
@import "@vandervennet/gesso/fonts.css";
@import "@vandervennet/gesso/core.css" layer(gesso.tokens);
@import "./gesso-theme.css" layer(gesso.tokens);
@import "@vandervennet/gesso/layout.css" layer(gesso-layout);
```

The layout stylesheet goes in a layer with a name of its own (`gesso-layout`, with a hyphen). Its rules are written in `gesso.layout`, and every `gesso.*` layer sorts together at the position of the first one, so without the extra name the layout would land before the framework's reset and lose its padding to it.

The components hold their shape under such a reset: the padding, fonts and colours they give their own links and buttons are marked `!important`, because a page rule like `* { padding: 0 }` or `a { color: inherit }` otherwise beats a component's styles for the elements you put inside it. Change how they look through the tokens and the documented custom properties.

The layout classes work as usual. Gesso's long-text class is `.longform`, not `.prose`, so it doesn't collide with Tailwind Typography.

### Light and dark

Every theme file carries a dark scheme. A page is light unless `<html>` asks:

| On `<html>` | Result |
|---|---|
| nothing, or `data-scheme="light"` | Light |
| `data-scheme="dark"` or `class="dark"` | Dark |
| `data-scheme="auto"` | Dark when the visitor's system is, with no script |

`<art-scheme remember>` is a ready-made switch. To avoid a flash of the wrong scheme, set it early in `<head>`:

```html
<script>try { const s = localStorage.getItem('gesso-scheme'); if (s) document.documentElement.dataset.scheme = s; } catch {}</script>
```

The deep paint is the brand in both schemes, so the header and hero look the same day and night.

### In an app

`<art-header>` also works as an app header. Links can be routes (mark the current one with `aria-current="page"`), and buttons go in its `actions` slot:

```html
<art-header label="Main" data-paint="deep">
  <a slot="wordmark" href="/">OdyFeed</a>
  <a href="/about" aria-current="page">About</a>
  <art-scheme slot="actions" remember></art-scheme>
  <art-button slot="actions" size="s"><a href="/login">Log in</a></art-button>
</art-header>
```

### With Sass

```scss
@use '@vandervennet/gesso/scss' as *;

@include layers(components);        // Gesso's cascade layers first, then site.components

@include layer(components) {
  .price {
    padding: space(4) space(6);     // tokens as functions; space(5) fails the build
    color: role(ink-muted);
    @include card;
    @include from(wide) { padding: space(8); }
  }
}
```

Functions: `token()`, `space()`, `step()`, `role()`, `paint()`, `pigment()`, `font()`, `weight()`, `leading()`, `radius()`, `shadow()`, `dur()`, `ease()`, `rem()`, `fluid()`, `mix()`. Mixins: `from()`, `until()`, `layers()`, `layer()`, `motion-ok`, `not-upgraded`, `card`, `lead-card`. Breakpoints: `small` 40rem, `compact` 48rem (the header folds), `wide` 60rem (sections go two columns), `roomy` 72rem.


### A project's own theme

Write a recipe of three pigments in OKLCH (lightness %, chroma, hue):

```json
{
  "id": "terra",
  "label": "Terra",
  "brand":      { "name": "Burnt umber",   "code": "PBr7", "oklch": [38, 0.07, 50] },
  "partner":    { "name": "Naples yellow", "code": "PY35", "oklch": [88, 0.08, 90] },
  "complement": { "name": "Cerulean",      "code": "PB36", "oklch": [60, 0.11, 230] }
}
```

Build it into the project, then import it instead of a built-in theme:

```sh
npx gesso-theme theme.json --out src/styles/theme.css --hex design/theme.hex.json
```

The command mixes the shades and the eight section paints, fixes anything that would fail contrast, checks all 162 pairings, and stops with an explanation if something still fails. `--hex` writes every colour as hex, per paint, for your designer. Add it to the project's scripts so the theme rebuilds with the package:

```json
"scripts": { "theme": "gesso-theme theme.json --out src/styles/theme.css" }
```

### Updating

Bump the tag in the project's `package.json` (`github:artvandervennet/gesso#v1.7.2`) and run `npm install`. If the project has its own theme, run `npm run theme` again so it picks up generator changes.

### Releasing a new version (in this repo)

```sh
npm run build                      # tokens, theme files, contrast check, design kit
git commit -am "…"
npm version minor                  # bumps package.json and creates the tag
git push --follow-tags
```

The built CSS is committed, so projects never need to build Gesso themselves.

### The docs

`index.html` is a living reference that uses the system itself. Run `npm run docs` and open http://localhost:8080.

## Principles

1. **Prime before you paint.** Pages work as plain HTML first. Components wrap real buttons, links and lists.
2. **One bold stroke per view.** One loud thing; everything around it stays quiet.
3. **Paint for every eye.** Every colour pairing is contrast-checked. Colour never carries meaning alone.
4. **Motion follows the hand.** Things move when people act, but nothing changes place under the pointer: a hover never moves an element or shifts its neighbours. One reveal per page, at most. Reduced motion turns it all off.
5. **Leave visible brushwork.** Strokes, tape and dabs are irregular on purpose, but seeded, so they render identically every time.

## Tokens

| Group | Examples | Notes |
|---|---|---|
| Pigments | `--pigment-brand`, `--pigment-partner`, `--pigment-complement` | Per theme. Each also has `-light` (reads on the deep paint) and `-wash`. OKLCH. |
| Neutrals | `--neutral-50` … `--neutral-950` | Shades of the theme's brand colour. 50 is gesso, 600 is the brand, 950 is text. |
| Paints | `--paint-1` … `--paint-8` (+ `-sunken`, `-rule`) | Section backgrounds, per theme. Applied with `data-paint`. |
| Roles | `--surface`, `--surface-raised`, `--surface-sunken`, `--canvas`, `--on-canvas`, `--tape`, `--on-tape`, `--ink`, `--ink-muted`, `--rule`, `--rule-strong`, `--accent`, `--on-accent`, `--accent-wash`, `--link`, `--focus`, `--stroke`, `--highlight`, `--success`, `--warning`, `--danger`, `--info` | Switch with the theme. Components only use roles. |
| Type | `--font-display` (Young Serif), `--font-body` (Atkinson Hyperlegible Next), `--font-mono` (Atkinson Hyperlegible Mono), `--step--1` … `--step-5`, `--leading-*`, `--weight-*` | Fluid major-third scale from 18px. |
| Space | `--space-1` … `--space-32` | 4px grid. |
| Shape | `--radius-canvas`, `--radius-chip`, `--radius-dab`, `--radius-round`, `--shadow-card`, `--shadow-tape`, `--shadow-lifted`, `--shadow-canvas-edge` | Shapes follow materials. |
| Layout | `--measure`, `--canvas-max`, `--gutter` | |
| Motion | `--dur-dab`, `--dur-stroke`, `--dur-drip`, `--ease-brush`, `--ease-drip`, `--ease-settle` | |

Themes: give each website its theme with `<html data-theme="harbour">`; without one, the first theme in `tokens/themes.json` is used. Paints: put `data-paint="deep"` or `"1"`…`"8"` on a section and everything inside follows. Sections don't drip; see the page anatomy above. Add a theme by adding a recipe to `tokens/themes.json` and running the build: anything that would fail contrast is darkened or lightened until it passes.

### Changing a token

```sh
npm run tokens   # tokens.json + themes.json → css/core.css, css/themes/*.css, css/tokens.css, scss/_keys.scss
npm run check    # contrast check for every pairing, paint and theme; exits 1 below WCAG AA
```

Put `npm run check` in CI.

### Changing the signature

```sh
npm run signature   # Kristi's outlines for the name and the year → components/signature-ink.js
```

`<art-signature>` draws the name from that file. Run it after changing the font or the name in `scripts/build-signature.mjs`.

## Components

| Element | What it does |
|---|---|
| `<art-stroke>` | Painted underline, highlight or strike behind inline text. `variant`, `pigment`, `seed`, `animate`. |
| `<art-button>` | Wraps a native `<button>` or `<a>`; paint drips on hover. `variant` (primary, secondary, quiet), `size`, `nodrip`. |
| `<art-swatch>` | Paint chip documenting a colour token, with live contrast and copy. `token`, `name`, `code`, `size`. |
| `<art-canvas>` | Stretched-canvas card; paints its own study when there's no image. Whole card follows the link in its heading; other links inside stay ordinary links. `pigment`, `seed`, `wet`. |
| `<art-tape>` | Tape tag in the complement colour. `pigment`, `seed`, `flat`. |
| `<art-signature>` | Your tag in the footer, like the signature on a painting. Drawn from outlines, so it is the same hand with or without the fonts. `year`, `pigment`, `animate`. |
| `<art-theme>` | Theme picker: palettes for every theme in `themes.json`. `label`, `remember`. Fires `gesso:themechange`. |
| `<art-scheme>` | One button that switches between light, dark and the visitor's system, and says which in words. `remember`, `label`. Fires `gesso:schemechange`. |
| `<art-password>` | Wraps a native `<input type="password">` and puts an eye at its end that shows and hides what was typed; hidden again when the form is sent. `label`. |
| `<art-share>` | Wraps a native `<button>` and makes it share a link: it opens the device's share sheet with your words and the link, and where the browser has no sheet it copies the link and says so in the button. `url`, `text`, `heading`, `nosheet`, `copied-label`, `manual-label`. Sets `data-state`; `share()` and `copy()`; fires `gesso:share`. |
| `<art-header>` | The sticky page header and the standard navigation, folding into a labelled Menu button under 48rem: wordmark, section links (`aria-current="location"` on the one you're in), and drips: it carries the hero's along, and drips afresh each time a section repaints it. Wears the paint of the section above the current one. On a home page, give the hero's title `data-wordmark` and it flies up into the header as the wordmark; a name that takes more than one line gets it on a `<span>` per line. The wordmark's link can hold a logo, an `<img>` before the name. `label`, `nodrip`. |
| `<art-railnav>` | Section nav drawn as a git branch, for use inside a page: a painted lane with a dab per section, filling as you scroll (`aria-current="location"`). `label`. |
| `<art-gitflow>` | Turns an `<ol>` into a painted git graph that reveals on scroll. Write the list newest first and add `newest-first`. Items: `data-branch`, `data-pigment`, `data-open`, `data-current`. |
| `<art-drip>` | Wet edge with drips, for the hero. `pigment`, `seed`, `count`, `height`, `run` (all drips run once, together), `stagger` (each drip waits a few seconds, then runs on its own), `flush` (no band of paint above the drips). The hero uses `stagger flush`. `--art-drip-wet` is the colour of a wet edge under the drips; `.band-drip` sets it. |
| `<art-splatter>` | Paint splatter for empty states and 404s. `pigment`, `seed`, `size`. |

`components/brush.js` is the shared, seeded paint engine (strokes, bristles, splatter, drips, rough-edge filter).

### Accessibility notes

- All decoration is `aria-hidden`. Lists stay lists, links stay links.
- `art-button` keeps native focus, keyboard and form behaviour; targets are 44px tall (36px for `size="s"`).
- `art-password`'s eye is a real button with a fixed name and `aria-pressed`, so a screen reader hears "Show password, toggle button, pressed" rather than a name that changes under the focus.
- `art-share` leaves the button a real button. Its hidden wordings are no part of its name, and "Link copied" is also said in a status line, because a screen reader doesn't read a button's new words while the focus is on it. Without a clipboard it shows the address in a labelled field, selected.
- Focus rings use `--focus` (the complement), 3px with a 3px offset, at least 3:1 on every paint.
- Errors are always red or orange: when a theme's complement isn't, the generator mixes a red.
- Status colours always come with a word; branch colours always come with a branch name.
- `prefers-reduced-motion` disables drips, stroke painting and the gitflow reveal. Staggered drips are then shown in full at once.
- `art-header` marks the current section by weight and a brushstroke, not colour alone.

## Text styles and animation

Twelve text styles (`.text-wordmark` … `.text-signature`) are generated from the `text` group in `tokens/tokens.json`. Animation is decoration and feedback only: content is there on the first frame and never waits. See the Animation section of the docs for every animation, its trigger, timing and reduced-motion behaviour.

## Voice

Paint puns live in the frame: token names, component names, the docs. Words people act on stay plain: sentence case, verbs that say what happens, the same verb through a whole flow, errors that say how to fix the problem.

## Licence

Gesso's code is MIT licensed (see `LICENSE`). The four typefaces in `design-kit/fonts/` keep their own SIL Open Font License; the licence texts are in that folder.

## Credits

Inspired by the sites of Bart Delrue (ctrlaltdelrue.be) and Michiel Van de Velde (michielvandevelde.com), used with their permission. Gesso's git graph is a painted reinterpretation of the gitflow timeline on Michiel's site.
