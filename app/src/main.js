// main.js — Neon Coast Cover Studio: editor wiring.
//
// Boots the studio: loads the three sample scenes, binds every control in
// the deck to the cover state, repaints the preview canvas on any change,
// and renders the full-resolution PNG export on demand. Also honours the
// screenshot staging mode described in shots.js.
//
// The preview canvas is kept at the export format's aspect ratio and painted
// by the same paintCoverArt routine as the export, so what the user sees is
// the file they will download.

import {
  SCENE_LIST,
  GRADE_PRESETS,
  FORMAT_LIST,
  formatById,
  paintCoverArt,
} from './cover.js';
import { readShotRequest, markStaged } from './shots.js';

const state = {
  sceneId: 'neon-pier',
  title: 'NEON COAST',
  tagline: 'vice nights, fast lights',
  ribbon: 'STUDIO EXCLUSIVE',
  caption: 'One city. Every story.',
  presetId: 'sunset',
  formatId: 'wide',
  grade: 0.85,
  vignette: 0.55,
  grain: 0.5,
  titleScale: 1,
};

const images = {};
let fontsReady = false;

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('statusLine');

// ---------------------------------------------------------------------------
// Asset loading. The studio is fully offline: the only requests it ever
// makes are for its own bundled files.
// ---------------------------------------------------------------------------

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function loadAssets() {
  const jobs = SCENE_LIST.map(async (scene) => {
    images[scene.id] = await loadImage(scene.file);
  });
  await Promise.all(jobs);
  // Canvas lettering needs the bundled display faces actually loaded, not
  // merely declared, before the first paint.
  try {
    await Promise.all([
      document.fonts.load("80px 'Anton'"),
      document.fonts.load("40px 'Pacifico'"),
    ]);
    await document.fonts.ready;
  } catch (err) {
    // Fallback fonts still render a cover; lettering just looks plainer.
    console.warn('display fonts unavailable, using fallbacks', err);
  }
  fontsReady = true;
}

// ---------------------------------------------------------------------------
// Painting.
// ---------------------------------------------------------------------------

function sizePreviewCanvas() {
  const fmt = formatById(state.formatId);
  // Preview at half resolution: crisp on retina-ish displays, cheap to
  // repaint on every keystroke.
  canvas.width = Math.round(fmt.w / 2);
  canvas.height = Math.round(fmt.h / 2);
}

function repaint() {
  if (!fontsReady) return;
  paintCoverArt(ctx, canvas.width, canvas.height, state, images);
}

function setStatus(message) {
  statusLine.textContent = message;
}

// ---------------------------------------------------------------------------
// Control deck construction. Scene cards and preset swatches are built from
// the catalogues in cover.js so the HTML stays declarative and short.
// ---------------------------------------------------------------------------

function buildSceneCards() {
  const host = document.getElementById('sceneCards');
  SCENE_LIST.forEach((scene) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'scene-card';
    card.dataset.scene = scene.id;
    card.setAttribute('aria-pressed', String(scene.id === state.sceneId));

    const thumb = document.createElement('img');
    thumb.src = scene.file;
    thumb.alt = scene.label;
    thumb.loading = 'lazy';

    const name = document.createElement('span');
    name.className = 'scene-name';
    name.textContent = scene.label;

    const blurb = document.createElement('span');
    blurb.className = 'scene-blurb';
    blurb.textContent = scene.blurb;

    card.append(thumb, name, blurb);
    card.addEventListener('click', () => {
      state.sceneId = scene.id;
      host.querySelectorAll('.scene-card').forEach((el) => {
        el.setAttribute('aria-pressed', String(el.dataset.scene === scene.id));
      });
      repaint();
      setStatus(`Hero scene: ${scene.label}. The other two fill the side panels.`);
    });
    host.append(card);
  });
}

function buildPresetSwatches() {
  const host = document.getElementById('presetRow');
  GRADE_PRESETS.forEach((preset) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch';
    btn.dataset.preset = preset.id;
    btn.textContent = preset.label;
    btn.setAttribute('aria-pressed', String(preset.id === state.presetId));
    btn.style.setProperty('--sw-a', preset.headTo);
    btn.style.setProperty('--sw-b', preset.accent);
    btn.addEventListener('click', () => {
      state.presetId = preset.id;
      host.querySelectorAll('.swatch').forEach((el) => {
        el.setAttribute('aria-pressed', String(el.dataset.preset === preset.id));
      });
      repaint();
      setStatus(`Colour grade: ${preset.label}.`);
    });
    host.append(btn);
  });
}

function buildFormatSelect() {
  const select = document.getElementById('formatSelect');
  FORMAT_LIST.forEach((fmt) => {
    const opt = document.createElement('option');
    opt.value = fmt.id;
    opt.textContent = fmt.label;
    select.append(opt);
  });
  select.value = state.formatId;
  select.addEventListener('change', () => {
    state.formatId = select.value;
    sizePreviewCanvas();
    repaint();
    const fmt = formatById(state.formatId);
    setStatus(`Export size set to ${fmt.w}×${fmt.h}.`);
  });
}

function bindTextField(id, key, note) {
  const input = document.getElementById(id);
  input.value = state[key];
  input.addEventListener('input', () => {
    state[key] = input.value;
    repaint();
    if (note) setStatus(note);
  });
}

function bindSlider(id, key, formatNote) {
  const input = document.getElementById(id);
  const readout = document.querySelector(`[data-readout="${id}"]`);
  input.value = String(Math.round(state[key] * 100));
  const sync = () => {
    state[key] = Number(input.value) / 100;
    if (readout) readout.textContent = `${input.value}%`;
    repaint();
    if (formatNote) setStatus(formatNote(input.value));
  };
  input.addEventListener('input', sync);
}

// ---------------------------------------------------------------------------
// Export: paint once more onto a full-resolution offscreen canvas and hand
// the browser a PNG download.
// ---------------------------------------------------------------------------

function exportPng() {
  const fmt = formatById(state.formatId);
  const out = document.createElement('canvas');
  out.width = fmt.w;
  out.height = fmt.h;
  paintCoverArt(out.getContext('2d'), fmt.w, fmt.h, state, images);
  out.toBlob((blob) => {
    if (!blob) {
      setStatus('Export failed — the browser refused to encode the PNG.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `neon-coast-cover-${fmt.w}x${fmt.h}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    setStatus(`Exported a ${fmt.w}×${fmt.h} PNG. Check your downloads folder.`);
  }, 'image/png');
}

// ---------------------------------------------------------------------------
// Boot.
// ---------------------------------------------------------------------------

async function boot() {
  const shot = readShotRequest();
  if (shot) {
    Object.assign(state, shot.overrides);
    markStaged(shot.mode);
  }

  buildSceneCards();
  buildPresetSwatches();
  buildFormatSelect();
  bindTextField('titleField', 'title');
  bindTextField('taglineField', 'tagline');
  bindTextField('ribbonField', 'ribbon');
  bindTextField('captionField', 'caption');
  bindSlider('gradeSlider', 'grade', (v) => `Sunset grade at ${v}%.`);
  bindSlider('vignetteSlider', 'vignette');
  bindSlider('grainSlider', 'grain');
  bindSlider('titleSlider', 'titleScale', (v) => `Headline size ${v}%.`);
  document.getElementById('exportBtn').addEventListener('click', exportPng);

  // If staging asked for a different scene than the deck default, reflect it.
  document.querySelectorAll('.scene-card').forEach((el) => {
    el.setAttribute('aria-pressed', String(el.dataset.scene === state.sceneId));
  });
  document.getElementById('formatSelect').value = state.formatId;

  sizePreviewCanvas();
  try {
    await loadAssets();
  } catch (err) {
    setStatus(`Sample scenes failed to load: ${err.message}`);
    return;
  }
  repaint();
  if (shot && shot.mode === 'cover') {
    // In cover staging the canvas itself is the deliverable: flag readiness
    // on the document so the capture tool knows the paint is final.
    document.documentElement.dataset.ready = 'yes';
    setStatus('Staged cover ready.');
  } else {
    document.documentElement.dataset.ready = 'yes';
    setStatus('Studio ready. Pick a scene, tune the lettering, export your cover.');
  }
}

boot();
