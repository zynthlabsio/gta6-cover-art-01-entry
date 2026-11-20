# Neon Coast Cover Studio

A make.fun entry for **gta6-cover-art-01** ("Make GTA 6 Cover Art").

Neon Coast Cover Studio is a small, fully offline web app that turns three
bundled neon-coast scenes into a multi-panel, sunset-graded cover poster —
the kind of artwork you would wrap around a game case — and exports it as a
PNG, up to a full **1920×1080**.

All of the artwork is original. The three sample photographs are
AI-generated scenes created for this project; the studio uses no publisher
logos, no screenshots from any game and no third-party branding.

## What it does

- **Three scenes, one cover.** Pick a hero scene — Skyline Rooftop, Neon
  Pier or Palm Drive — and the other two automatically fill the angled side
  panels of the collage.
- **Lettering you control.** Edit the headline, the script tagline, the
  rotated ribbon badge and the caption band; scale the headline to taste.
- **Colour grades.** Three sunset/neon grade presets (Vice Sunset, Midnight
  Chrome, Gold Hour) plus sliders for grade strength, vignette and film
  grain.
- **Real exports.** One click renders the cover at full resolution —
  1920×1080 wide, 1080×1350 poster or 1080×1080 square — and downloads it
  as a PNG. The preview is painted by the same canvas routine as the
  export, so what you see is exactly what you get.
- **Private by construction.** The app is static files only. It makes no
  network requests beyond its own bundled assets, keeps everything on the
  device and needs no account.

## Running it

Serve the `app/` folder with any static file server and open `index.html`,
for example:

```
npx serve app
```

or use the bundled development server definition in `serve.ts`.

## Screenshots

The `screenshots/` folder is produced from the app itself through its
staging mode (`app/src/shots.js`): open the app with a `?shot=cover` or
`?shot=editor` query — the exact set is listed in `shots.json` — and the
page stages a deterministic cover or editor view ready to capture.

## Layout of this repository

- `app/` — the static web app (HTML, CSS, and ES modules under `app/src/`,
  fonts under `app/fonts/`, sample scenes under `app/samples/`)
- `main.ts` — the entry program the harness runs: it copies `app/` and
  `screenshots/` to `/output` and writes `dossier.json` using the vendored
  make.fun library in `vendor/`
- `shots.json` — the screenshot staging list
- `screenshots/` — the four staged captures

## Credits and licenses

Code in this repository is released under the MIT License (see `LICENSE`).
Display fonts are Anton and Pacifico, both licensed under the SIL Open Font
License 1.1; their license texts live alongside the font files in
`app/fonts/`.
