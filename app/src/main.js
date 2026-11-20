// Wires the page: pick a photo, type a caption, export the square cover as a PNG. A `?shot=` query sets up a fixed
// scene for a screenshot instead (./shots.js).
import { drawCover } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const caption = document.getElementById('caption');
const status = document.getElementById('status');
let photo = null;

function redraw() {
  drawCover(canvas, photo, caption.value);
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

document.getElementById('photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  photo = await loadImage(URL.createObjectURL(file));
  redraw();
});
caption.addEventListener('input', redraw);
document.getElementById('export').addEventListener('click', () => {
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cover-1080x1080.png';
    a.click();
    status.textContent = 'Saved cover-1080x1080.png';
  }, 'image/png');
});

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), async (sample, text) => {
    photo = await loadImage(sample);
    caption.value = text;
    redraw();
  });
} else {
  redraw();
}
