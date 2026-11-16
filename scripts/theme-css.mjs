// Turns a built theme into CSS. Shared by the token build and the `gesso-theme` command.
import { PAINT_COUNT } from './theme.mjs';

const decl = (list, indent = '  ') => list.map(([n, v, d]) => `${indent}${n}: ${v};${d ? ` /* ${d} */` : ''}`).join('\n');

function themeVars(t) {
  const list = [];
  for (const [role, p] of Object.entries(t.pigment)) {
    list.push([`--pigment-${role}`, p.body, `${p.name} (${p.code})`], [`--pigment-${role}-light`, p.light], [`--pigment-${role}-wash`, p.wash]);
  }
  for (const [n, v] of Object.entries(t.neutral)) list.push([`--neutral-${n}`, v]);
  for (let i = 1; i <= PAINT_COUNT; i++) {
    const p = t.paints[i];
    list.push([`--paint-${i}`, p.surface], [`--paint-${i}-sunken`, p['surface-sunken']], [`--paint-${i}-rule`, p.rule]);
  }
  for (const [n, v] of Object.entries(t.roles)) list.push([`--${n}`, v]);
  return list;
}

/** What the dark scheme changes: the pigments that sit on the page, the eight paints and the roles. */
function darkVars(t) {
  const list = [];
  for (const [role, p] of Object.entries(t.dark.pigment)) list.push([`--pigment-${role}`, p.body], [`--pigment-${role}-wash`, p.wash]);
  for (let i = 1; i <= PAINT_COUNT; i++) {
    const p = t.dark.paints[i];
    list.push([`--paint-${i}`, p.surface], [`--paint-${i}-sunken`, p['surface-sunken']], [`--paint-${i}-rule`, p.rule]);
  }
  for (const [n, v] of Object.entries(t.dark.roles)) list.push([`--${n}`, v]);
  return list;
}

/**
 * CSS for one theme.
 *   standalone: true  → the theme applies to the whole page (:root), and also to any [data-theme="id"].
 *                       Use this in a project: import core.css and one theme file.
 *   standalone: false → only [data-theme="id"] (plus :root:not([data-theme]) when isDefault), for pages that switch themes.
 *
 * Every theme has a dark scheme, and a page only gets it when it asks:
 *   <html data-scheme="dark">  or  <html class="dark">   always dark
 *   <html data-scheme="auto">                             dark when the visitor's system is
 *   anything else                                         light
 */
export function themeCss(t, { standalone = true, isDefault = false } = {}) {
  const root = standalone ? [':where(:root)'] : isDefault ? [':root:not([data-theme])'] : [];
  const sel = [...root, `[data-theme="${t.id}"]`].join(',\n');
  const deepSel = [
    ...root.map((r) => `${r} [data-paint="deep"]`),
    `[data-theme="${t.id}"] [data-paint="deep"]`,
    `[data-theme="${t.id}"][data-paint="deep"]`,
  ].join(',\n');
  // the page element in this theme, to hang the scheme on
  const pages = standalone ? [':root'] : [...(isDefault ? [':root:not([data-theme])'] : []), `:root[data-theme="${t.id}"]`];
  const darkSel = pages.flatMap((p) => [`${p}[data-scheme="dark"]`, `${p}.dark`]).join(',\n');
  const autoSel = pages.map((p) => `${p}[data-scheme="auto"]`).join(',\n  ');
  const dark = darkVars(t);
  return `/* Gesso theme: ${t.label}.${t.description ? ` ${t.description}` : ''} */
${sel} {
  color-scheme: light;
${decl(themeVars(t))}
}

/* The deep paint: the header and the last section */
${deepSel} {
${decl(Object.entries(t.paints.deep).map(([n, v]) => [`--${n}`, v]))}
}

/* ${t.label} after dark. Only for pages that ask: data-scheme="dark" or class="dark". */
${darkSel} {
  color-scheme: dark;
${decl(dark)}
}

/* data-scheme="auto" follows the visitor's system */
@media (prefers-color-scheme: dark) {
  ${autoSel} {
    color-scheme: dark;
${decl(dark, '    ')}
  }
}
`;
}
