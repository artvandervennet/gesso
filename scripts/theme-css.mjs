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

/**
 * CSS for one theme.
 *   standalone: true  → the theme applies to the whole page (:root), and also to any [data-theme="id"].
 *                       Use this in a project: import core.css and one theme file.
 *   standalone: false → only [data-theme="id"] (plus :root:not([data-theme]) when isDefault), for pages that switch themes.
 */
export function themeCss(t, { standalone = true, isDefault = false } = {}) {
  const root = standalone ? [':where(:root)'] : isDefault ? [':root:not([data-theme])'] : [];
  const sel = [...root, `[data-theme="${t.id}"]`].join(',\n');
  const deepSel = [
    ...root.map((r) => `${r} [data-paint="deep"]`),
    `[data-theme="${t.id}"] [data-paint="deep"]`,
    `[data-theme="${t.id}"][data-paint="deep"]`,
  ].join(',\n');
  return `/* Gesso theme: ${t.label}.${t.description ? ` ${t.description}` : ''} */
${sel} {
  color-scheme: light;
${decl(themeVars(t))}
}

/* The deep paint: the header and the last section */
${deepSel} {
${decl(Object.entries(t.paints.deep).map(([n, v]) => [`--${n}`, v]))}
}
`;
}
