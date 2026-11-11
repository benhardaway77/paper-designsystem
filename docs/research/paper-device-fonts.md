# Typefaces on paper devices

Research done in November 2026 for the `eink` theme and the `device` typeface set.

**Confidence key:** **C** means an official or primary source confirms it. **S** means a secondary or press source. **R** means community-reported (forums, Reddit). **?** means not confirmed.

Some sources (remarkable.com, mobileread.com, MDN, trmnl.com, devforum.play.date) could not be fetched directly from the research environment. Those claims rest on search-result snippets and are marked as such.

## Summary

- **The current fonts are fine for Apple screens but not for edge devices.** SF Pro and New York are licensed only for apps on Apple platforms, so a Linux, Android or microcontroller device can't ship them. Hacky is a commercial font. On a device, the existing stacks therefore fall back to whatever system fonts happen to be installed.
- **Every major e-reader uses a proprietary custom face.** Amazon (Bookerly and Ember), Kobo (Rakuten Serif and Sans, Kobo Nickel) and reMarkable (reMarkable Sans and Serif) all do. None of these can be bundled.
- **The open-source pattern is a neutral grotesque for the UI, a sturdy screen serif for reading, and Noto or Plex for coverage.** This repo now ships that as `data-typeface="device"`: **Inter**, **Literata** and **IBM Plex Mono**, all under the SIL Open Font License (OFL).

## What devices use

| Font | Device(s) | Role | Foundry | License | Bundle? | Conf. |
|---|---|---|---|---|---|---|
| reMarkable Sans / Serif | reMarkable (brand, headings since release 3.9) | UI / brand | Letters from Sweden, 2022 | Proprietary | No | R ([maxibestof](https://maxibestof.one/typefaces/remarkable-sans), [release 3.9](https://remarkable.com/blog/release-3-9-handedness-and-headlines)) |
| EB Garamond, Noto Sans, Noto Serif, Noto Mono | reMarkable 2 / Paper Pro text and EPUB | Reading / typing | Duffner; Google | OFL | Yes | R ([font list](https://gist.github.com/chenhunghan/b9dbb6ad4095fa12c31838784c26073d)) |
| Amazon Ember (+ Ember Bold) | Kindle Paperwhite / Scribe / Colorsoft | UI + reading | Dalton Maag, 2015 | Proprietary, exclusive to Amazon | No | S ([Fonts In Use](https://www.fontsinuse.com/typefaces/167735/amazon-ember), [TeleRead](https://teleread.com/amazon-introduces-new-sans-serif-font-ember-for-kindle-oasis/index.html)) |
| Bookerly | Kindle (default since 2015) | Reading | Dalton Maag | Proprietary | No | S ([Wikipedia](https://en.wikipedia.org/wiki/Bookerly), [Design Week](https://www.designweek.co.uk/issues/20-26-june-2016/amazon-updates-kindle-design-introduces-new-typefaces/)) |
| Avenir Next + Georgia | Kobo (older firmware UI) | UI | Linotype; Microsoft | Proprietary | No | R ([MobileRead](https://www.mobileread.com/forums/showthread.php?p=3940790)) |
| Rakuten Serif / Sans | Kobo, firmware 4.34+ (default on Clara and Libra Colour) | Reading | ? | Proprietary | No | S/R ([the-ebook-reader](https://blog.the-ebook-reader.com/2022/09/20/new-kobo-software-update-4-34-released/)). Users report it is "too thin for e-ink" |
| Bitter, Atkinson Hyperlegible | Newer Kobo (built in) | Reading | Huerta Tipográfica; Braille Institute | OFL | Yes | R ([ebook-fonts](https://github.com/nicoverbruggen/ebook-fonts)) |
| Noto | Onyx Boox (Android) | UI + reader | Google | OFL | Yes | R ([MobileRead](https://www.mobileread.com/forums/showthread.php?p=3587460)) |
| PT Serif, DejaVu Sans | PocketBook | Reading / UI | ParaType; DejaVu | OFL / free | Yes | S ([the-ebook-reader](https://blog.the-ebook-reader.com/2026/07/09/pocketbooks-included-font-types-suck-heres-one-that-looks-better/)) |
| Inter (high-density screens), TRMNL pixel fonts | TRMNL | UI | Rasmus Andersson; various | OFL (check BlockKie separately) | Yes | C ([TRMNL docs](https://trmnl.com/framework/docs/3.4/font_family)) |
| Raster Gothic, Bitham, Roboto Condensed | Pebble / Core Devices | UI | various | Mixed. Gothic and Bitham licenses are unclear; Roboto is Apache | Roboto only | C list ([Rebble](https://developer.rebble.io/guides/app-resources/system-fonts/)) |
| Roobert (system), Asheville (SDK) | Playdate (reflective LCD, *not* e-ink) | UI | Displaay; Panic | Roobert is commercial; SDK fonts are reportedly CC BY 4.0 | Asheville only, with attribution | R ([devforum](https://devforum.play.date/t/usage-of-fonts-in-the-sdk/1548)) |
| ? | Supernote, Daylight DC-1 | — | — | — | — | ? (nothing documented) |

**Not confirmed:**

- The UI face on the reMarkable Paper Pro.
- The current per-model font list on Kindle.
- The Kobo UI face on 2024+ firmware.
- The built-in fonts on Supernote and Daylight.

## Open fonts designed for screens and e-ink

| Font | Why | License | Conf. |
|---|---|---|---|
| **Literata** | Designed by TypeTogether for Google Play Books, where it has been the default since 2015. The open counterpart to Bookerly, with variable optical sizes | OFL 1.1 | C ([GitHub](https://github.com/googlefonts/literata)) |
| Charter / Charis SIL | Matthew Carter designed Charter for low-resolution output. Charis SIL adds wide script coverage | Permissive / OFL | S ([Butterick](https://practicaltypography.com/charter.html)) |
| Atkinson Hyperlegible Next | Built for legibility, with sturdy letter shapes. Reportedly shipped on Kobo | OFL 1.1 | C ([GitHub](https://github.com/googlefonts/atkinson-hyperlegible-next)) |
| Bitter | Slab serif designed for screens | OFL | R |
| **Inter** | Neutral grotesque that TRMNL uses on high-density e-paper. Close in feel to Ember and Avenir | OFL 1.1 | C |

## What this repo does with it

| Role | `default` (Papper / Apple) | `device` (bundleable, OFL) |
|---|---|---|
| sans (UI, CTAs) | SF Pro → system-ui | **Inter** → Atkinson Hyperlegible Next → Noto Sans |
| serif (reading) | New York → ui-serif | **Literata** → Charis SIL → Noto Serif |
| display (headers) | Hacky → ui-serif | **Literata** → Charis SIL |
| mono | IBM Plex Mono | **IBM Plex Mono** → Noto Sans Mono |

Turn it on with `<html data-typeface="device">`, or on any subtree. The fonts are not bundled in this repo. Ship the font files and their OFL text with your firmware. Get them from Google Fonts or the GitHub releases.

**Do not bundle** Bookerly, Amazon Ember, Rakuten Serif or Sans, Kobo Nickel, reMarkable Sans or Serif, Avenir Next, Georgia, Gotham/Bitham, Roobert, SF Pro (outside Apple platforms) or Hacky (without a license).

## E-ink design rules behind the `eink` theme

- **16 gray levels.** E Ink Carta panels drive 16 levels (4-bit). A 1-bit black-and-white update takes about 120 ms, against about 450 ms for grayscale ([E Ink Carta](https://www.eink.com/brand/detail/Carta1000), [MobileRead wiki](https://wiki.mobileread.com/wiki/E_Ink_display)). The `color/ink/0…15` primitives are exactly those levels (`#ffffff`, `#eeeeee` … `#000000`), so nothing gets dithered. The theme mostly uses levels 0, 1, 2, 6, 9, 11 and 15.
- **No translucency, gradients or shadows.** They dither and ghost. A test enforces that every `eink` colour is opaque and on the grid.
- **No motion.** The `motion/*` tokens are `0ms` in `eink`. Show state changes instantly, for example by inverting a pressed button.
- **Never rely on colour alone.** Status messages carry a glyph (✓ ! ✕ i), and errors get a heavier border plus a "!" hint.
- **Avoid thin weights.** Kindle added Ember Bold for this reason. The components raise body text to 500 in `eink`.
- **CSS media features.** `@media (update: slow)` (Chrome/Edge 113, Firefox 102, Safari 17) and `@media (monochrome)` apply `eink` automatically when no theme is set. Many Android e-ink browsers report neither, so set `data-theme="eink"` explicitly in firmware.
