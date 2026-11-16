# Gesso design kit

Gesso is the design system behind vandervennet.art. This folder is everything a designer needs to make pages that map straight onto the code.

Read **Gesso-design-guide.pdf** first. It's the full system: principles, themes and pigments, type and text styles, space, animation, components, gitflow, voice, layout and handoff.

## Contents

| Folder | What it is |
|---|---|
| `fonts/` | Young Serif (display), Atkinson Hyperlegible Next (body, with italic), Atkinson Hyperlegible Mono (code and branch names), Kristi (the signature only). SIL Open Font License, free to use. |
| `tokens/figma/` | Variables in the W3C design-tokens format, with hex values. Shared: `primitives`, `size.mobile`, `size.desktop`, and the twelve text styles in `text-styles.mobile` and `text-styles.desktop`. Then a folder per theme (`studio`, `harbour`, `plum`) with its `pigments` and one `color` file per paint: `color.deep` and `color.1` to `color.8`. |
| `tokens/tokens-studio.json` | The same tokens in one file for the Tokens Studio plugin, with aliases kept. |
| `assets/strokes/` | Underline (6), highlight (3) and strike brushstrokes. |
| `assets/drips/` | Wet edges with drips, to hang from the bottom of a coloured band. |
| `assets/splatters/` | Splatters for empty states and 404s. Never behind text. |
| `assets/tape/` | Tape strips for tags, in the complement colour. Dark text on tape. |
| `assets/canvas-studies/` | A painted study per pigment, the placeholder for projects without an image. |
| `assets/gitflow/` | Lanes, forks, merges and commit dabs for the timeline. |
| `assets/palette-*.svg` | One sheet per theme: its three pigments with light and wash mixes, the brand shades and the nine section paints, with hex values. |

## Figma setup

1. Install the fonts.
2. Make a **Primitives** collection and a **Size** collection (modes: Mobile, Desktop) from the shared files. For each theme, make a **Color** collection with ten modes: Deep and 1 to 8, importing `color.deep` … `color.8` from that theme's folder. To keep aliases, load `tokens-studio.json` in Tokens Studio instead: it has a set per theme and per paint.
3. Create text styles from the typography tokens in `tokens-studio.json` (Tokens Studio does this in one go). Use only these twelve styles.
4. Turn the SVG assets into components, named after the code: `art-stroke/underline`, `art-button/secondary/l`, `art-tape`, `art-canvas`.
5. Fill and text colours always come from the Color collection, never from hex values. Set each section frame's mode to its paint; switch collection to change theme.

## The short version of the rules

- Beyond the drips, one loud thing per screen: a painted heading or a splatter.
- Each website has one theme: three pigments, a brand, a partner that goes with it and a complement. Use the complement sparingly.
- Every section has its own background and ends in a drip of its own paint. The header and last section are deep; between them paints 1 to 8 in order.
- Text on the deep paint is gesso white. Text on paints 1 to 8, on the partner and on tape is dark.
- Body text at least 17px, nothing under 14px, touch targets at least 44px.
- Frames at 360px and 1280px; columns 4 and 12; margins and gaps 20px and 48px.
- Animate decoration and responses only: drips running, the nav's rail filling in, a dab on press, colours washing on a theme change. Content never fades or slides in, and never waits.
- Every page footer carries the signature, bottom right, like the corner of a painting.
- Sentence case everywhere. Puns stay in names, never on buttons.

The colour values here are generated from the code's source of truth. If they ever disagree with the guide, ask Art to re-run `node scripts/export-design-kit.mjs`.

The SVG assets come in the Studio theme's colours. Recolour them with the Color variables for other themes.
