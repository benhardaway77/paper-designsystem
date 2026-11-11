import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  cssName, resolveAll, buildCss, gradientCss, shadowCss, THEMES, PALETTES,
} from '../scripts/lib.mjs';

const source = JSON.parse(readFileSync(new URL('../figma/variables.json', import.meta.url)));

test('export contains all 144 Figma variables in 3 collections', () => {
  assert.equal(source.collections.length, 3);
  const total = source.collections.reduce((n, c) => n + c.variables.length, 0);
  assert.equal(total, 144);
});

test('cssName sanitises Figma names into valid, prefixed custom properties', () => {
  assert.equal(cssName('color/peach/200'), '--paper-color-peach-200');
  assert.equal(cssName('color/neutral/translucents/neutral700-½'), '--paper-color-neutral-translucents-neutral700-half');
  assert.equal(cssName('pairs-tokens/neutral700½-color400½'), '--paper-pairs-tokens-neutral700half-color400half');
  assert.equal(cssName('color/neutral/translucents/black-40(idkw)'), '--paper-color-neutral-translucents-black-40-idkw');
  assert.equal(cssName('primary'), '--paper-primary');
});

test('css names are unique across every collection', () => {
  const names = source.collections.flatMap(c => c.variables.map(v => cssName(v.n)));
  assert.equal(new Set(names).size, names.length);
});

test('every alias resolves to a concrete value in all 8 theme × palette combinations', () => {
  const resolved = resolveAll(source);
  for (const theme of THEMES) {
    for (const palette of PALETTES) {
      for (const [name, value] of Object.entries(resolved[theme][palette])) {
        assert.ok(value !== undefined && value !== null && typeof value !== 'object',
          `${theme}/${palette} ${name} did not resolve: ${JSON.stringify(value)}`);
      }
    }
  }
});

test('resolution follows Figma semantics across both axes', () => {
  const r = resolveAll(source);
  // light text is neutral; dark text takes the palette's vibrant colour
  assert.equal(r.light.peach['fonts/main'], '#414141');
  assert.equal(r.dark.pink['fonts/main'], '#f7baba');
  assert.equal(r.dark.lavanda['fonts/main'], '#f5d6e6');
  // first layer: palette primary in light, neutral 900 in dark
  assert.equal(r.light.grayblue['surfaces/main/first-layer'], '#e1e5ef');
  assert.equal(r.dark.grayblue['surfaces/main/first-layer'], '#272727');
  // raw (non-alias) mode value
  assert.equal(r.dark.peach['components/logo/surface'], '#00000000');
  // non-colour tokens
  assert.equal(r.light.peach['components/card/main-card-radius'], 35);
  assert.equal(r.dark.peach['borders/shadow-or-border/border-thick'], 0);
  assert.equal(r.dark.peach['borders/shadow-or-border/is-shadow'], true);
});

test('CSS keeps the alias chain so theme and palette switch independently', () => {
  const css = buildCss(source);
  assert.match(css, /--paper-color-peach-200: #f7e1d7;/);
  assert.match(css, /--paper-fonts-main: var\(--paper-pairs-tokens-neutral700-color400\);/);
  assert.match(css, /\[data-palette="pink"\]\s*{[^}]*--paper-primary: var\(--paper-color-pink-200\);/);
  assert.match(css, /\[data-theme="dark"\][^{]*{[^}]*--paper-pairs-tokens-neutral700-color400: var\(--paper-vibrant\);/);
  assert.match(css, /--paper-components-card-main-card-radius: 35px;/);
  // booleans have no CSS meaning and must not leak in
  assert.doesNotMatch(css, /light-theme/);
});

test('gradient and shadow styles convert to CSS', () => {
  const light = source.styles.paint.find(p => p.n === 'gradient/light').paints[0];
  assert.equal(gradientCss(light), 'conic-gradient(from 90deg, #f7d9d9 6.5%, #efe1e8 36%, #e1e5ef 58.5%, #f7e1d7 87.5%)');
  assert.equal(shadowCss(source.styles.effect[0].effects), '0 1px 4px 0 #00000033');
});
