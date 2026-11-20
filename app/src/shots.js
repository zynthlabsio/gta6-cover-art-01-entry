// Fixed scenes for screenshots: ?shot=editor shows the page with a sample photo; ?shot=cover shows the cover alone.
// `photo` picks the sample (samples/<photo>.jpg) and `caption` the words. window.__shotReady is set once painted.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await load(`samples/${query.get('photo') ?? 'pier'}.jpg`, query.get('caption') ?? 'Sunset Heist');
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
