/**
 * Draws the pictures used by README.md into ../assets, once for GitHub's dark theme and
 * once for its light theme:
 *
 *   header-*.svg    the banner: name, one-line role, what I'm exploring, and the chip
 *   divider-*.svg   a thin line with a pulse running along it
 *   dot-*.svg       the small coloured dots beside each research area
 *
 * Everything you might want to change is in PROFILE, right below. Then run:
 *
 *   node tools/build-assets.mjs
 *
 * and commit the changed files in assets/. No packages are needed, only Node.js.
 *
 * The pictures are plain SVG with a little CSS animation inside. GitHub shows them as
 * images, so they cannot run scripts or load fonts; they use whatever fonts the reader
 * has. Readers who ask their system for less motion get still pictures.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROFILE = {
  name: 'Anubhav Prasad',
  monogram: 'AP',
  role: 'B.Tech · Integrated Circuit Design and Technology · IIT Ropar',
  /** The word that starts the "exploring" line, and the one before areas still to come. */
  exploring: 'Exploring',
  next: 'next:',
  /** `hue` names a colour in THEMES below. `next: true` marks an area not started yet. */
  areas: [
    { title: 'AI security', hue: 'rose' },
    { title: 'Diffusion models', hue: 'violet' },
    { title: 'Digital circuits', hue: 'copper' },
    { title: 'Embodied AI', hue: 'green', next: true },
  ],
};

/** The same colours as the portfolio site's "Silicon Night" look, dark and light. */
const THEMES = {
  dark: {
    card: '#0a0d14',
    edge: 'rgba(150,180,220,0.16)',
    grid: 'rgba(150,180,220,0.07)',
    strong: '#f4f7fb',
    soft: '#b0bac8',
    muted: '#8b97a8',
    accent: '#e8a06a',
    signal: '#6cd8ff',
    live: '#6fcf97',
    glowA: 'rgba(232,160,106,0.38)',
    glowB: 'rgba(108,216,255,0.16)',
    pin: '#a3836a',
    hues: { rose: '#ff8aa8', violet: '#b3a8ff', copper: '#f0ad7a', green: '#6fcf97' },
  },
  light: {
    card: '#ffffff',
    edge: '#dfe4ec',
    grid: 'rgba(18,23,34,0.06)',
    strong: '#0a0e16',
    soft: '#3a4456',
    muted: '#566175',
    accent: '#a3561e',
    signal: '#086a94',
    live: '#1f7a4c',
    glowA: 'rgba(163,86,30,0.2)',
    glowB: 'rgba(8,106,148,0.1)',
    pin: '#8e7058',
    hues: { rose: '#b8325a', violet: '#5646c0', copper: '#a3561e', green: '#1f7a4c' },
  },
};

/** A chip is dark in both themes. */
const CHIP = { body: '#151a24', edge: '#2b3242', ink: '#eef2f8' };

/** Dots sit on GitHub's own page colour, so one mid-tone set serves both themes. */
const DOTS = { rose: '#e85d85', violet: '#8b7cf0', copper: '#d98a4e', green: '#3fae72' };

const SANS = "-apple-system, 'Segoe UI', system-ui, 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, 'SFMono-Regular', 'Cascadia Mono', Menlo, Consolas, monospace";

/**
 * The wires that fan out from the chip's pins, clockwise from the top left, in the
 * chip's own units (it is 200 wide; pins end at 20 and 180). Each goes to one area in
 * turn, so every colour shows on several sides.
 */
const WIRES = [
  'M70 20V-8L50-28V-58',
  'M106 20V-58',
  'M130 20V-8L150-28V-58',
  'M180 58H208L228 38H258',
  'M180 82H258',
  'M180 106H208L228 126H258',
  'M180 142H200L220 162H258',
  'M142 180V200L162 220V258',
  'M118 180V258',
  'M82 180V208L62 228V258',
  'M20 118H-8L-28 138H-58',
  'M20 94H-58',
  'M20 70H-8L-28 50H-58',
];
const PULSE_SECONDS = 4.2;
const PULSE_STAGGER = 1.37;

const escape = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The end point of a wire: the last pair of numbers its path reaches. */
function wireEnd(d) {
  let x = 0;
  let y = 0;
  for (const [, command, args] of d.matchAll(/([MLHV])([^MLHV]*)/g)) {
    const numbers = args.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
    if (command === 'H') x = numbers.at(-1);
    else if (command === 'V') y = numbers.at(-1);
    else [x, y] = numbers.slice(-2);
  }
  return [x, y];
}

/** The chip's pins: eight on each side, like a small QFP package. */
function pins(colour) {
  const out = [];
  const centres = Array.from({ length: 8 }, (_, i) => 58 + i * 12);
  for (const c of centres) {
    out.push(`<rect x="20" y="${c - 3}" width="20" height="6" rx="1"/>`);
    out.push(`<rect x="160" y="${c - 3}" width="20" height="6" rx="1"/>`);
    out.push(`<rect x="${c - 3}" y="20" width="6" height="20" rx="1"/>`);
    out.push(`<rect x="${c - 3}" y="160" width="6" height="20" rx="1"/>`);
  }
  return `<g fill="${colour}">${out.join('')}</g>`;
}

function chipFigure(t) {
  const wires = WIRES.map((d, i) => {
    const area = PROFILE.areas[i % PROFILE.areas.length];
    const colour = t.hues[area.hue];
    const [x, y] = wireEnd(d);
    const delay = -((i * PULSE_STAGGER) % PULSE_SECONDS).toFixed(2);
    const line = area.next
      ? `<path d="${d}" stroke="${colour}" stroke-opacity="0.45" stroke-dasharray="3 6"/>`
      : `<path d="${d}" stroke="${colour}" stroke-opacity="0.4"/>` +
        `<path class="pulse" d="${d}" stroke="${colour}" style="animation-delay:${delay}s"/>`;
    return `${line}<circle cx="${x}" cy="${y}" r="4.5" fill="${t.card}" stroke="${colour}" stroke-opacity="0.75" stroke-width="1.6"/>`;
  }).join('');
  return `
    <circle class="halo" cx="100" cy="100" r="150" fill="url(#halo)"/>
    <g fill="none" stroke-width="2" stroke-linejoin="round">${wires}</g>
    ${pins(t.pin)}
    <rect x="40" y="40" width="120" height="120" rx="8" fill="${CHIP.body}" stroke="${CHIP.edge}" stroke-width="1.5"/>
    <rect x="47" y="47" width="106" height="106" rx="4" fill="none" stroke="${CHIP.ink}" stroke-opacity="0.09"/>
    <circle cx="57" cy="57" r="4" fill="${CHIP.ink}" fill-opacity="0.22"/>
    <text x="100" y="101" text-anchor="middle" dominant-baseline="central" fill="${CHIP.ink}"
      font-family="${MONO}" font-weight="500" font-size="40" letter-spacing="2">${escape(PROFILE.monogram)}</text>`;
}

/** The "Exploring A · B · C · next: D" line, wrapped onto two rows. */
function exploringLines(t) {
  const parts = PROFILE.areas.map((area, i) => {
    const lead = area.next
      ? `<tspan fill="${t.muted}" font-family="${MONO}" font-size="17">${escape(PROFILE.next)} </tspan>`
      : '';
    const dot = i < PROFILE.areas.length - 1 ? `<tspan fill="${t.muted}"> · </tspan>` : '';
    return `${lead}<tspan fill="${t.hues[area.hue]}">${escape(area.title)}</tspan>${dot}`;
  });
  const half = Math.ceil(parts.length / 2);
  const first = `<tspan fill="${t.soft}">${escape(PROFILE.exploring)} </tspan>${parts.slice(0, half).join('')}`;
  return [first, parts.slice(half).join('')];
}

function header(t) {
  const [lineOne, lineTwo] = exploringLines(t);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 380" role="img" aria-labelledby="title">
  <title id="title">${escape(PROFILE.name)}. ${escape(PROFILE.role)}.</title>
  <style>
    .pulse { stroke-width: 2.4; stroke-linecap: round; stroke-dasharray: 16 420; animation: run ${PULSE_SECONDS}s linear infinite; }
    .halo { animation: breathe 6s ease-in-out infinite; }
    .led { animation: breathe 2.4s ease-in-out infinite; }
    .rise { animation: rise 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
    @keyframes run { to { stroke-dashoffset: -436; } }
    @keyframes breathe { 50% { opacity: 0.55; } }
    @keyframes rise { from { opacity: 0; transform: translateY(10px); } }
    @media (prefers-reduced-motion: reduce) { .pulse, .halo, .led, .rise { animation: none; } }
  </style>
  <defs>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="${t.grid}" stroke-width="1"/>
    </pattern>
    <radialGradient id="fade" cx="80%" cy="50%" r="55%">
      <stop offset="0" stop-color="#fff"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <mask id="gridMask"><rect width="1200" height="380" fill="url(#fade)"/></mask>
    <radialGradient id="halo">
      <stop offset="0" stop-color="${t.glowA}"/>
      <stop offset="0.5" stop-color="${t.glowB}"/>
      <stop offset="1" stop-color="${t.glowB}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="card"><rect x="1" y="1" width="1198" height="378" rx="18"/></clipPath>
  </defs>
  <rect x="1" y="1" width="1198" height="378" rx="18" fill="${t.card}" stroke="${t.edge}"/>
  <g clip-path="url(#card)">
    <rect width="1200" height="380" fill="url(#grid)" mask="url(#gridMask)"/>
    <g transform="translate(880 108) scale(0.82)">${chipFigure(t)}
    </g>
  </g>
  <g class="rise">
    <circle class="led" cx="70" cy="93" r="4.5" fill="${t.live}"/>
    <text x="88" y="98" fill="${t.muted}" font-family="${MONO}" font-size="15" letter-spacing="1.6">${escape(PROFILE.role.toUpperCase())}</text>
    <text x="62" y="186" fill="${t.strong}" font-family="${SANS}" font-weight="700" font-size="76" letter-spacing="-2.4">${escape(PROFILE.name)}</text>
    <text x="66" y="250" font-family="${SANS}" font-size="27" letter-spacing="-0.3">${lineOne}</text>
    <text x="66" y="290" font-family="${SANS}" font-size="27" letter-spacing="-0.3">${lineTwo}</text>
  </g>
</svg>
`;
}

function divider(t) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 24" role="presentation">
  <style>
    .pulse { stroke-dasharray: 60 1240; animation: run 5s linear infinite; }
    @keyframes run { from { stroke-dashoffset: 60; } to { stroke-dashoffset: -1240; } }
    @media (prefers-reduced-motion: reduce) { .pulse { animation: none; opacity: 0; } }
  </style>
  <defs>
    <!-- In the picture's own units: a flat line has no box of its own to stretch a gradient over. -->
    <linearGradient id="line" gradientUnits="userSpaceOnUse" x1="0" x2="1200">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="0"/>
      <stop offset="0.2" stop-color="${t.accent}" stop-opacity="0.55"/>
      <stop offset="0.8" stop-color="${t.signal}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${t.signal}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <path d="M0 12H1200" stroke="url(#line)" stroke-width="1.5"/>
  <path class="pulse" d="M0 12H1200" stroke="${t.signal}" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="600" cy="12" r="4.5" fill="${t.card}" stroke="${t.accent}" stroke-width="1.6"/>
</svg>
`;
}

const dot = (colour) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" role="presentation"><circle cx="8" cy="8" r="7" fill="${colour}" fill-opacity="0.22"/><circle cx="8" cy="8" r="4" fill="${colour}"/></svg>\n`;

const assets = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
mkdirSync(assets, { recursive: true });
const write = (name, content) => {
  writeFileSync(join(assets, name), content);
  console.log('wrote', `assets/${name}`);
};
for (const [name, theme] of Object.entries(THEMES)) {
  write(`header-${name}.svg`, header(theme));
  write(`divider-${name}.svg`, divider(theme));
}
for (const [name, colour] of Object.entries(DOTS)) write(`dot-${name}.svg`, dot(colour));
