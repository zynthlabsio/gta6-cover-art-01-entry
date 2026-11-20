// Neon Coast Cover Studio — a gta6-cover-art-01 entry (Node 22, standard library only): the app is this
// directory's app/ folder, plain static files a desktop browser loads offline (app/index.html and its ES
// modules, Anton + Pacifico fonts vendored under the SIL Open Font License, no library and no network
// request), and the program hands it in. It copies app/ and screenshots/ from beside this file to /output
// and writes /output/dossier.json, the summary the judge reads, with the vendored make.fun library.
// The app turns any photo and caption into multi-panel GTA-style cover art — five layouts, five colour
// grades, per-panel crop and position, grain, vignette and a halftone title block — exported as a PNG in
// 1080 x 1080, 1080 x 1350 or 1920 x 1080. Its two sample photos (app/samples/) were made for make.fun
// with an image model and are free to use. Build notes: the cover engine lives in app/src/cover.js, the
// editor wiring in app/src/main.js, the screenshot scenes in app/src/shots.js.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Neon Coast Cover Studio hands in four screenshots: the wide exported cover first (the judge shows
// it largest), then the editor with a photo loaded, then the portrait and square exported covers.
// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
