// migration/scripts/migrate.mjs
//
// Phase 2 of the Framer → Astro migration. Reads migration/decisions.csv
// (canonicalized) plus the raw Framer exports under migration/exports/,
// and produces:
//   - src/content/<target>/<final_slug>.mdx   (one per non-skip row)
//   - public/images/migrated/<source>/<final_slug>/...  (cover + inline imgs)
//   - public/_redirects                          (overwrites existing stub)
//
// HTML→Markdown via turndown. Images downloaded with native fetch. YAML
// frontmatter serialized by a small hand-rolled emitter (no js-yaml dep).
//
// Usage:  node migration/scripts/migrate.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import TurndownService from 'turndown';
import { gfm } from '@joplin/turndown-plugin-gfm';

// ----- CSV parser (comma-delimited; decisions.csv and Framer exports both) ---

function parseCSV(text, delim = ',') {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; continue; }
        inQuotes = false; continue;
      }
      field += c; continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === delim) { row.push(field); field = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += c;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function csvToObjects(rows) {
  const header = rows[0];
  return rows.slice(1)
    .filter(r => r.some(c => c !== ''))
    .map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}

// ----- YAML frontmatter emitter (scalars + string arrays only) ---------------

const YAML_NEEDS_QUOTING = /["':\[\]\{\}#&*!|>%@`,\n]|^\s|\s$|^(?:true|false|null|~|-?\d+(?:\.\d+)?)$/i;

function yamlString(s) {
  s = String(s);
  if (!YAML_NEEDS_QUOTING.test(s)) return s;
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function yamlValue(v) {
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return '[' + v.map(yamlString).join(', ') + ']';
  return yamlString(v);
}

function buildFrontmatter(obj) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    lines.push(`${k}: ${yamlValue(v)}`);
  }
  lines.push('---');
  return lines.join('\n');
}

// ----- image helpers ---------------------------------------------------------

function extFromUrl(url) {
  const path = url.split('?')[0];
  const m = path.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : 'jpg';
}

async function downloadImage(url, destPath) {
  if (existsSync(destPath)) return { cached: true };
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(destPath), { recursive: true });
  writeFileSync(destPath, buf);
  return { cached: false };
}

function extractInlineImageUrls(html) {
  const urls = [];
  const re = /<img\s[^>]*src=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) urls.push(m[1]);
  return urls;
}

function rewriteImageUrls(html, urlMap) {
  return html.replace(/(<img\s[^>]*src=["'])([^"']+)(["'])/gi, (_, pre, url, post) => {
    return pre + (urlMap[url] || url) + post;
  });
}

// Framer's table editor doesn't wrap header rows in <thead> or use <th>
// cells — authors just bold the first row's <td>s. GFM tables require a
// header row, so without intervention the turndown-gfm plugin emits an
// empty header followed by the would-be header as a normal data row.
// Promote the first <tr> of any table that lacks both <thead> and <th>
// to use <th> cells, which the GFM plugin then renders as a proper header.
function ensureTableHeader(html, stats) {
  return html.replace(/<table\b([^>]*)>([\s\S]*?)<\/table>/gi, (full, attrs, inner) => {
    if (/<thead\b/i.test(inner) || /<th\b/i.test(inner)) return full;
    const trMatch = inner.match(/<tr\b[^>]*>([\s\S]*?)<\/tr>/i);
    if (!trMatch) return full;
    if (stats) stats.tableHeaderPromotions++;
    const firstTrFull = trMatch[0];
    const firstTrInner = trMatch[1];
    const newFirstTrInner = firstTrInner
      .replace(/<td\b([^>]*)>/gi, '<th$1>')
      .replace(/<\/td>/gi, '</th>');
    const newFirstTr = `<tr>${newFirstTrInner}</tr>`;
    return `<table${attrs}>${inner.replace(firstTrFull, newFirstTr)}</table>`;
  });
}

// Framer's editor lets users hit Shift+Enter inside a bold span, producing
// HTML like `<strong>X<br></strong>`. Turndown converts that to broken
// Markdown — `**X  \n**Y` — because Markdown bold can't span hard breaks.
// Lift the <br> outside the inline tag so turndown sees well-formed input:
//   <strong>X<br></strong>     → <strong>X</strong><br>
//   <strong>X<br>Y</strong>    → <strong>X</strong><br><strong>Y</strong>
//   <em>X<br><br>Y</em>        → <em>X</em><br><br><em>Y</em>
function liftLineBreaksOutOfInline(html, stats) {
  return html.replace(/<(strong|em)>([\s\S]*?)<\/\1>/gi, (full, tag, inner) => {
    if (!/<br\s*\/?>/i.test(inner)) return full;
    if (stats) stats.brLiftFixes++;
    const segments = inner.split(/(<br\s*\/?>)/gi);
    return segments
      .map((seg) => {
        if (/^<br\s*\/?>$/i.test(seg)) return seg;
        if (!seg.trim()) return '';
        return `<${tag}>${seg}</${tag}>`;
      })
      .join('');
  });
}

// ----- turndown setup --------------------------------------------------------

const td = new TurndownService({
  headingStyle: 'atx',          // # Heading, not Heading\n=====
  codeBlockStyle: 'fenced',     // ```lang ... ```
  bulletListMarker: '-',
  emDelimiter: '_',
});
td.remove(['style', 'script']);

// GitHub-Flavored Markdown adds rules for tables, strikethrough, task lists,
// and autolinks. Astro's MDX pipeline (with the default remark-gfm plugin)
// understands the resulting Markdown natively.
td.use(gfm);

// Treat empty paragraphs (Framer artifact) as nothing
td.addRule('emptyParagraph', {
  filter: (node) => node.nodeName === 'P' && !node.textContent.trim() && !node.querySelector('img'),
  replacement: () => '',
});

// Convert YouTube iframe embeds into a <YouTube id="..." /> JSX component
// (registered in src/components/MDXComponents.ts). Catches both the standard
// embed URL form and youtu.be short links.
td.addRule('youtubeEmbed', {
  filter: (node) => {
    if (node.nodeName !== 'IFRAME') return false;
    const src = node.getAttribute('src') || '';
    return /(?:youtube(?:-nocookie)?\.com\/embed\/|youtu\.be\/)/i.test(src);
  },
  replacement: (_content, node) => {
    const src = node.getAttribute('src') || '';
    const m = src.match(/(?:youtube(?:-nocookie)?\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]+)/i);
    if (!m) return '';
    return `\n\n<YouTube id="${m[1]}" />\n\n`;
  },
});

// ----- frontmatter shape per target ------------------------------------------

function buildFrontmatterFor(decision, coverPath) {
  const fm = {
    title: decision.title,
    description: decision.description,
    date: decision.source_date,
  };
  if (coverPath) fm.image = coverPath;

  const target = decision.target_collection;
  if (target === 'blog') {
    if (decision.author) fm.author = decision.author;
    const tags = decision.tags ? decision.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    if (tags.length) fm.tags = tags;
  } else if (target === 'work') {
    if (decision.client) fm.client = decision.client;
    if (decision.industry) fm.industry = decision.industry;
    if (decision.scope) fm.scope = decision.scope;
    if (decision.outcome) fm.outcome = decision.outcome;
    if (decision.featured === 'true' || decision.featured === 'TRUE') fm.featured = true;
  } else if (target === 'training') {
    if (decision.audience) fm.audience = decision.audience;
    if (decision.format) fm.format = decision.format;
    if (decision.duration) fm.duration = decision.duration;
  }
  if (decision.draft === 'true' || decision.draft === 'TRUE') fm.draft = true;
  return fm;
}

// ----- path helpers ----------------------------------------------------------

const FRAMER_PREFIX = { Articles: '/customer-stories', Blog: '/blog' };
const TARGET_PREFIX = { blog: '/blog', work: '/work', training: '/training', products: '/products' };
const SKIP_TARGET   = { Articles: '/work', Blog: '/blog' };

// ----- main ------------------------------------------------------------------

const decisions = csvToObjects(parseCSV(readFileSync('migration/decisions.csv', 'utf8')));
const articlesBySlug = Object.fromEntries(
  csvToObjects(parseCSV(readFileSync('migration/exports/Articles.csv', 'utf8'))).map(r => [r.Slug, r])
);
const blogBySlug = Object.fromEntries(
  csvToObjects(parseCSV(readFileSync('migration/exports/Blog.csv', 'utf8'))).map(r => [r.Slug, r])
);

function getSourceRow(d) {
  return d.source_collection === 'Articles' ? articlesBySlug[d.source_slug] : blogBySlug[d.source_slug];
}

// Build cross-link URL map: every old Framer URL → its new local path. Used
// to rewrite hrefs inside post bodies so internal cross-references point at
// the canonical new URL instead of relying on a redirect hop.
const URL_REWRITES = {};
for (const d of decisions) {
  const oldRel = `${FRAMER_PREFIX[d.source_collection]}/${d.source_slug}`;
  const oldAbs = `https://www.nuefunnel.com${oldRel}`;
  const newPath = d.target_collection === 'skip'
    ? SKIP_TARGET[d.source_collection]
    : `${TARGET_PREFIX[d.target_collection]}/${d.new_slug || d.source_slug}`;
  URL_REWRITES[oldAbs] = newPath;
  URL_REWRITES[oldRel] = newPath;
}

function rewriteCrossLinks(html) {
  return html.replace(/(<a\s[^>]*href=["'])([^"']+)(["'])/gi, (_, pre, url, post) => {
    return pre + (URL_REWRITES[url] || url) + post;
  });
}

const stats = { written: 0, skipped: 0, imagesOk: 0, imagesCached: 0, imagesFailed: 0, crossLinksRewritten: 0, brLiftFixes: 0, tableHeaderPromotions: 0 };
const redirects = [];

for (const d of decisions) {
  const oldPath = `${FRAMER_PREFIX[d.source_collection]}/${d.source_slug}`;

  if (d.target_collection === 'skip') {
    redirects.push({ from: oldPath, to: SKIP_TARGET[d.source_collection], code: 301, kind: 'skip' });
    stats.skipped++;
    console.log(`[skip] ${d.source_slug} → ${SKIP_TARGET[d.source_collection]}`);
    continue;
  }

  const source = getSourceRow(d);
  if (!source) {
    console.warn(`! no source row for ${d.source_collection}/${d.source_slug}, skipping`);
    continue;
  }

  const target = d.target_collection;
  const finalSlug = d.new_slug || d.source_slug;
  const newPath = `${TARGET_PREFIX[target]}/${finalSlug}`;
  const imgDir = `public/images/uploads/migrated/${d.source_collection.toLowerCase()}/${finalSlug}`;

  // Cover image
  let coverWebPath = '';
  if (source.Image) {
    const ext = extFromUrl(source.Image);
    const dest = `${imgDir}/cover.${ext}`;
    try {
      const r = await downloadImage(source.Image, dest);
      coverWebPath = '/' + dest.replace(/^public\//, '');
      if (r.cached) stats.imagesCached++; else stats.imagesOk++;
    } catch (e) {
      console.warn(`  ! cover image failed (${finalSlug}): ${e.message}`);
      coverWebPath = source.Image;
      stats.imagesFailed++;
    }
  }

  // Inline body images
  const html = source.Content || '';
  const inlineUrls = extractInlineImageUrls(html);
  const urlMap = {};
  let idx = 1;
  for (const url of inlineUrls) {
    if (url === source.Image) continue; // already downloaded as cover
    const ext = extFromUrl(url);
    const dest = `${imgDir}/image-${idx}.${ext}`;
    try {
      const r = await downloadImage(url, dest);
      urlMap[url] = '/' + dest.replace(/^public\//, '');
      if (r.cached) stats.imagesCached++; else stats.imagesOk++;
    } catch (e) {
      console.warn(`  ! inline image ${idx} failed (${finalSlug}): ${e.message}`);
      urlMap[url] = url; // keep original
      stats.imagesFailed++;
    }
    idx++;
  }

  // Rewrite cross-post links in HTML before turndown converts them.
  for (const oldUrl of Object.keys(URL_REWRITES)) {
    if (html.includes(`href="${oldUrl}"`) || html.includes(`href='${oldUrl}'`)) stats.crossLinksRewritten++;
  }
  let processedHtml = rewriteCrossLinks(html);
  processedHtml = rewriteImageUrls(processedHtml, urlMap);
  processedHtml = liftLineBreaksOutOfInline(processedHtml, stats);
  processedHtml = ensureTableHeader(processedHtml, stats);

  // HTML → Markdown
  const markdown = td.turndown(processedHtml).trim();

  // Frontmatter + write
  const fm = buildFrontmatterFor(d, coverWebPath);
  const mdxPath = `src/content/${target}/${finalSlug}.mdx`;
  mkdirSync(dirname(mdxPath), { recursive: true });
  writeFileSync(mdxPath, `${buildFrontmatter(fm)}\n\n${markdown}\n`, 'utf8');

  stats.written++;
  console.log(`[${target}] ${finalSlug}  (${inlineUrls.length} inline imgs)`);

  // Redirect if path changed
  if (oldPath !== newPath) {
    const kind = (FRAMER_PREFIX[d.source_collection] !== TARGET_PREFIX[target] && d.new_slug)
      ? 'route+slug'
      : (FRAMER_PREFIX[d.source_collection] !== TARGET_PREFIX[target] ? 'route' : 'slug');
    redirects.push({ from: oldPath, to: newPath, code: 301, kind });
  }
}

// ----- write _redirects ------------------------------------------------------

const header = `# Cloudflare Pages redirects and rewrites
# Auto-generated by migration/scripts/migrate.mjs from migration/decisions.csv.
# If you need to change these, edit decisions.csv and re-run the migrate pass.
`;
const body = redirects.map(r => `${r.from} ${r.to} ${r.code}`).join('\n');
writeFileSync('public/_redirects', `${header}\n${body}\n`, 'utf8');

// ----- summary ---------------------------------------------------------------

const byKind = redirects.reduce((acc, r) => { acc[r.kind] = (acc[r.kind] || 0) + 1; return acc; }, {});

console.log('');
console.log('=== Migration complete ===');
console.log(`MDX files written:     ${stats.written}`);
console.log(`Skipped (skip target): ${stats.skipped}`);
console.log(`Images downloaded:     ${stats.imagesOk}`);
console.log(`Images cached (skip):  ${stats.imagesCached}`);
console.log(`Images failed:         ${stats.imagesFailed}`);
console.log(`Cross-links rewritten: ${stats.crossLinksRewritten}`);
console.log(`Bold/italic <br> fixes:${stats.brLiftFixes}`);
console.log(`Table headers promoted:${stats.tableHeaderPromotions}`);
console.log(`Redirects emitted:     ${redirects.length}`);
for (const [k, n] of Object.entries(byKind)) console.log(`  ${k.padEnd(12)} ${n}`);
console.log('');
console.log('Next: run `npm run build` (or `npx astro check`) to validate, then `npm run dev`.');
