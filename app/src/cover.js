// cover.js — Neon Coast Cover Studio: canvas rendering engine.
//
// Everything in this module is pure drawing code. It receives a 2D context,
// a plain state object and a map of loaded images, and paints a complete
// multi-panel cover onto whatever canvas it is handed. It never touches the
// DOM beyond the canvas, so the editor preview and the PNG export share the
// exact same paint path.
//
// Layout idea (all proportions relative to the canvas, so one routine serves
// the landscape, portrait and square exports):
//   - a full-bleed hero panel carrying the chosen scene photograph,
//   - a rail of two smaller panels down the right side (landscape) or along
//     the bottom (portrait / square) showing the other two scenes,
//   - a neon-sunset colour grade washed over every panel,
//   - a heavy condensed headline, a script tagline, a rotated ribbon badge
//     in the top corner and a caption band along the bottom edge.

'use strict';

// ---------------------------------------------------------------------------
// Scene catalogue. The sample photographs ship with the app under samples/;
// they are original AI-generated artwork made for this studio.
// ---------------------------------------------------------------------------

export const SCENE_LIST = [
  {
    id: 'rooftop',
    label: 'Skyline Rooftop',
    file: 'samples/rooftop.jpg',
    blurb: 'Golden-hour towers and a lone figure on the ledge.',
  },
  {
    id: 'neon-pier',
    label: 'Neon Pier',
    file: 'samples/neon-pier.jpg',
    blurb: 'Rain-slick boards, arcade glow and a violet sky.',
  },
  {
    id: 'palm-drive',
    label: 'Palm Drive',
    file: 'samples/palm-drive.jpg',
    blurb: 'A slow cruise under palms at the blue hour.',
  },
];

// Sunset grade palettes. Each entry drives the wash gradient, the headline
// gradient and the accent colour used for stripes, ribbon and band rules.
export const GRADE_PRESETS = [
  {
    id: 'sunset',
    label: 'Vice Sunset',
    washTop: 'rgba(255, 94, 168, 0.34)',
    washMid: 'rgba(255, 138, 61, 0.20)',
    washBot: 'rgba(43, 16, 85, 0.42)',
    headFrom: '#fff6d8',
    headTo: '#ff5ea8',
    accent: '#ffb03a',
    script: '#ffe45e',
  },
  {
    id: 'midnight',
    label: 'Midnight Chrome',
    washTop: 'rgba(64, 224, 255, 0.26)',
    washMid: 'rgba(64, 92, 255, 0.18)',
    washBot: 'rgba(4, 10, 40, 0.5)',
    headFrom: '#eafcff',
    headTo: '#40b6ff',
    accent: '#40e0ff',
    script: '#9df2ff',
  },
  {
    id: 'gold',
    label: 'Gold Hour',
    washTop: 'rgba(255, 196, 64, 0.3)',
    washMid: 'rgba(255, 120, 40, 0.2)',
    washBot: 'rgba(60, 20, 4, 0.44)',
    headFrom: '#fffbe8',
    headTo: '#ffb03a',
    accent: '#ff7847',
    script: '#fff3b0',
  },
];

// Export formats the studio offers. The landscape size is the headline
// deliverable: a full 1920x1080 PNG.
export const FORMAT_LIST = [
  { id: 'wide', label: 'Wide 1920×1080', w: 1920, h: 1080 },
  { id: 'poster', label: 'Poster 1080×1350', w: 1080, h: 1350 },
  { id: 'square', label: 'Square 1080×1080', w: 1080, h: 1080 },
];

export function presetById(id) {
  return GRADE_PRESETS.find((p) => p.id === id) || GRADE_PRESETS[0];
}

export function formatById(id) {
  return FORMAT_LIST.find((f) => f.id === id) || FORMAT_LIST[0];
}

// ---------------------------------------------------------------------------
// Small geometry helpers.
// ---------------------------------------------------------------------------

// Draw an image so it completely covers the target rectangle, centre-cropped
// the way CSS `background-size: cover` behaves.
function paintCover(ctx, img, x, y, w, h) {
  if (!img || !img.naturalWidth) {
    ctx.fillStyle = '#1b1030';
    ctx.fillRect(x, y, w, h);
    return;
  }
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

// A parallelogram path: a rectangle whose right edge slants by `slant`
// pixels. Used for the side panels so the collage feels cut, not pasted.
function slantedPanelPath(ctx, x, y, w, h, slant) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - slant, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}

// Rounded rectangle path (ribbon badge, caption chip).
function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.arcTo(x + w, y, x + w, y + rad, rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  ctx.lineTo(x + rad, y + h);
  ctx.arcTo(x, y + h, x, y + h - rad, rad);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + rad, y, rad);
  ctx.closePath();
}

// ---------------------------------------------------------------------------
// Layer painters, called in stacking order by paintCoverArt.
// ---------------------------------------------------------------------------

function paintPanels(ctx, W, H, state, images) {
  const hero = images[state.sceneId];
  const others = SCENE_LIST.filter((s) => s.id !== state.sceneId);

  if (W >= H) {
    // Landscape: hero takes the left two thirds, rail on the right.
    const railX = Math.round(W * 0.665);
    const gap = Math.round(H * 0.018);
    const halfH = Math.round((H - gap * 3) / 2);
    paintCover(ctx, hero, 0, 0, railX + Math.round(W * 0.03), H);
    others.forEach((scene, i) => {
      const y = gap + i * (halfH + gap);
      ctx.save();
      slantedPanelPath(ctx, railX, y, W - railX - gap, halfH, Math.round(H * 0.045));
      ctx.clip();
      paintCover(ctx, images[scene.id], railX - 10, y, W - railX - gap + 20, halfH);
      ctx.restore();
      ctx.save();
      slantedPanelPath(ctx, railX, y, W - railX - gap, halfH, Math.round(H * 0.045));
      ctx.lineWidth = Math.max(3, H * 0.005);
      ctx.strokeStyle = 'rgba(10, 6, 24, 0.85)';
      ctx.stroke();
      ctx.restore();
    });
  } else {
    // Portrait / square: hero on top, the other scenes as a bottom strip.
    const stripH = Math.round(H * 0.26);
    const gap = Math.round(W * 0.016);
    const halfW = Math.round((W - gap * 3) / 2);
    paintCover(ctx, hero, 0, 0, W, H - stripH + gap);
    others.forEach((scene, i) => {
      const x = gap + i * (halfW + gap);
      const y = H - stripH;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, halfW, stripH - gap);
      ctx.clip();
      paintCover(ctx, images[scene.id], x, y, halfW, stripH - gap);
      ctx.restore();
      ctx.save();
      ctx.lineWidth = Math.max(3, W * 0.005);
      ctx.strokeStyle = 'rgba(10, 6, 24, 0.85)';
      ctx.strokeRect(x, y, halfW, stripH - gap);
      ctx.restore();
    });
  }
}

function paintGrade(ctx, W, H, preset, strength) {
  const s = Math.max(0, Math.min(1.4, strength));
  if (s <= 0.01) return;
  const grad = ctx.createLinearGradient(0, 0, W * 0.25, H);
  grad.addColorStop(0, preset.washTop);
  grad.addColorStop(0.52, preset.washMid);
  grad.addColorStop(1, preset.washBot);
  ctx.save();
  ctx.globalAlpha = s;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // A low sun band: a warm horizontal glow sitting on the lower third.
  const sun = ctx.createLinearGradient(0, H * 0.58, 0, H * 0.92);
  sun.addColorStop(0, 'rgba(255, 170, 60, 0)');
  sun.addColorStop(0.5, 'rgba(255, 140, 66, 0.20)');
  sun.addColorStop(1, 'rgba(255, 94, 168, 0)');
  ctx.save();
  ctx.globalAlpha = s * 0.9;
  ctx.fillStyle = sun;
  ctx.fillRect(0, H * 0.58, W, H * 0.34);
  ctx.restore();
}

function paintVignette(ctx, W, H, amount) {
  if (amount <= 0.01) return;
  const r = Math.max(W, H) * 0.72;
  const grad = ctx.createRadialGradient(W / 2, H / 2, r * 0.42, W / 2, H / 2, r);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(5,2,14,0.78)');
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// Deterministic pseudo-random grain: a tiny seeded LCG so every render of
// the same cover is identical and screenshots stay reproducible.
function paintGrain(ctx, W, H, amount) {
  if (amount <= 0.01) return;
  let seed = 987654321;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const dots = Math.round(2600 * amount);
  ctx.save();
  for (let i = 0; i < dots; i++) {
    const x = next() * W;
    const y = next() * H;
    const a = next() * 0.16 * amount;
    ctx.fillStyle = next() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.restore();
}

function paintStripes(ctx, W, H, preset) {
  // Three diagonal accent slashes crossing the panel seam.
  ctx.save();
  ctx.translate(W * 0.648, 0);
  ctx.rotate(0.06);
  const widths = [0.012, 0.006, 0.009];
  let offset = 0;
  widths.forEach((f, i) => {
    ctx.fillStyle = i === 1 ? 'rgba(255,255,255,0.85)' : preset.accent;
    ctx.globalAlpha = i === 1 ? 0.5 : 0.9;
    ctx.fillRect(offset, -H * 0.05, W * f, H * 1.1);
    offset += W * f + W * 0.008;
  });
  ctx.restore();
}

function fitHeadline(ctx, text, maxWidth, baseSize) {
  let size = baseSize;
  ctx.font = `${size}px 'Anton', sans-serif`;
  while (size > 24 && ctx.measureText(text).width > maxWidth) {
    size -= 4;
    ctx.font = `${size}px 'Anton', sans-serif`;
  }
  return size;
}

function paintLettering(ctx, W, H, state, preset) {
  const margin = Math.round(W * 0.045);
  const wide = W >= H;
  const maxTitleW = wide ? W * 0.56 : W * 0.9;
  const title = (state.title || '').trim() || 'NEON COAST';
  const lines = title.toUpperCase().split('\n').map((l) => l.trim()).filter(Boolean);
  const base = H * 0.155 * (state.titleScale || 1);

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  let y = H * 0.16;
  lines.forEach((line) => {
    const size = fitHeadline(ctx, line, maxTitleW, base);
    ctx.font = `${size}px 'Anton', sans-serif`;
    // Hard offset shadow first, then a dark outline, then the gradient face.
    ctx.fillStyle = 'rgba(20, 4, 40, 0.55)';
    ctx.fillText(line, margin + size * 0.045, y + size * 0.05);
    const face = ctx.createLinearGradient(0, y - size, 0, y);
    face.addColorStop(0, preset.headFrom);
    face.addColorStop(1, preset.headTo);
    ctx.lineWidth = Math.max(3, size * 0.055);
    ctx.strokeStyle = '#160a2e';
    ctx.lineJoin = 'round';
    ctx.strokeText(line, margin, y);
    ctx.fillStyle = face;
    ctx.fillText(line, margin, y);
    y += size * 1.04;
  });

  // Script tagline tucked under the headline.
  const tag = (state.tagline || '').trim();
  if (tag) {
    const size = Math.round(H * 0.052);
    ctx.font = `${size}px 'Pacifico', cursive`;
    ctx.save();
    ctx.translate(margin + 4, y + size * 0.55);
    ctx.rotate(-0.025);
    ctx.lineWidth = Math.max(2, size * 0.12);
    ctx.strokeStyle = 'rgba(22, 10, 46, 0.8)';
    ctx.strokeText(tag, 0, 0);
    ctx.fillStyle = preset.script;
    ctx.fillText(tag, 0, 0);
    ctx.restore();
  }
  ctx.restore();
  return y;
}

function paintRibbon(ctx, W, H, state, preset) {
  const text = (state.ribbon || '').trim().toUpperCase();
  if (!text) return;
  const size = Math.round(H * 0.03);
  ctx.save();
  ctx.font = `${size}px 'Anton', sans-serif`;
  const tw = ctx.measureText(text).width;
  const padX = size * 0.9;
  const bw = tw + padX * 2;
  const bh = size * 1.9;
  // Anchored top-right, rotated like a sticker slapped on the sleeve.
  ctx.translate(W - bw * 0.52, bh * 1.15);
  ctx.rotate(0.1);
  ctx.fillStyle = 'rgba(14, 6, 32, 0.88)';
  roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, bh * 0.28);
  ctx.fill();
  ctx.lineWidth = Math.max(2, H * 0.0035);
  ctx.strokeStyle = preset.accent;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, size * 0.05);
  ctx.restore();
}

function paintCaptionBand(ctx, W, H, state, preset) {
  const caption = (state.caption || '').trim();
  const bandH = Math.round(H * 0.105);
  const y = H - bandH;
  ctx.save();
  ctx.fillStyle = 'rgba(8, 4, 20, 0.82)';
  ctx.fillRect(0, y, W, bandH);
  ctx.fillStyle = preset.accent;
  ctx.fillRect(0, y, W, Math.max(3, H * 0.006));

  const margin = Math.round(W * 0.045);
  ctx.textBaseline = 'middle';
  if (caption) {
    const size = Math.round(bandH * 0.34);
    ctx.font = `${size}px 'Anton', sans-serif`;
    ctx.fillStyle = '#fdf7ff';
    ctx.textAlign = 'left';
    ctx.fillText(caption.toUpperCase(), margin, y + bandH / 2 + 1);
  }
  // Studio wordmark, right aligned and deliberately generic: this is an
  // original fan-art studio, not any publisher's branding.
  const mark = 'NEON COAST COVER STUDIO';
  const mSize = Math.round(bandH * 0.24);
  ctx.font = `${mSize}px 'Anton', sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  ctx.textAlign = 'right';
  ctx.fillText(mark, W - margin, y + bandH / 2 + 1);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// The one public entry point: paint a whole cover.
//   state: { sceneId, title, tagline, ribbon, caption, presetId,
//            grade (0..1.4), vignette (0..1), grain (0..1), titleScale }
//   images: { rooftop: HTMLImageElement, 'neon-pier': ..., 'palm-drive': ... }
// ---------------------------------------------------------------------------

export function paintCoverArt(ctx, W, H, state, images) {
  const preset = presetById(state.presetId);
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  paintPanels(ctx, W, H, state, images);
  paintGrade(ctx, W, H, preset, state.grade == null ? 0.85 : state.grade);
  if (W >= H) paintStripes(ctx, W, H, preset);
  paintVignette(ctx, W, H, state.vignette == null ? 0.55 : state.vignette);
  paintLettering(ctx, W, H, state, preset);
  paintRibbon(ctx, W, H, state, preset);
  paintCaptionBand(ctx, W, H, state, preset);
  paintGrain(ctx, W, H, state.grain == null ? 0.5 : state.grain);
  ctx.restore();
}
