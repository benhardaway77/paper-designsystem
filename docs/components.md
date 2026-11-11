# Components & CTAs

`dist/components.css` holds hand-written components that take every value from `--paper-*` tokens. Load it after `dist/tokens.css`. Each component follows `data-theme` (`light`, `dark`, `eink`), `data-palette` (including `graphite`) and `data-typeface`.

## Baseline rules for edge devices

| Rule | How it is enforced |
|---|---|
| Touch target of at least 48px | `components/button/min-touch-target`, `button/height-md` and `input/height` are 48. A test enforces this |
| Works without a pointer (D-pad, rotary, keyboard) | Every control has a `:focus-visible` ring (`button/focus-ring`, 3px) |
| No hover-only affordances | Hover styles sit inside `@media (hover: hover)`. Pressed and `aria-pressed` give the feedback |
| Works on e-paper | The `eink` theme uses no tint, shadow, translucency or motion. State shows through borders, inversion, underline and dashed outlines |
| Meaning survives grayscale | Status uses glyphs. Errors use weight and glyphs, not colour alone |

## Buttons (CTAs)

```html
<button class="paper-btn">Confirm</button>
<button class="paper-btn paper-btn--secondary">Cancel</button>
<button class="paper-btn paper-btn--tertiary">Learn more</button>
<button class="paper-btn paper-btn--destructive">Delete</button>
<button class="paper-btn paper-btn--icon paper-btn--secondary" aria-label="Add">…svg…</button>
<div class="paper-btn-group"><button class="paper-btn paper-btn--secondary">Cancel</button><button class="paper-btn">Save</button></div>
```

| Variant | Use | light | dark | eink |
|---|---|---|---|---|
| primary | The one main action per screen | neutral 700 fill, white text | palette *vibrant* fill, neutral 900 text | black fill, white text |
| secondary | Alternatives, such as Cancel | palette *primary* fill, gentle border | neutral 700 fill, palette text | white fill, 2px black border |
| tertiary | Low emphasis, inline | text only | text only | underlined text |
| destructive | Irreversible actions | coral fill, black text | coral fill, black text | white fill, 3px black border |
| disabled | Unavailable | neutral 300 / 500 | neutral 800 / 500 | ink 1 fill, dashed border |

- **Sizes:** `--sm` (36px, still with a 48px hit area through min-height), the default (48px) and `--lg` (56px).
- **Modifiers:** `--block`, `--pill`, `--icon`.
- **Pressed state:** the `*-surface-pressed` tokens. In `eink`, secondary, tertiary and destructive buttons invert to black when pressed.

**Writing CTA labels.** Use a verb that names the result ("Restart", "Save changes", "Pair device"), not "OK" or "Yes". Put the primary action last in a group, which places it on the right or bottom. Keep labels under about 20 characters so they fit narrow edge screens without wrapping.

## Other components

| Class | Element | Tokens |
|---|---|---|
| `.paper-field`, `.paper-input`, `.paper-field--error` | label + input | `components/input/*` |
| `.paper-switch` | `<input type="checkbox" role="switch">` | `components/switch/*` |
| `.paper-checkbox` | `<input type="checkbox">` | `components/checkbox/*` (from Figma) |
| `.paper-segmented` | buttons with `aria-pressed` | `components/segmented/*` |
| `.paper-list`, `.paper-list__row` | `<ul>` of buttons or links | `components/list/*` |
| `.paper-badge` | counter | `components/badge/*` |
| `.paper-status--positive / warning / critical / info` | inline banner | `components/status/*` |
| `.paper-progress` | `<progress>` | `components/progress/*` |
| `.paper-card`, `.paper-card--task` | container | `surfaces/main/*`, `components/card/*` |
| `.paper-dialog` | `<dialog>` | `components/dialog/*` |

See them live at `docs/index.html`. The "Paper device preview" section shows `eink` with the `device` typefaces.

## Adding a component token

1. Add it in `tokens/extensions.json` under `variables.Tokens`, with `light`, `dark` and `eink` values. These can be aliases.
2. `npm run build && npm test`. The test suite rejects any `eink` colour that is translucent, tinted or off the 16-level grid.
