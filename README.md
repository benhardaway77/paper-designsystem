# paper-designsystem

Design tokens for **Papper**, exported from the Figma page
[Colors: tokens system](https://www.figma.com/design/gVnF1G3vYFO74d7UeyaIp7/Papper--Design-library--Community-?node-id=1563-2374)
of *Papper (Design library) (Community)*.

![Tokens page in Figma](docs/tokens-page.png)

## What's in it

| Figma | Count | Output |
|---|---|---|
| **Primitives** collection: raw palette | 63 variables | `--paper-color-*` |
| **Colors** collection: accent palette, modes `peach` · `pink` · `grayblue` · `lavanda` | 4 variables | `--paper-primary`, `--paper-accent`, `--paper-vibrant`, `--paper-translucent` |
| **Tokens** collection: semantic + pair tokens, modes `light` · `dark` | 77 variables | `--paper-fonts-*`, `--paper-surfaces-*`, `--paper-borders-*`, `--paper-icon-*`, `--paper-components-*`, `--paper-pairs-tokens-*` |
| Text styles | 17 | `.paper-text-*` classes |
| Effect style `slight-shadow` | 1 | `--paper-shadow-slight-shadow` |
| Gradient styles `gradient/light`, `gradient/dark` | 2 | `--paper-gradient-light`, `--paper-gradient-dark` |

The system has **two independent axes**: theme (`light`/`dark`) and accent
palette. Semantic tokens alias the palette, which aliases primitives, so
`fonts/main` is neutral 700 in light mode and the palette's *vibrant* colour in
dark mode.

## Usage

### CSS

```html
<link rel="stylesheet" href="dist/tokens.css">
<html data-theme="dark" data-palette="pink">
```

```css
.card { background: var(--paper-surfaces-main-first-layer); color: var(--paper-fonts-main); }
```

- Defaults are `light` + `peach` when no attributes are set.
- The generated CSS keeps the Figma alias chain as `var()` references, so
  switching either attribute re-themes everything.
- `data-palette` alone on a subtree swaps the palette and keeps the page theme.
  `data-theme` on a subtree forces that theme.
- Set `color` (and other inherited properties) on the themed element itself,
  not only on `body`. Inherited colours are resolved where they are declared.
- One known limit: a palette-only element inside a `light` subtree that is
  itself inside a `dark` page resolves as dark. Put `data-theme` on that
  element as well.

### JavaScript / TypeScript

```js
import { resolveTokens, tokens, typography, gradients } from '@benhardaway77/paper-designsystem';

resolveTokens('dark', 'lavanda')['fonts/main']; // '#f5d6e6'
tokens.light.peach['components/card/main-card-radius']; // 35
```

`dist/tokens.json` contains the same data (all 8 theme × palette combinations,
fully resolved).

### Fonts

The styles use **SF Pro**, **New York**, **Hacky** and **IBM Plex Mono**. None
are bundled: SF Pro and New York ship with Apple platforms, Hacky must be
licensed separately, and IBM Plex Mono is on Google Fonts. Each stack falls back
to system fonts. Font weights are derived from the Figma style names (SF Pro
Semibold = 590).

## Layout

```
figma/variables.json          raw export (source of truth: modes + aliases)
scripts/lib.mjs               transforms (pure, unit-tested)
scripts/build.mjs             writes dist/
scripts/figma-export.plugin.js  re-export script (Figma Plugin API)
dist/                         generated, committed for direct use
docs/index.html               live demo with theme/palette switcher
test/                         node:test suite
```

## Updating from Figma

Figma's Variables REST API is Enterprise-only, so the export runs as Plugin API
code instead:

1. Run `scripts/figma-export.plugin.js` against file `gVnF1G3vYFO74d7UeyaIp7`,
   either through the Figma MCP `use_figma` tool or as a scratch plugin.
2. Save the returned JSON over `figma/variables.json`.
3. `npm run build && npm test`, then commit.

## Development

```bash
npm test          # unit tests (no dependencies)
npm run build     # regenerate dist/
python3 -m http.server 4177   # then open http://localhost:4177/docs/
```

## Related

[`benhardaway77/design-system`](https://github.com/benhardaway77/design-system)
syncs the 4 published *styles* from the same Figma file daily. This repo covers
the full *variables* system that the styles sync does not see.

## Credits

The token values, names and type choices come from the Figma Community file
*Papper (Design library)*. They remain subject to that file's Community license
and belong to its original author. This repo adds only the export and build
tooling.
