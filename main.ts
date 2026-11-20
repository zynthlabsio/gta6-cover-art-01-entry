// main.ts — Neon Coast Cover Studio: make.fun entry program.
//
// The competition harness runs this file with Node (`node main.ts`). Its
// whole job is to hand in the entry: copy the static app and the screenshot
// set into /output, then write the dossier the scorer expects, produced by
// the vendored make.fun library from exactly the bytes just copied — so the
// dossier can never drift from the app it describes.
//
// The caps below mirror the competition gate: the dossier text budget, at
// most four screenshots of at most 256 KiB each, and the app tree limits.

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const ENTRY_DIR = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = '/output';

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function handIn(): void {
  // Start from an empty output directory so a stale file from an earlier
  // run can never leak into the handed-in entry.
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const part of ['app', 'screenshots']) {
    cpSync(join(ENTRY_DIR, part), join(OUTPUT_DIR, part), { recursive: true });
  }

  const dossier = buildDossier(OUTPUT_DIR, DOSSIER_CAPS);
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
  console.log(`handed in: app/ + screenshots/ copied, dossier.json written (${dossier.byteLength} bytes)`);
}

handIn();
