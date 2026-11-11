// Pure transforms from the raw Figma variables export (figma/variables.json)
// to CSS / JS token outputs. No I/O here so everything is unit-testable.

export const PREFIX = 'paper';
export const THEMES = ['light', 'dark', 'eink'];
export const PALETTES = ['peach', 'pink', 'grayblue', 'lavanda', 'graphite'];

// Which axis selects the mode for each Figma collection.
const MODE_AXIS = { Primitives: 'fixed', Tokens: 'theme', Colors: 'palette' };

// Figma font family -> font role. Text styles are emitted against role custom
// properties (--paper-font-<role>) so a whole device can swap typefaces in one place.
export const FONT_ROLES = {
  'SF Pro': 'sans',
  'New York': 'serif',
  'New York Medium': 'serif',
  'New York Extra Large': 'serif',
  Hacky: 'display',
  'IBM Plex Mono': 'mono',
};

// Token-name prefix -> CSS unit for FLOAT variables (default px).
const FLOAT_UNITS = [['motion/', 'ms']];

/**
 * Layer tokens/extensions.json onto a raw Figma export. Returns a new source;
 * the input is not mutated. Extensions can add modes to a collection, add new
 * variables, and set values for existing variables in the added modes. Any
 * existing variable without a value for an added mode falls back to the
 * collection's default mode (so the fallback keeps the Figma alias chain).
 */
export function applyExtensions(source, ext) {
  if (!ext) return source;
  const out = structuredClone(source);
  const col = name => {
    const c = out.collections.find(c => c.name === name);
    if (!c) throw new Error(`Extension targets unknown collection "${name}"`);
    return c;
  };
  for (const [name, modes] of Object.entries(ext.modes ?? {})) {
    const c = col(name);
    for (const mode of modes) {
      if (c.modes.includes(mode)) throw new Error(`Mode "${mode}" already exists in ${name}`);
      const values = ext.modeValues?.[name]?.[mode] ?? {};
      const known = new Set(c.variables.map(v => v.n));
      for (const n of Object.keys(values)) {
        if (!known.has(n)) throw new Error(`modeValues.${name}.${mode} sets unknown variable "${n}"`);
      }
      for (const v of c.variables) v.v[mode] = v.n in values ? values[v.n] : structuredClone(v.v[c.defaultMode]);
      c.modes.push(mode);
    }
  }
  for (const [name, vars] of Object.entries(ext.variables ?? {})) {
    const c = col(name);
    const known = new Set(c.variables.map(v => v.n));
    for (const v of vars) {
      if (known.has(v.n)) throw new Error(`Extension variable "${v.n}" already exists in ${name}`);
      const missing = c.modes.filter(m => !(m in v.v));
      if (missing.length) throw new Error(`Extension variable "${v.n}" has no value for mode(s) ${missing.join(', ')}`);
      c.variables.push(structuredClone(v));
    }
  }
  if (ext.fonts) out.fonts = structuredClone(ext.fonts);
  return out;
}

export function slug(name) {
  return name
    .toLowerCase()
    .replace(/½/g, 'half')
    .replace(/[()]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function cssName(figmaName) {
  return `--${PREFIX}-${slug(figmaName)}`;
}

function index(source) {
  const byName = new Map();
  const expected = { theme: THEMES, palette: PALETTES };
  for (const col of source.collections) {
    if (!(col.name in MODE_AXIS)) throw new Error(`Unknown collection "${col.name}" — add it to MODE_AXIS`);
    const want = expected[MODE_AXIS[col.name]];
    if (want && want.join() !== col.modes.join()) {
      throw new Error(`${col.name} modes [${col.modes}] do not match [${want}] — did you forget applyExtensions()?`);
    }
    for (const v of col.variables) byName.set(v.n, { col, v });
  }
  return byName;
}

function modeFor(col, theme, palette) {
  const axis = MODE_AXIS[col.name];
  if (axis === 'theme') return theme;
  if (axis === 'palette') return palette;
  return col.defaultMode;
}

function isAlias(value) {
  return value !== null && typeof value === 'object' && 'alias' in value;
}

export function resolveAll(source) {
  const byName = index(source);
  const resolve = (name, theme, palette, seen = []) => {
    if (seen.includes(name)) throw new Error(`Alias cycle: ${[...seen, name].join(' -> ')}`);
    const entry = byName.get(name);
    if (!entry) throw new Error(`Dangling alias: ${seen.at(-1)} -> ${name}`);
    const value = entry.v.v[modeFor(entry.col, theme, palette)];
    return isAlias(value) ? resolve(value.alias, theme, palette, [...seen, name]) : value;
  };
  const out = {};
  for (const theme of THEMES) {
    out[theme] = {};
    for (const palette of PALETTES) {
      out[theme][palette] = Object.fromEntries([...byName.keys()].map(n => [n, resolve(n, theme, palette)]));
    }
  }
  return out;
}

function cssValue(variable, value) {
  if (isAlias(value)) return `var(${cssName(value.alias)})`;
  if (variable.t === 'FLOAT') {
    const unit = FLOAT_UNITS.find(([prefix]) => variable.n.startsWith(prefix))?.[1] ?? 'px';
    return `${value}${unit}`;
  }
  return String(value);
}

function declarations(variables, mode, filter = () => true) {
  return variables
    .filter(v => v.t !== 'BOOLEAN' && filter(v))
    .map(v => `  ${cssName(v.n)}: ${cssValue(v, v.v[mode])};`)
    .join('\n');
}

export function gradientCss(paint) {
  const stops = paint.stops.map(([hex, pos]) => `${hex} ${+(pos * 100).toFixed(2)}%`).join(', ');
  if (paint.type === 'GRADIENT_ANGULAR') return `conic-gradient(from ${paint.startAngleDeg ?? 0}deg, ${stops})`;
  if (paint.type === 'GRADIENT_LINEAR') return `linear-gradient(${stops})`;
  return `radial-gradient(${stops})`;
}

export function shadowCss(effects) {
  return effects
    .filter(e => e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW')
    .map(e => `${e.type === 'INNER_SHADOW' ? 'inset ' : ''}${e.offset.x}${e.offset.x ? 'px' : ''} ${e.offset.y}px ${e.radius}px ${e.spread}${e.spread ? 'px' : ''} ${e.color}`)
    .join(', ');
}

export function fontRole(family) {
  const role = FONT_ROLES[family];
  if (!role) throw new Error(`No font role for Figma family "${family}" — add it to FONT_ROLES`);
  return role;
}

const quoteFamily = f => (/^(ui-|-apple-|system-ui|serif$|sans-serif$|monospace$|BlinkMacSystemFont$)/.test(f) ? f : `"${f}"`);
export const stackCss = families => families.map(quoteFamily).join(', ');

/** Concrete CSS font-family stack for a Figma family under the default typeface set. */
export function fontStack(family, fonts) {
  return stackCss(fonts.stacks.default[fontRole(family)]);
}

const fontDecls = stacks => Object.entries(stacks).map(([role, fams]) => `  --${PREFIX}-font-${role}: ${stackCss(fams)};`).join('\n');

export function buildCss(source) {
  const col = name => source.collections.find(c => c.name === name);
  const prim = col('Primitives');
  const tokens = col('Tokens');
  const colors = col('Colors');
  const differsFrom = (mode, base = 'light') => v => JSON.stringify(v.v[base]) !== JSON.stringify(v.v[mode]);
  if (!source.fonts) throw new Error('source.fonts missing — build from applyExtensions(figma, extensions)');
  const { stacks } = source.fonts;

  // Custom properties holding var() are substituted where they are declared,
  // so EVERY element that sets data-theme or data-palette must re-declare the
  // full semantic set (light values), then dark contexts override the values
  // that differ. The descendant selector (higher specificity) makes a
  // palette-only subtree inside a dark page stay dark.
  const lightSel = ':root,\n[data-theme],\n[data-palette]';
  const themeSel = t => `[data-theme="${t}"],\n[data-theme="${t}"] [data-palette]:not([data-theme])`;
  const otherThemes = THEMES.filter(t => t !== 'light');

  const blocks = [
    `/* Generated by scripts/build.mjs from figma/variables.json — do not edit. */`,
    `/* Primitives */\n:root {\n${declarations(prim.variables, prim.defaultMode)}\n}`,
    ...PALETTES.map((p, i) => {
      const sel = i === 0 ? `:root,\n[data-palette="${p}"]` : `[data-palette="${p}"]`;
      return `/* Palette: ${p} */\n${sel} {\n${declarations(colors.variables, p)}\n}`;
    }),
    `/* Semantic tokens: light (default) */\n${lightSel} {\n${declarations(tokens.variables, 'light')}\n}`,
    ...otherThemes.map(t =>
      `/* Semantic tokens: ${t} (only values that differ from light) */\n${themeSel(t)} {\n${declarations(tokens.variables, t, differsFrom(t))}\n}`),
    `/* E-paper screens (slow refresh or monochrome) get the eink theme automatically\n   unless the page picks a theme explicitly. */\n@media (update: slow), (monochrome) {\n  :root:not([data-theme]),\n  :root:not([data-theme]) [data-palette]:not([data-theme]) {\n${declarations(tokens.variables, 'eink', differsFrom('eink')).replace(/^/gm, '  ')}\n  }\n}`,
    `/* Typefaces: text styles reference these roles. data-typeface swaps the whole set. */\n:root {\n${fontDecls(stacks.default)}\n}\n${Object.entries(stacks).filter(([k]) => k !== 'default').map(([k, st]) =>
      `[data-typeface="${k}"] {\n${fontDecls(st)}\n}`).join('\n')}`,
    `/* Effects & gradients */\n:root {\n${[
      ...source.styles.effect.map(e => `  --${PREFIX}-shadow-${slug(e.n)}: ${shadowCss(e.effects)};`),
      ...source.styles.paint.map(p => `  --${PREFIX}-${slug(p.n)}: ${gradientCss(p.paints[0])};`),
    ].join('\n')}\n}`,
    `/* Typography */\n${source.styles.text.map(t =>
      `.${PREFIX}-text-${slug(t.n)} {\n  font-family: var(--${PREFIX}-font-${fontRole(t.family)});\n  font-size: ${t.size}px;\n  font-weight: ${t.weight};\n  line-height: normal;\n}`).join('\n')}`,
  ];
  return blocks.join('\n\n') + '\n';
}

export function buildJs(source) {
  const resolved = resolveAll(source);
  const primitives = Object.fromEntries(
    source.collections.find(c => c.name === 'Primitives').variables.map(v => [v.n, resolved.light.peach[v.n]]));
  const typography = Object.fromEntries(source.styles.text.map(t => [t.n, {
    fontRole: fontRole(t.family), fontFamily: fontStack(t.family, source.fonts), fontSize: t.size, fontWeight: t.weight,
  }]));
  const fonts = Object.fromEntries(Object.entries(source.fonts.stacks).map(([k, st]) =>
    [k, Object.fromEntries(Object.entries(st).map(([role, fams]) => [role, stackCss(fams)]))]));
  const shadows = Object.fromEntries(source.styles.effect.map(e => [e.n, shadowCss(e.effects)]));
  const gradients = Object.fromEntries(source.styles.paint.map(p => [p.n, gradientCss(p.paints[0])]));
  const data = { themes: THEMES, palettes: PALETTES, primitives, tokens: resolved, typography, fonts, shadows, gradients };

  const js = `// Generated by scripts/build.mjs from figma/variables.json — do not edit.
export const themes = ${JSON.stringify(THEMES)};
export const palettes = ${JSON.stringify(PALETTES)};
export const primitives = ${JSON.stringify(primitives, null, 2)};
export const tokens = ${JSON.stringify(resolved, null, 2)};
export const typography = ${JSON.stringify(typography, null, 2)};
export const fonts = ${JSON.stringify(fonts, null, 2)};
export const shadows = ${JSON.stringify(shadows, null, 2)};
export const gradients = ${JSON.stringify(gradients, null, 2)};

/** Resolved semantic + palette + primitive values for one theme/palette pair. */
export function resolveTokens(theme = 'light', palette = 'peach') {
  const set = tokens[theme]?.[palette];
  if (!set) throw new Error(\`Unknown theme/palette: \${theme}/\${palette}\`);
  return set;
}
`;
  const tokenNames = Object.keys(resolved.light.peach).map(n => JSON.stringify(n)).join(' | ');
  const dts = `// Generated by scripts/build.mjs — do not edit.
export type Theme = ${THEMES.map(t => `'${t}'`).join(' | ')};
export type Palette = ${PALETTES.map(p => `'${p}'`).join(' | ')};
export type TokenName = ${tokenNames};
export type TokenSet = Record<TokenName, string | number | boolean>;
export declare const themes: Theme[];
export declare const palettes: Palette[];
export declare const primitives: Record<string, string>;
export declare const tokens: Record<Theme, Record<Palette, TokenSet>>;
export type FontRole = 'sans' | 'serif' | 'display' | 'mono';
export declare const typography: Record<string, { fontRole: FontRole; fontFamily: string; fontSize: number; fontWeight: number }>;
export declare const fonts: Record<string, Record<FontRole, string>>;
export declare const shadows: Record<string, string>;
export declare const gradients: Record<string, string>;
export declare function resolveTokens(theme?: Theme, palette?: Palette): TokenSet;
`;
  return { js, dts, json: JSON.stringify(data, null, 2) + '\n' };
}
