# Gesso

The design system behind **vandervennet.art**. Gesso is the primer painters brush onto a canvas before any colour goes on. This system does the same job for the portfolio, side projects, slides and CV: a reliable ground, then paint on top.

- **Tokens**: shared tokens in `tokens/tokens.json` and theme recipes in `tokens/themes.json`, built to CSS custom properties. A theme is three pigments (brand, partner, complement); everything else is generated and contrast-checked. Ships with three themes: Studio (phthalo green, the portfolio), Harbour and Plum.
- **Paints**: every section of a page has its own background. Paints `1`…`8` walk the colour wheel from brand to partner to complement; `deep` is the brand itself, used for the header and the last section. Each section ends in a drip of its own paint.
- **Base**: `css/base.css` styles plain HTML: type, links, focus, forms, code, tables.
- **Components**: eleven framework-free custom elements, prefixed `art-`.
- **Docs**: `index.html` is a living reference that uses the system itself.

## Use it in a project

Gesso is installed straight from git. Every project picks its own theme.

### 1. Install

```sh
npm install github:artvandervennet/gesso#v1.0.0
```

The `#v1.0.0` pins a release, so a project only changes when you bump it. Leave it off to follow `main`.

### 2. Pick a theme

Use a built-in theme (`studio`, `harbour` or `plum`), or make the project its own (see below). Then load the fonts, the core, the base styles and **one** theme, in that order:

```css
/* src/styles/main.css */
@import "@vandervennet/gesso/fonts.css";      /* self-hosted fonts, no requests to Google */
@import "@vandervennet/gesso/core.css";       /* spacing, type, motion, paints, text styles */
@import "@vandervennet/gesso/base.css";       /* styles for plain HTML */
@import "@vandervennet/gesso/themes/studio.css"; /* this project's theme */
```

Without a bundler, use `<link rel="stylesheet">` to the same files in `node_modules/@vandervennet/gesso/css/`.

### 3. Load the components

```js
import '@vandervennet/gesso';                                 // every component
import '@vandervennet/gesso/components/art-gitflow.js';      // or just the ones you use
```

### 4. Paint the page

```html
<header data-paint="deep">…<art-drip pigment="--surface" run></art-drip></header>
<section data-paint="1">…</section>
<section data-paint="2">…</section>
<footer data-paint="deep">… <art-signature year="2026">Art Van der Vennet</art-signature></footer>
```

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

Bump the tag in the project's `package.json` (`github:artvandervennet/gesso#v1.1.0`) and run `npm install`. If the project has its own theme, run `npm run theme` again so it picks up generator changes.

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
4. **Motion follows the hand.** Things move when people act. One reveal per page, at most. Reduced motion turns it all off.
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
| Shape | `--radius-canvas`, `--radius-chip`, `--radius-dab`, `--radius-round`, `--shadow-canvas-edge`, `--shadow-tape`, `--shadow-lifted` | Shapes follow materials. |
| Layout | `--measure`, `--canvas-max`, `--gutter` | |
| Motion | `--dur-dab`, `--dur-stroke`, `--dur-drip`, `--ease-brush`, `--ease-drip`, `--ease-settle` | |

Themes: give each website its theme with `<html data-theme="harbour">`; without one, the first theme in `tokens/themes.json` is used. Paints: put `data-paint="deep"` or `"1"`…`"8"` on a section and everything inside follows; end it with `<art-drip pigment="--surface">` at its bottom edge. Add a theme by adding a recipe to `tokens/themes.json` and running the build: anything that would fail contrast is darkened or lightened until it passes.

### Changing a token

```sh
npm run tokens   # tokens.json + themes.json → css/core.css, css/themes/*.css, css/tokens.css
npm run check    # contrast check for every pairing, paint and theme; exits 1 below WCAG AA
```

Put `npm run check` in CI.

## Components

| Element | What it does |
|---|---|
| `<art-stroke>` | Painted underline, highlight or strike behind inline text. `variant`, `pigment`, `seed`, `animate`. |
| `<art-button>` | Wraps a native `<button>` or `<a>`; paint drips on hover. `variant` (primary, secondary, quiet), `size`, `nodrip`. |
| `<art-swatch>` | Paint chip documenting a colour token, with live contrast and copy. `token`, `name`, `code`, `size`. |
| `<art-canvas>` | Stretched-canvas card; paints its own study when there's no image. Whole card follows its first link. `pigment`, `seed`, `wet`. |
| `<art-tape>` | Tape tag in the complement colour. `pigment`, `seed`, `flat`. |
| `<art-signature>` | Your tag in the footer, like the signature on a painting. `year`, `pigment`, `animate`. |
| `<art-theme>` | Theme picker: palettes for every theme in `themes.json`. `label`, `remember`. Fires `gesso:themechange`. |
| `<art-railnav>` | Section nav drawn as a git branch: a painted lane with a dab per section, filling as you scroll (`aria-current="location"`). `label`. |
| `<art-gitflow>` | Turns an `<ol>` into a painted git graph that reveals on scroll. Items: `data-branch`, `data-pigment`, `data-open`, `data-current`. |
| `<art-drip>` | Wet edge with drips, to end a coloured band. `pigment`, `seed`, `count`, `height`, `run`. |
| `<art-splatter>` | Paint splatter for empty states and 404s. `pigment`, `seed`, `size`. |

`components/brush.js` is the shared, seeded paint engine (strokes, bristles, splatter, drips, rough-edge filter).

### Accessibility notes

- All decoration is `aria-hidden`. Lists stay lists, links stay links.
- `art-button` keeps native focus, keyboard and form behaviour; targets are 44px tall (36px for `size="s"`).
- Focus rings use `--focus` (the complement), 3px with a 3px offset, at least 3:1 on every paint.
- Errors are always red or orange: when a theme's complement isn't, the generator mixes a red.
- Status colours always come with a word; branch colours always come with a branch name.
- `prefers-reduced-motion` disables drips, stroke painting and the gitflow reveal.

## Text styles and animation

Twelve text styles (`.text-wordmark` … `.text-signature`) are generated from the `text` group in `tokens/tokens.json`. Animation is decoration and feedback only: content is there on the first frame and never waits. See the Animation section of the docs for every animation, its trigger, timing and reduced-motion behaviour.

## Voice

Paint puns live in the frame: token names, component names, the docs. Words people act on stay plain: sentence case, verbs that say what happens, the same verb through a whole flow, errors that say how to fix the problem.

## Credits

Inspired by the sites of Bart Delrue (ctrlaltdelrue.be) and Michiel Van de Velde (michielvandevelde.com), used with their permission. Gesso's git graph is a painted reinterpretation of the gitflow timeline on Michiel's site.
