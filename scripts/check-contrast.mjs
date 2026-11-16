// Checks WCAG 2.2 contrast for every pairing, in every paint of every theme.
// Usage: node scripts/check-contrast.mjs   (exits 1 if anything fails)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { contrast } from './color.mjs';
import { loadThemes, PAIRS, rolesIn } from './theme.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const themes = loadThemes(JSON.parse(readFileSync(join(root, 'tokens/themes.json'), 'utf8')));

let failed = 0, checked = 0;
for (const t of themes) {
  const fails = [];
  for (const paint of Object.keys(t.paints)) {
    const roles = rolesIn(t, paint);
    for (const [fg, bg, min, why] of PAIRS) {
      const r = contrast(roles[fg], roles[bg]);
      checked++;
      if (r < min) fails.push(`  FAIL  ${r.toFixed(2)}:1 (≥${min})  ${fg} on ${bg} in paint ${paint} — ${why}`);
    }
  }
  failed += fails.length;
  console.log(`${t.label}: ${fails.length ? fails.length + ' failing' : 'all pass'}`);
  fails.forEach((f) => console.log(f));
}
console.log(failed ? `\n${failed} of ${checked} pairs fail.` : `\nAll ${checked} pairs pass.`);
process.exit(failed ? 1 : 0);
