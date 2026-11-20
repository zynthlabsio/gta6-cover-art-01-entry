// Fixed scenes for screenshots: ?shot=editor shows the page with a sample photo loaded;
// ?shot=cover shows the cover alone, drawn at the export size named by &size=WxH.
// Optional params: &photo=boulevard|pier, &caption=..., &subtitle=..., &layout=...,
// &grade=..., &size=1920x1080|1080x1350|1080x1080. window.__shotReady is set once painted.
import { panelCount } from './cover.js';

export function shotSettings(query) {
  const size = (query.get('size') || '1080x1080').split('x').map(Number);
  return {
    photo: query.get('photo') || 'boulevard',
    caption: query.get('caption') || 'Sunset Heist',
    subtitle: query.get('subtitle') || 'Vice City nights',
    layout: query.get('layout') || 'hero-three',
    grade: query.get('grade') || 'neon-sunset',
    width: Number.isFinite(size[0]) && size[0] > 0 ? size[0] : 1080,
    height: Number.isFinite(size[1]) && size[1] > 0 ? size[1] : 1080,
  };
}

export function markShotReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

/** Runs a ?shot= scene using the editor's own boot and state. */
export async function runShot(shot, query, app) {
  const s = shotSettings(query);
  const canvas = document.getElementById('cover');
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    canvas.width = s.width;
    canvas.height = s.height;
  }
  app.state.layout = s.layout;
  app.state.grade = s.grade;
  app.state.title = s.caption;
  app.state.subtitle = s.subtitle;
  await app.ensureFonts();
  const hero = await app.loadImage(app.SAMPLES[s.photo] || app.SAMPLES.boulevard);
  const otherName = s.photo === 'pier' ? 'boulevard' : 'pier';
  const other = await app.loadImage(app.SAMPLES[otherName]);
  hero.dataset.src = app.SAMPLES[s.photo];
  other.dataset.src = app.SAMPLES[otherName];
  app.state.photos = [hero, other];
  const n = panelCount(s.layout);
  for (let i = 0; i < 9; i++) {
    app.state.panels[i].photoIndex = i % 2 === 0 ? 0 : 1;
    // Faces sit in the top half of the sample photos: ease wide panels down so
    // the hero shows a face, and give the rest a slight upward bias too.
    app.state.panels[i].zoom = s.layout === 'hero-three' && i === 0 ? 1.0 : 1.05;
    app.state.panels[i].oy = s.layout === 'hero-three' && i === 0 ? -0.55 : -0.25;
  }
  app.state.panels[0].photoIndex = 0;
  // A cover shot hides the editor's selection outline; the editor shot keeps it.
  app.state.selected = shot === 'cover' ? -1 : 0;
  app.syncControls();
  app.redraw();
  markShotReady();
}
