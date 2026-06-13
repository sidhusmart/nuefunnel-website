// Generates the brand favicon set and Open Graph share image from the
// nuefunnel design tokens, mirroring the sharp-based pipeline in
// optimize-images.mjs.
//
// Why this exists: the favicon and OG image must render identically
// everywhere — in sharp's bundled renderer, in browsers, and pinned to a
// phone home screen — with zero dependency on the viewer having Inter Tight
// installed. We achieve that by converting the wordmark/monogram glyphs to
// vector PATHS (via fontkit's variable-font glyph API) instead of relying on
// live <text> rendering. The committed SVGs are therefore self-contained.
//
// Run: node scripts/generate-brand-assets.mjs   (or npm run brand:assets)
//
// Source font (Inter Tight, OFL) lives in scripts/brand-src/. Re-run after
// changing the tagline, wordmark, or brand colors below.

import { writeFile } from 'fs/promises';
import { join } from 'path';
import * as fontkitNS from 'fontkit';
import sharp from 'sharp';

const fontkit = fontkitNS.default ?? fontkitNS;

// ── Brand tokens (kept in sync with tailwind.config.mjs) ──────────────────
const INK = '#111111';     // headings / wordmark
const BODY = '#44444C';    // body copy
const SUBTLE = '#76767E';  // meta / captions
const PAPER = '#FBFAF7';   // warm off-white page background
const ACCENT = '#0F766E';  // deep teal — links + CTA

const FONT_PATH = 'scripts/brand-src/InterTight.ttf';
const WGHT = 600;          // Inter Tight SemiBold — matches the site wordmark
const PUBLIC = 'public';
const IMAGES = join(PUBLIC, 'images');

const font = fontkit.openSync(FONT_PATH);
const vf = font.getVariation({ wght: WGHT });
const UPM = font.unitsPerEm;

// ── Glyph → path helpers ──────────────────────────────────────────────────

// Lay a string out in font units (y-up) and return the per-glyph path data
// positioned along the pen, plus the run's advance width and union bbox.
function runData(text) {
  const run = vf.layout(text);
  const glyphs = [];
  let penX = 0;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  run.glyphs.forEach((glyph, i) => {
    const pos = run.positions[i];
    const x = penX + (pos.xOffset || 0);
    const y = pos.yOffset || 0;
    const d = glyph.path.toSVG();
    if (d) {
      glyphs.push({ d, x, y });
      const b = glyph.path.bbox; // font units, y-up
      if (Number.isFinite(b.minX)) {
        minX = Math.min(minX, x + b.minX);
        minY = Math.min(minY, y + b.minY);
        maxX = Math.max(maxX, x + b.maxX);
        maxY = Math.max(maxY, y + b.maxY);
      }
    }
    penX += pos.xAdvance;
  });

  return { glyphs, advance: penX, bbox: { minX, minY, maxX, maxY } };
}

// Inner <path> elements for a run, each translated to its pen position.
function glyphPaths(run) {
  return run.glyphs
    .map((g) => `<path transform="translate(${r(g.x)} ${r(g.y)})" d="${g.d}"/>`)
    .join('');
}

// Place a run with its baseline at (x, baseline), at the given pixel size and
// fill. Font space is y-up, so we flip with scale(s, -s).
function baselineRun(run, x, baseline, sizePx, fill) {
  const s = sizePx / UPM;
  return `<g fill="${fill}" transform="translate(${r(x)} ${r(baseline)}) scale(${r(s)} ${r(-s)})">${glyphPaths(run)}</g>`;
}

// Place a run centered (by its glyph bbox) inside a box centered at (cx, cy),
// scaled so the longer bbox side fits `fitPx`.
function centeredRun(run, cx, cy, fitPx, fill) {
  const { minX, minY, maxX, maxY } = run.bbox;
  const w = maxX - minX;
  const h = maxY - minY;
  const s = fitPx / Math.max(w, h);
  const bx = (minX + maxX) / 2;
  const by = (minY + maxY) / 2;
  const tx = cx - s * bx;
  const ty = cy + s * by; // +, because the group flips y
  return `<g fill="${fill}" transform="translate(${r(tx)} ${r(ty)}) scale(${r(s)} ${r(-s)})">${glyphPaths(run)}</g>`;
}

// Greedy word wrap: returns array of lines fitting within maxWidthPx.
function wrapText(text, sizePx, maxWidthPx) {
  const s = sizePx / UPM;
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    const width = runData(trial).advance * s;
    if (width > maxWidthPx && current) {
      lines.push(current);
      current = word;
    } else {
      current = trial;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const r = (n) => Math.round(n * 100) / 100; // trim float noise in path output

// ── Monogram tile (favicon family) ─────────────────────────────────────────

// A square "nf" tile. radiusPct rounds the corners (0 = hard square, for the
// Apple/maskable variants that get masked by the OS). fitFrac controls how
// much of the tile the glyphs occupy (smaller for maskable safe zones).
function monogramSVG({ size = 256, radiusPct = 0.18, bg = ACCENT, fg = PAPER, fitFrac = 0.6 } = {}) {
  const run = runData('nf');
  const rx = size * radiusPct;
  const tile = radiusPct > 0
    ? `<rect width="${size}" height="${size}" rx="${r(rx)}" fill="${bg}"/>`
    : `<rect width="${size}" height="${size}" fill="${bg}"/>`;
  const glyphs = centeredRun(run, size / 2, size / 2, size * fitFrac, fg);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${tile}${glyphs}</svg>`;
}

// ── Open Graph image ────────────────────────────────────────────────────────

function ogSVG() {
  const W = 1200, H = 630;
  const padX = 96;

  // Wordmark "nuefunnel" — the hero element.
  const wordmark = runData('nuefunnel');
  const wmSize = 124;
  const wmBaseline = 300;
  const wordmarkEl = baselineRun(wordmark, padX, wmBaseline, wmSize, INK);

  // Teal accent rule beneath the wordmark.
  const ruleY = wmBaseline + 34;
  const rule = `<rect x="${padX + 2}" y="${ruleY}" width="132" height="9" rx="4.5" fill="${ACCENT}"/>`;

  // Tagline — the site's own hero line — wrapped.
  const tagSize = 42;
  const tagLines = wrapText('Shipping AI products with small teams.', tagSize, W - padX * 2);
  const tagStartBaseline = ruleY + 92;
  const tagLeading = tagSize * 1.3;
  const taglineEls = tagLines
    .map((line, i) => baselineRun(runData(line), padX, tagStartBaseline + i * tagLeading, tagSize, BODY))
    .join('');

  // Domain footer, subtle.
  const domain = baselineRun(runData('nuefunnel.com'), padX, H - 64, 28, SUBTLE);

  // "nf" monogram echo in the top-right corner.
  const tileSize = 120;
  const tileX = W - padX - tileSize;
  const tileY = 72;
  const cornerTile =
    `<g transform="translate(${tileX} ${tileY})">` +
    `<rect width="${tileSize}" height="${tileSize}" rx="${tileSize * 0.22}" fill="${ACCENT}"/>` +
    centeredRun(runData('nf'), tileSize / 2, tileSize / 2, tileSize * 0.58, PAPER) +
    `</g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="${PAPER}"/>` +
    cornerTile + wordmarkEl + rule + taglineEls + domain +
    `</svg>`;
}

// ── ICO encoder (no external dependency) ────────────────────────────────────
// Packs PNG buffers into a multi-size .ico (icons embed PNG data directly).
function buildIco(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);      // reserved
  header.writeUInt16LE(1, 2);      // type: icon
  header.writeUInt16LE(count, 4);  // image count

  const entries = [];
  const blobs = [];
  let offset = 6 + count * 16;
  for (const { size, buf } of pngs) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width  (0 ⇒ 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2);   // palette
    entry.writeUInt8(0, 3);   // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += buf.length;
    entries.push(entry);
    blobs.push(buf);
  }
  return Buffer.concat([header, ...entries, ...blobs]);
}

const svgToPng = (svg, size) =>
  sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

// ── Build everything ────────────────────────────────────────────────────────

async function main() {
  // Favicon SVG — rounded tile, ships to browsers (path-based, self-contained).
  const faviconSvg = monogramSVG({ size: 256, radiusPct: 0.18, fitFrac: 0.6 });
  await writeFile(join(PUBLIC, 'favicon.svg'), faviconSvg);

  // PNG rasters + multi-size .ico from the same rounded tile.
  const ico16 = await svgToPng(monogramSVG({ size: 16, radiusPct: 0.18, fitFrac: 0.66 }), 16);
  const ico32 = await svgToPng(monogramSVG({ size: 32, radiusPct: 0.18, fitFrac: 0.64 }), 32);
  const ico48 = await svgToPng(monogramSVG({ size: 48, radiusPct: 0.18, fitFrac: 0.62 }), 48);
  await writeFile(join(PUBLIC, 'favicon.ico'), buildIco([
    { size: 16, buf: ico16 }, { size: 32, buf: ico32 }, { size: 48, buf: ico48 },
  ]));
  await writeFile(join(PUBLIC, 'favicon-32.png'), ico32);
  await writeFile(join(PUBLIC, 'favicon-96.png'), await svgToPng(monogramSVG({ size: 96, radiusPct: 0.18, fitFrac: 0.6 }), 96));

  // Apple touch icon — hard square (iOS applies its own mask), slight padding.
  await writeFile(
    join(PUBLIC, 'apple-touch-icon.png'),
    await svgToPng(monogramSVG({ size: 180, radiusPct: 0, fitFrac: 0.56 }), 180),
  );

  // Maskable PWA icons — hard square, tighter glyph for the safe zone.
  await writeFile(join(PUBLIC, 'icon-192.png'), await svgToPng(monogramSVG({ size: 192, radiusPct: 0, fitFrac: 0.5 }), 192));
  await writeFile(join(PUBLIC, 'icon-512.png'), await svgToPng(monogramSVG({ size: 512, radiusPct: 0, fitFrac: 0.5 }), 512));

  // Web manifest.
  const manifest = {
    name: 'nuefunnel',
    short_name: 'nuefunnel',
    description: 'A two-person studio shipping AI products with small teams.',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
    theme_color: PAPER,
    background_color: PAPER,
    display: 'standalone',
    start_url: '/',
  };
  await writeFile(join(PUBLIC, 'site.webmanifest'), JSON.stringify(manifest, null, 2));

  // Open Graph image — 1200×630 JPG (path referenced by Layout.astro default).
  const og = ogSVG();
  await writeFile(join(IMAGES, 'og-source.svg'), og); // keep the editable source
  await sharp(Buffer.from(og)).resize(1200, 630).jpeg({ quality: 90, mozjpeg: true }).toFile(join(IMAGES, 'og-image.jpg'));

  console.log('✓ favicon.svg / .ico / -32 / -96 / apple-touch-icon');
  console.log('✓ icon-192.png / icon-512.png / site.webmanifest');
  console.log('✓ images/og-image.jpg (1200×630) + og-source.svg');
}

main().catch((err) => { console.error(err); process.exit(1); });
