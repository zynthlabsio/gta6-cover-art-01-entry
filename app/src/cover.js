// Neon Coast cover engine: draws a multi-panel GTA-style poster cover onto a 2D canvas.
// Every cover is built from the photos the user loaded plus the caption they typed.
// Layouts: hero-and-three, four-panel grid, nine-panel grid, full-bleed, tilted snapshots.
// Grades: neon sunset, Vice pink/teal, golden hour, midnight neon, monochrome noir.

export const LAYOUTS = ['hero-three', 'grid4', 'grid9', 'fullbleed', 'tilted'];
export const GRADES = ['neon-sunset', 'vice-pink', 'golden-hour', 'midnight-neon', 'noir'];

export const GRADE_DEFS = {
  'neon-sunset': { sky: ['#ff5e3a', '#ff2e88', '#7b2ff7'], tint: ['#ff7b00', '#ff2e88'], wash: 'rgba(255, 46, 136, 0.20)', deep: '#2b0f3f' },
  'vice-pink': { sky: ['#ff7ad9', '#19d3da', '#0f2a4d'], tint: ['#ff7ad9', '#19d3da'], wash: 'rgba(255, 122, 217, 0.18)', deep: '#10233d' },
  'golden-hour': { sky: ['#ffd166', '#ff7b00', '#c22e6e'], tint: ['#ffb347', '#ff5e3a'], wash: 'rgba(255, 150, 40, 0.20)', deep: '#3d1c0d' },
  'midnight-neon': { sky: ['#0affef', '#b537f2', '#12082e'], tint: ['#0affef', '#ff2e88'], wash: 'rgba(120, 60, 255, 0.24)', deep: '#0b061f' },
  'noir': { sky: ['#e8e8e8', '#8a8a8a', '#111111'], tint: ['#ffffff', '#333333'], wash: 'rgba(0, 0, 0, 0.18)', deep: '#0a0a0a' },
};

/** How many photo panels a layout shows. */
export function panelCount(layout) {
  if (layout === 'hero-three') return 4;
  if (layout === 'grid4') return 4;
  if (layout === 'grid9') return 9;
  if (layout === 'fullbleed') return 1;
  return 3; // tilted
}

/** Panel rectangles for a layout, in canvas pixels. Each is {x, y, w, h, rot}. */
export function layoutPanels(layout, W, H) {
  const g = Math.max(6, Math.round(W * 0.008)); // gutter
  if (layout === 'hero-three') {
    const heroH = Math.round(H * 0.58);
    const bw = (W - g * 2) / 3;
    const bh = H - heroH - g;
    return [
      { x: 0, y: 0, w: W, h: heroH, rot: 0 },
      { x: 0, y: heroH + g, w: bw, h: bh, rot: 0 },
      { x: bw + g, y: heroH + g, w: bw, h: bh, rot: 0 },
      { x: bw * 2 + g * 2, y: heroH + g, w: bw, h: bh, rot: 0 },
    ];
  }
  if (layout === 'grid4') {
    const cw = (W - g) / 2;
    const ch = (H - g) / 2;
    return [
      { x: 0, y: 0, w: cw, h: ch, rot: 0 },
      { x: cw + g, y: 0, w: cw, h: ch, rot: 0 },
      { x: 0, y: ch + g, w: cw, h: ch, rot: 0 },
      { x: cw + g, y: ch + g, w: cw, h: ch, rot: 0 },
    ];
  }
  if (layout === 'grid9') {
    const cw = (W - g * 2) / 3;
    const ch = (H - g * 2) / 3;
    const out = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        out.push({ x: c * (cw + g), y: r * (ch + g), w: cw, h: ch, rot: 0 });
      }
    }
    return out;
  }
  if (layout === 'fullbleed') return [{ x: 0, y: 0, w: W, h: H, rot: 0 }];
  // tilted snapshots: three polaroid-style panels, fanned across a sunset sky
  const pw = W * 0.38;
  const ph = H * 0.52;
  return [
    { x: W * 0.04, y: H * 0.10, w: pw, h: ph, rot: -0.10 },
    { x: W * 0.31, y: H * 0.05, w: pw, h: ph, rot: 0.03 },
    { x: W * 0.58, y: H * 0.12, w: pw, h: ph, rot: 0.09 },
  ];
}

/** Draws one photo into a panel rect with cover-fit, zoom and pan offsets (-1..1). */
export function drawPhotoInPanel(ctx, photo, rect, zoom, ox, oy) {
  const { x, y, w, h } = rect;
  if (!photo) {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#3d1c5e');
    grad.addColorStop(1, '#120a1c');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = `700 ${Math.max(14, w * 0.045)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', x + w / 2, y + h / 2);
    return;
  }
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const base = Math.max(w / iw, h / ih);
  const scale = base * Math.max(1, zoom || 1);
  const pw = iw * scale;
  const ph = ih * scale;
  const maxX = Math.max(0, (pw - w) / 2);
  const maxY = Math.max(0, (ph - h) / 2);
  const dx = x + (w - pw) / 2 - (ox || 0) * maxX;
  const dy = y + (h - ph) / 2 - (oy || 0) * maxY;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(photo, dx, dy, pw, ph);
  ctx.restore();
}

/** Gradient-map colour grade: a warm sky wash plus a two-colour overlay. */
export function applyGrade(ctx, rect, gradeName) {
  const def = GRADE_DEFS[gradeName] || GRADE_DEFS['neon-sunset'];
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const wash = ctx.createLinearGradient(x, y, x + w, y + h);
  wash.addColorStop(0, def.tint[0]);
  wash.addColorStop(1, def.tint[1]);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = gradeName === 'noir' ? 0.35 : 0.55;
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  if (gradeName === 'noir') {
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#808080';
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }
  const shade = ctx.createLinearGradient(x, y + h * 0.55, x, y + h);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, def.wash);
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Sunset sky backdrop for the tilted layout, with a low sun and a skyline. */
export function drawSunsetBackdrop(ctx, W, H, gradeName) {
  const def = GRADE_DEFS[gradeName] || GRADE_DEFS['neon-sunset'];
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, def.sky[2]);
  sky.addColorStop(0.5, def.sky[1]);
  sky.addColorStop(1, def.sky[0]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  const sunR = W * 0.16;
  const sun = ctx.createRadialGradient(W * 0.72, H * 0.34, sunR * 0.1, W * 0.72, H * 0.34, sunR);
  sun.addColorStop(0, '#fff7d6');
  sun.addColorStop(0.6, '#ffb347');
  sun.addColorStop(1, 'rgba(255, 94, 58, 0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(W * 0.72, H * 0.34, sunR, 0, Math.PI * 2);
  ctx.fill();
  // simple skyline silhouette along the bottom
  ctx.fillStyle = def.deep;
  let bx = 0;
  const heights = [0.05, 0.08, 0.04, 0.09, 0.06, 0.035, 0.07, 0.045, 0.08, 0.05];
  heights.forEach((hh, i) => {
    const bw = W / heights.length;
    const bh = H * hh;
    ctx.fillRect(bx, H - bh - H * 0.02, bw * 0.82, bh + H * 0.02);
    bx += bw;
  });
}

let noiseCanvas = null;

/** A reusable tile of random film grain, built once per page load. */
export function grainTile(size) {
  if (noiseCanvas) return noiseCanvas;
  noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = size;
  noiseCanvas.height = size;
  const nctx = noiseCanvas.getContext('2d');
  const img = nctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  nctx.putImageData(img, 0, 0);
  return noiseCanvas;
}

/** Halftone dot rows inside a rectangle, fading toward the top. */
export function drawHalftone(ctx, x, y, w, h, colour) {
  const step = Math.max(10, w * 0.018);
  ctx.save();
  ctx.fillStyle = colour;
  for (let row = 0; row * step < h; row++) {
    const r = (step * 0.32 * (row + 1)) / Math.max(1, Math.ceil(h / step));
    for (let col = 0; col * step < w; col++) {
      ctx.beginPath();
      ctx.arc(x + col * step + step / 2, y + row * step + step / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** The big caption block: halftone strip, Anton title, Pacifico subtitle, badge ribbon. */
export function drawTitleBlock(ctx, W, H, state) {
  const bandH = Math.round(H * 0.20);
  const y0 = H - bandH;
  const grad = ctx.createLinearGradient(0, y0, 0, H);
  grad.addColorStop(0, 'rgba(10, 4, 20, 0)');
  grad.addColorStop(0.35, 'rgba(10, 4, 20, 0.88)');
  grad.addColorStop(1, 'rgba(10, 4, 20, 0.94)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, y0, W, H - y0);
  if (state.halftone) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    drawHalftone(ctx, 0, y0 + bandH * 0.55, W, bandH * 0.45, '#ff2e88');
    ctx.restore();
  }
  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    let size = H * 0.115;
    ctx.font = `${size}px Anton, sans-serif`;
    while (ctx.measureText(title).width > W * 0.92 && size > 16) {
      size -= 2;
      ctx.font = `${size}px Anton, sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const ty = H - bandH * 0.34;
    ctx.lineWidth = Math.max(2, size * 0.10);
    ctx.strokeStyle = '#19d3da';
    ctx.lineJoin = 'round';
    ctx.strokeText(title, W / 2, ty);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 46, 136, 0.9)';
    ctx.shadowBlur = size * 0.25;
    ctx.fillText(title, W / 2, ty);
    ctx.shadowBlur = 0;
  }
  const sub = (state.subtitle || '').trim();
  if (sub) {
    let size = H * 0.048;
    ctx.font = `${size}px Pacifico, cursive`;
    while (ctx.measureText(sub).width > W * 0.8 && size > 12) {
      size -= 2;
      ctx.font = `${size}px Pacifico, cursive`;
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffb347';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = size * 0.3;
    ctx.fillText(sub, W / 2, H - bandH * 0.04);
    ctx.shadowBlur = 0;
  }
  const badge = (state.badge || '').trim();
  if (badge) {
    const pad = W * 0.02;
    const bh = H * 0.042;
    ctx.font = `700 ${bh * 0.55}px system-ui, sans-serif`;
    const bw = ctx.measureText(badge).width + pad * 2;
    const bx = W - bw - W * 0.035;
    const by = H * 0.035;
    ctx.save();
    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.rotate(-0.06);
    ctx.fillStyle = '#ff2e88';
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, bh * 0.08);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge, 0, 1);
    ctx.restore();
  }
}

/** Soft dark corners over the whole cover. */
export function drawVignette(ctx, W, H) {
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

/** Draws the whole cover for `state` onto `canvas` at its current size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = state.grade || 'neon-sunset';
  const def = GRADE_DEFS[grade] || GRADE_DEFS['neon-sunset'];
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = def.deep;
  ctx.fillRect(0, 0, W, H);
  const panels = layoutPanels(state.layout || 'hero-three', W, H);
  const count = panelCount(state.layout || 'hero-three');
  if (state.layout === 'tilted') drawSunsetBackdrop(ctx, W, H, grade);
  const frame = state.frame === false ? 0 : Math.max(4, Math.round(W * 0.008));
  for (let i = 0; i < count; i++) {
    const rect = panels[i];
    const p = (state.panels || [])[i] || {};
    const photo = p.photoIndex == null || p.photoIndex < 0 ? null : (state.photos || [])[p.photoIndex] || null;
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.translate(-rect.w / 2, -rect.h / 2);
    } else {
      ctx.translate(rect.x, rect.y);
    }
    if (state.layout === 'tilted') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-frame, -frame, rect.w + frame * 2, rect.h + frame * 2 + frame * 3);
      ctx.fillStyle = '#111';
      ctx.font = `700 ${Math.max(12, rect.w * 0.05)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('NEON COAST', rect.w / 2, rect.h + frame * 2);
    } else if (frame > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-frame / 2, -frame / 2, rect.w + frame, rect.h + frame);
    }
    const local = { x: 0, y: 0, w: rect.w, h: rect.h };
    drawPhotoInPanel(ctx, photo, local, p.zoom || 1, p.ox || 0, p.oy || 0);
    applyGrade(ctx, local, grade);
    if (state.selected === i) {
      ctx.strokeStyle = '#19d3da';
      ctx.lineWidth = Math.max(3, W * 0.006);
      ctx.setLineDash([Math.max(8, W * 0.012), Math.max(6, W * 0.008)]);
      ctx.strokeRect(0, 0, rect.w, rect.h);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
  drawTitleBlock(ctx, W, H, state);
  if (state.vignette) drawVignette(ctx, W, H);
  if (state.grain) {
    const tile = grainTile(128);
    ctx.save();
    ctx.globalAlpha = 0.07;
    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

/** Renders the cover at export size on a fresh canvas and returns it. */
export function renderCoverAtSize(state, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, { ...state, selected: -1 });
  return canvas;
}
