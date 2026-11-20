# gta6-cover-art-01-entry

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/zynthlabsio/gta6-cover-art-01-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/zynthlabsio/gta6-cover-art-01-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Neon Coast Cover Studio — an offline, multi-panel GTA 6-style cover art maker. Drop in your photos and turn them into Vice City neon-sunset posters, with PNG export in 1080x1080, 1080x1350, and 1920x1080.

> Built for the make.fun `gta6-cover-art-01` competition: a GTA 6 cover art generator that works entirely in the browser, no server needed.

## How it works

1. Upload your photos and pick a cover layout.
2. Arrange each photo into its panel and tune the neon-sunset grading.
3. Preview the full poster, then export a print-ready PNG at your chosen size.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in your browser.

To render a sample cover headlessly:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Features

- Multi-panel cover layouts in the classic GTA cover-art style
- Neon sunset, palm silhouette, and Vice City color grading — all rendered locally
- Bring your own photos: upload, crop, and place them into panels
- One-click PNG export at square (1080x1080), portrait (1080x1350), and widescreen (1920x1080) sizes
- Fully offline — no accounts, no uploads, no network calls

---

<sub>Entered on [make.fun](https://make.fun/?ref=7vbpbe2y&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
