// shots.js — Neon Coast Cover Studio: screenshot-mode plumbing.
//
// The studio doubles as its own screenshot stage. Opening the page with a
// `?shot=...` query switches it into a deterministic staging mode used to
// produce the entry's screenshots:
//
//   ?shot=cover   full-bleed cover only, no editor chrome, sized by
//                 &format=wide|poster|square
//   ?shot=editor  the normal editor, pre-loaded with the requested scene
//
// Recognised parameters (all optional):
//   scene    rooftop | neon-pier | palm-drive
//   title    headline text        tagline  script line under the headline
//   ribbon   ribbon badge text    caption  bottom band text
//   preset   sunset | midnight | gold
//   format   wide | poster | square
//
// Anything unrecognised falls back to the studio defaults, so a bare
// `?shot=cover` still stages a sensible cover.

'use strict';

const KNOWN_SCENES = ['rooftop', 'neon-pier', 'palm-drive'];
const KNOWN_PRESETS = ['sunset', 'midnight', 'gold'];
const KNOWN_FORMATS = ['wide', 'poster', 'square'];

function pickParam(params, name, allowed, fallback) {
  const raw = params.get(name);
  if (raw == null) return fallback;
  const value = raw.trim();
  return allowed.includes(value) ? value : fallback;
}

function textParam(params, name, fallback, maxLen) {
  const raw = params.get(name);
  if (raw == null) return fallback;
  const value = raw.trim();
  if (!value) return fallback;
  return value.slice(0, maxLen);
}

// Parse the current location's query string into a staging description.
// Returns null when the page was opened as a plain editor (no shot param),
// which is the signal for main.js to boot the interactive studio untouched.
export function readShotRequest() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('shot');
  if (mode !== 'cover' && mode !== 'editor') return null;

  return {
    mode,
    overrides: {
      sceneId: pickParam(params, 'scene', KNOWN_SCENES, 'neon-pier'),
      presetId: pickParam(params, 'preset', KNOWN_PRESETS, 'sunset'),
      formatId: pickParam(params, 'format', KNOWN_FORMATS, 'wide'),
      title: textParam(params, 'title', 'NEON COAST', 42),
      tagline: textParam(params, 'tagline', 'vice nights, fast lights', 60),
      ribbon: textParam(params, 'ribbon', 'STUDIO EXCLUSIVE', 30),
      caption: textParam(params, 'caption', 'One city. Every story.', 60),
    },
  };
}

// Mark the document as staged so the stylesheet can strip the editor chrome
// in cover mode and freeze animations for a stable capture.
export function markStaged(mode) {
  document.documentElement.dataset.shot = mode;
  document.body.dataset.shot = mode;
}
