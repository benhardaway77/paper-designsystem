import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  cssName, resolveAll, buildCss, buildJs, gradientCss, shadowCss, applyExtensions, THEMES, PALETTES,
} from '../scripts/lib.mjs';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const figma = read('../figma/variables.json');
const extensions = read('../tokens/extensions.json');
const source = applyExtensions(figma, extensions);

test('Figma export contains all 144 variables in 3 collections', () => {
  assert.equal(figma.collections.length, 3);
  const total = figma.collections.reduce((n, c) => n + c.variables.length, 0);
  assert.equal(total, 144);
});

test('applyExtensions adds modes and variables without mutating the Figma export', () => {
  const before = JSON.stringify(figma);
  const tokens = source.collections.find(c => c.name === 'Tokens');
  const colors = source.collections.find(c => c.name === 'Colors');
  assert.deepEqual(tokens.modes, THEMES);
  assert.deepEqual(colors.modes, PALETTES);
  assert.equal(JSON.stringify(figma), before);
  assert.ok(tokens.variables.some(v => v.n === 'components/button/primary-surface'));
});

test('applyExtensions rejects typos and incomplete variables', () => {
  assert.throws(() => applyExtensions(figma, { modes: { Tokens: ['eink'] }, modeValues: { Tokens: { eink: { 'fonts/mian': '#000000' } } } }), /unknown variable "fonts\/mian"/);
  assert.throws(() => applyExtensions(figma, { variables: { Tokens: [{ n: 'x', t: 'FLOAT', v: { light: 1 } }] } }), /no value for mode\(s\) dark/);
  assert.throws(() => applyExtensions(figma, { modes: { Tokens: ['dark'] } }), /already exists/);
  assert.throws(() => resolveAll(figma), /forget applyExtensions/);
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

test('every alias resolves to a concrete value in every theme × palette combination', () => {
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

const isInkGray = hex => {
  if (hex === '#00000000') return true; // explicit "none"
  const m = /^#([0-9a-f]{2})\1\1$/.exec(hex);
  return !!m && parseInt(m[1], 16) % 17 === 0;
};

test('eink theme uses only opaque grays on the 16-level e-paper grid, for every palette', () => {
  const r = resolveAll(source);
  const colourNames = source.collections.find(c => c.name === 'Tokens').variables.filter(v => v.t === 'COLOR').map(v => v.n);
  for (const palette of PALETTES) {
    for (const n of colourNames) {
      const value = r.eink[palette][n];
      assert.ok(isInkGray(value), `eink/${palette} ${n} = ${value} is not a 16-level gray`);
      assert.equal(value, r.eink.peach[n], `eink ${n} must not depend on the palette`);
    }
  }
  assert.equal(r.eink.peach['fonts/main'], '#000000');
  assert.equal(r.eink.peach['borders/shadow-or-border/is-border'], true);
  assert.equal(r.eink.peach['motion/duration-fast'], 0);
});

test('graphite palette is neutral gray in light and dark', () => {
  const r = resolveAll(source);
  assert.equal(r.light.graphite.primary, '#eeeeee');
  assert.equal(r.dark.graphite['fonts/main'], '#cccccc');
  const isGray = v => v.slice(1, 3) === v.slice(3, 5) && v.slice(3, 5) === v.slice(5, 7);
  const paletteDriven = ['primary', 'accent', 'vibrant', 'translucent', 'surfaces/main/first-layer',
    'surfaces/main/second-layer', 'surfaces/main/accent', 'borders/colors/active', 'components/button/primary-surface',
    'components/button/secondary-surface', 'components/switch/track-on', 'components/progress/fill'];
  for (const theme of ['light', 'dark']) {
    for (const n of paletteDriven) assert.ok(isGray(r[theme].graphite[n]), `${theme}/graphite ${n} = ${r[theme].graphite[n]}`);
  }
});

test('component tokens meet edge-device minimums', () => {
  const r = resolveAll(source);
  for (const theme of THEMES) {
    const t = r[theme].peach;
    assert.ok(t['components/button/height-md'] >= 48 && t['components/button/min-touch-target'] >= 48);
    assert.ok(t['components/input/height'] >= 48);
    assert.ok(t['components/button/focus-ring-width'] >= 2);
  }
});

test('CSS emits eink theme, auto e-paper media query, font roles and ms units', () => {
  const css = buildCss(source);
  assert.match(css, /\[data-theme="eink"\][^{]*{[^}]*--paper-fonts-main: var\(--paper-color-ink-15\);/);
  assert.match(css, /@media \(update: slow\), \(monochrome\) {\s*:root:not\(\[data-theme\]\)/);
  assert.match(css, /\[data-palette="graphite"\]\s*{[^}]*--paper-primary: var\(--paper-color-graphite-200\);/);
  assert.match(css, /--paper-motion-duration-fast: 120ms;/);
  assert.match(css, /\.paper-text-sans-serif-body {\s*font-family: var\(--paper-font-sans\);/);
  assert.match(css, /--paper-font-mono: "IBM Plex Mono"/);
  assert.match(css, /\[data-typeface="device"\] {\s*--paper-font-sans: "Inter"/);
});

test('JS output includes every theme and palette', () => {
  const data = JSON.parse(buildJs(source).json);
  assert.deepEqual(Object.keys(data.tokens), THEMES);
  assert.deepEqual(Object.keys(data.tokens.eink), PALETTES);
  assert.equal(data.primitives['color/graphite/200'], '#eeeeee');
  assert.equal(data.typography['Sans serif/Body'].fontRole, 'sans');
});

const luminance = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

test('key text pairs meet WCAG AA (4.5:1) in every theme and palette', () => {
  const r = resolveAll(source);
  const pairs = [
    ['fonts/main', 'surfaces/main/first-layer'],
    ['components/button/primary-text', 'components/button/primary-surface'],
    ['components/button/secondary-text', 'components/button/secondary-surface'],
    ['components/input/text', 'components/input/surface'],
    ['signal/accent-text', 'surfaces/main/first-layer'],
    ['signal/on-accent', 'signal/accent'],
    ['components/segmented/selected-text', 'components/segmented/selected-surface'],
  ];
  for (const theme of THEMES) {
    for (const palette of PALETTES) {
      const t = r[theme][palette];
      for (const [fg, bg] of pairs) {
        const ratio = contrast(t[fg], t[bg]);
        assert.ok(ratio >= 4.5, `${theme}/${palette}: ${fg} ${t[fg]} on ${bg} ${t[bg]} = ${ratio.toFixed(2)}`);
      }
    }
  }
});

test('paper palette and extension text styles', () => {
  const r = resolveAll(source);
  assert.equal(r.light.paper['surfaces/main/first-layer'], '#f7f3eb');
  assert.equal(r.light.paper['signal/accent'], '#f0652b');
  assert.equal(r.eink.paper['signal/accent'], '#000000');
  const overline = source.styles.text.find(t => t.n === 'Mono/Overline');
  assert.equal(overline.textTransform, 'uppercase');
  assert.match(buildCss(source), /\.paper-text-mono-overline {[^}]*letter-spacing: 0\.14em;[^}]*text-transform: uppercase;/);
  assert.throws(() => applyExtensions(figma, { styles: { text: [{ n: 'Sans serif/Body' }] } }), /already exists/);
});

test('gradient and shadow styles convert to CSS', () => {
  const light = source.styles.paint.find(p => p.n === 'gradient/light').paints[0];
  assert.equal(gradientCss(light), 'conic-gradient(from 90deg, #f7d9d9 6.5%, #efe1e8 36%, #e1e5ef 58.5%, #f7e1d7 87.5%)');
  assert.equal(shadowCss(source.styles.effect[0].effects), '0 1px 4px 0 #00000033');
});
