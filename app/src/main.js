// Neon Coast Cover Studio: wires the editor — photos, layout, grade, caption, effects,
// per-panel crop and position, undo/redo, and one-click PNG export in three post sizes.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, renderCoverAtSize, panelCount, layoutPanels } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const panelSelect = document.getElementById('panel-select');
const zoomInput = document.getElementById('zoom');
const panxInput = document.getElementById('panx');
const panyInput = document.getElementById('pany');

const SAMPLES = { boulevard: 'samples/boulevard.jpg', pier: 'samples/pier.jpg' };

/** The whole editable cover: layout, grade, caption, effects and one slot per panel. */
export const state = {
  layout: 'hero-three',
  grade: 'neon-sunset',
  title: 'SUNSET HEIST',
  subtitle: 'Vice City nights',
  badge: 'EST. 2026',
  grain: true,
  vignette: true,
  halftone: true,
  frame: true,
  photos: [],
  panels: Array.from({ length: 9 }, () => ({ photoIndex: -1, zoom: 1.2, ox: 0, oy: 0 })),
  selected: 0,
};

let history = [];
let historyIndex = -1;
let fontsReady = false;

function snapshot() {
  return JSON.stringify({
    layout: state.layout, grade: state.grade, title: state.title,
    subtitle: state.subtitle, badge: state.badge, grain: state.grain,
    vignette: state.vignette, halftone: state.halftone, frame: state.frame,
    panels: state.panels, selected: state.selected,
    photoSrcs: state.photos.map((p) => p.dataset.src || ''),
  });
}

function pushHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(snapshot());
  if (history.length > 40) history.shift();
  historyIndex = history.length - 1;
}

function restoreHistory(json) {
  const s = JSON.parse(json);
  state.layout = s.layout; state.grade = s.grade; state.title = s.title;
  state.subtitle = s.subtitle; state.badge = s.badge; state.grain = s.grain;
  state.vignette = s.vignette; state.halftone = s.halftone; state.frame = s.frame;
  state.panels = s.panels; state.selected = s.selected;
  syncControls();
  redraw();
}

function undo() {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  restoreHistory(history[historyIndex]);
}
function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex += 1;
  restoreHistory(history[historyIndex]);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function ensureFonts() {
  if (fontsReady) return;
  try {
    await Promise.all([
      document.fonts.load('80px Anton'),
      document.fonts.load('40px Pacifico'),
    ]);
  } catch { /* fall back to system fonts; the cover still draws */ }
  fontsReady = true;
}

function redraw() {
  drawCover(canvas, state);
}

function syncControls() {
  document.querySelectorAll('#layouts .choice').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layout));
  document.querySelectorAll('#grades .choice').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('badge').value = state.badge;
  document.getElementById('fx-grain').checked = state.grain;
  document.getElementById('fx-vignette').checked = state.vignette;
  document.getElementById('fx-halftone').checked = state.halftone;
  document.getElementById('fx-frame').checked = state.frame;
  rebuildPanelSelect();
  syncPanelControls();
}

function rebuildPanelSelect() {
  const n = panelCount(state.layout);
  panelSelect.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `Panel ${i + 1}${state.layout === 'hero-three' && i === 0 ? ' (hero)' : ''}`;
    panelSelect.appendChild(opt);
  }
  panelSelect.value = String(Math.min(state.selected, n - 1));
}

function syncPanelControls() {
  if (state.selected < 0) return;
  const p = state.panels[state.selected];
  zoomInput.value = String(p.zoom);
  panxInput.value = String(Math.round(p.ox * 100));
  panyInput.value = String(Math.round(p.oy * 100));
  document.getElementById('zoom-val').textContent = `${p.zoom.toFixed(2)}×`;
  document.getElementById('panx-val').textContent = String(Math.round(p.ox * 100));
  document.getElementById('pany-val').textContent = String(Math.round(p.oy * 100));
  panelSelect.value = String(state.selected);
}

function selectPanel(i, record = true) {
  const n = panelCount(state.layout);
  state.selected = Math.max(0, Math.min(n - 1, i));
  syncPanelControls();
  redraw();
  if (record) pushHistory();
}

/** Adds an image to the photo tray and puts it in the selected panel. */
export function addPhoto(img, srcLabel) {
  img.dataset.src = srcLabel || '';
  state.photos.push(img);
  const idx = state.photos.length - 1;
  state.panels[state.selected].photoIndex = idx;
  syncPanelControls();
  redraw();
  pushHistory();
  return idx;
}

/** Which panel (if any) sits under a point on the displayed canvas. */
export function panelAtPoint(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = ((clientX - r.left) / r.width) * canvas.width;
  const y = ((clientY - r.top) / r.height) * canvas.height;
  const panels = layoutPanels(state.layout, canvas.width, canvas.height);
  const n = panelCount(state.layout);
  for (let i = n - 1; i >= 0; i--) {
    const p = panels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}

let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  const i = panelAtPoint(e.clientX, e.clientY);
  if (i < 0) return;
  selectPanel(i, false);
  dragging = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const r = canvas.getBoundingClientRect();
  const p = state.panels[state.selected];
  const panels = layoutPanels(state.layout, canvas.width, canvas.height);
  const rect = panels[state.selected];
  p.ox = Math.max(-1, Math.min(1, p.ox - ((e.clientX - dragging.x) / r.width) * (canvas.width / rect.w) * 2));
  p.oy = Math.max(-1, Math.min(1, p.oy - ((e.clientY - dragging.y) / r.height) * (canvas.height / rect.h) * 2));
  dragging = { x: e.clientX, y: e.clientY };
  syncPanelControls();
  redraw();
});
canvas.addEventListener('pointerup', () => {
  if (dragging) { dragging = null; pushHistory(); }
});

document.getElementById('photos').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  for (const file of files) {
    const img = await loadImage(URL.createObjectURL(file));
    addPhoto(img, file.name);
  }
  statusEl.textContent = files.length ? `${files.length} photo${files.length > 1 ? 's' : ''} added to panel ${state.selected + 1}.` : '';
  e.target.value = '';
});

async function loadSample(name) {
  const img = await loadImage(SAMPLES[name]);
  addPhoto(img, SAMPLES[name]);
  statusEl.textContent = `Sample "${name}" loaded into panel ${state.selected + 1}.`;
}
document.getElementById('sample-boulevard').addEventListener('click', () => loadSample('boulevard'));
document.getElementById('sample-pier').addEventListener('click', () => loadSample('pier'));

document.getElementById('fill-all').addEventListener('click', () => {
  const src = state.panels[state.selected].photoIndex;
  if (src < 0) { statusEl.textContent = 'Load a photo into the selected panel first.'; return; }
  const n = panelCount(state.layout);
  for (let i = 0; i < n; i++) state.panels[i].photoIndex = src;
  redraw();
  pushHistory();
  statusEl.textContent = 'All panels filled with the selected photo.';
});
document.getElementById('clear-panel').addEventListener('click', () => {
  state.panels[state.selected].photoIndex = -1;
  redraw();
  pushHistory();
});

panelSelect.addEventListener('change', () => selectPanel(Number(panelSelect.value)));
zoomInput.addEventListener('input', () => {
  state.panels[state.selected].zoom = Number(zoomInput.value);
  syncPanelControls();
  redraw();
});
zoomInput.addEventListener('change', pushHistory);
panxInput.addEventListener('input', () => {
  state.panels[state.selected].ox = Number(panxInput.value) / 100;
  syncPanelControls();
  redraw();
});
panyInput.addEventListener('input', () => {
  state.panels[state.selected].oy = Number(panyInput.value) / 100;
  syncPanelControls();
  redraw();
});
panxInput.addEventListener('change', pushHistory);
panyInput.addEventListener('change', pushHistory);

document.querySelectorAll('#layouts .choice').forEach((b) => b.addEventListener('click', () => {
  state.layout = b.dataset.layout;
  state.selected = 0;
  syncControls();
  redraw();
  pushHistory();
}));
document.querySelectorAll('#grades .choice').forEach((b) => b.addEventListener('click', () => {
  state.grade = b.dataset.grade;
  syncControls();
  redraw();
  pushHistory();
}));

document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('title').addEventListener('change', pushHistory);
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('change', pushHistory);
document.getElementById('badge').addEventListener('input', (e) => { state.badge = e.target.value; redraw(); });
document.getElementById('badge').addEventListener('change', pushHistory);
document.getElementById('fx-grain').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); pushHistory(); });
document.getElementById('fx-vignette').addEventListener('change', (e) => { state.vignette = e.target.checked; redraw(); pushHistory(); });
document.getElementById('fx-halftone').addEventListener('change', (e) => { state.halftone = e.target.checked; redraw(); pushHistory(); });
document.getElementById('fx-frame').addEventListener('change', (e) => { state.frame = e.target.checked; redraw(); pushHistory(); });

document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);

/** Exports the cover at one post size as a PNG download. */
export function exportCover(w, h) {
  const out = renderCoverAtSize(state, w, h);
  out.toBlob((blob) => {
    if (!blob) { statusEl.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    statusEl.textContent = `Saved neon-coast-cover-${w}x${h}.png`;
  }, 'image/png');
}
document.getElementById('export-square').addEventListener('click', () => exportCover(1080, 1080));
document.getElementById('export-portrait').addEventListener('click', () => exportCover(1080, 1350));
document.getElementById('export-wide').addEventListener('click', () => exportCover(1920, 1080));

/** Boots the editor: fonts, two sample photos (boulevard in the hero, pier below), first draw. */
export async function boot() {
  await ensureFonts();
  const boulevard = await loadImage(SAMPLES.boulevard);
  const pier = await loadImage(SAMPLES.pier);
  boulevard.dataset.src = SAMPLES.boulevard;
  pier.dataset.src = SAMPLES.pier;
  state.photos = [boulevard, pier];
  state.panels[0].photoIndex = 0;
  state.panels[0].zoom = 1.05;
  state.panels[0].oy = -0.5;
  for (let i = 1; i < 9; i++) { state.panels[i].photoIndex = 1; state.panels[i].zoom = 1.1; state.panels[i].oy = -0.2; }
  syncControls();
  redraw();
  pushHistory();
}

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), { boot, state, redraw, ensureFonts, loadImage, SAMPLES, addPhoto, syncControls });
} else {
  boot();
}
