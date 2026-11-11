# Reference: paper-toned planner UI (Dribbble)

Source: [Dribbble upload](https://cdn.dribbble.com/userupload/48759820/file/e07ddafadfa26c3d3c3d8544153bcb86.png?resize=2048x1536&vertical=center), shared as inspiration in November 2026. The image belongs to its author and is not copied into this repo. Only the pattern ideas and a few sampled colour values are used.

## What it shows

Three phone screens of a task planner: **Today** (tasks grouped by morning, afternoon and evening), **Upcoming** (a date strip over task lists) and **Projects** (rows with progress bars). The look is warm paper and almost monochrome, which suits the paper-device direction.

## Sampled values

Colours were read off the image pixels, so they are approximate:

| Role | Sampled | Token in this repo |
|---|---|---|
| Paper surface | `#f7f3eb` | `color/paper/200` → `data-palette="paper"` primary |
| Ink text | `#11100a` | `fonts/accent` (neutral 1000) |
| Hairline divider | `#ddd8cb` (≈ 12% black on paper) | `borders/colors/hairline` |
| Signal accent (now, active tab, add button) | `#f0652b` | `signal/accent` (`color/ember/500`) |
| Done / progress | `#7c8a6e` | `signal/positive` (`color/sage/500`) |
| Muted / inactive | `#babaaf` | `fonts/muted` |

## Patterns adopted

| Pattern | Class | Notes |
|---|---|---|
| Mono uppercase overline ("WED 12 — WEEK 24", "MORNING", "6 TASKS · 2 DONE") | `.paper-overline`, text style `Mono/Overline` | 12px, 0.14em tracking |
| Large title + meta + hairline | `.paper-page-header` | Text style `Sans serif/Display`: 44px, semibold, −0.02em |
| Section group | `.paper-section` | |
| Task row: round check, title, mono time | `.paper-task`, `--done`, `--current`, `--muted` | The check has a 48px hit area. Done = sage fill plus strikethrough. Current = accent bar plus accent time |
| "NOW" tag | `.paper-tag` | Text is **dark** on orange, where the reference uses white. White on `#f0652b` is 3.5:1, below the 4.5:1 that WCAG requires for small text |
| Mono tab bar with underline | `.paper-tabbar` | Uses `aria-current="page"` |
| Date strip with dot counts | `.paper-datestrip`, `.paper-date` | `aria-pressed` marks the selected day, `disabled` marks unavailable days |
| Title + counts + thin progress | `.paper-meter`, `--muted` | 4px bar in `signal/positive` |
| Floating add button | `.paper-fab` | 72px |

## Changes for edge devices and e-paper

- Every interactive target is at least 48px. The reference's checks are about 28px, so the hit area is enlarged invisibly.
- In `eink`, the orange and sage map to black, the selected date inverts, the add button loses its shadow, and the bars get thicker (4px underline, 6px current bar).
- Accent text uses `signal/accent-text`, a darker orange (`#a33d14`) that passes 4.5:1 on every palette. Tests check this.

## Typefaces

The reference pairs a neutral grotesque (Inter-like) for titles with a monospace face for labels and times. This matches the `device` typeface set: Inter plus IBM Plex Mono.
