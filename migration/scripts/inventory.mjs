// migration/scripts/inventory.mjs
//
// Phase 1 of the Framer → Astro migration: read the two CSV exports under
// migration/exports/, emit a single migration/decisions.csv that the human
// fills in to drive Phase 2 (the actual content migrate pass).
//
// What this script does NOT do:
//   - convert HTML bodies to Markdown
//   - download Framer-hosted images
//   - write any .mdx files
//   - touch public/_redirects
// All of that lives in a separate migrate.mjs that runs after the human has
// filled in decisions.csv.
//
// Usage:  node migration/scripts/inventory.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ----- dependency-free CSV parser / writer -----------------------------------
// Framer's exports embed quoted, multi-line HTML in the Content column. A real
// CSV parser is mandatory here; line-by-line reading would split rows mid-body.

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; continue; }
        inQuotes = false;
        continue;
      }
      field += c;
      continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === ',') { row.push(field); field = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += c;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function csvEscape(value) {
  if (value == null) return '';
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function rowsToCSV(rows) {
  return rows.map(r => r.map(csvEscape).join(',')).join('\n') + '\n';
}

// ----- proposed shorter slugs for rows that warrant a rename -----------------
// Empty string in the output column means "no suggestion — current slug is fine."

const SLUG_SUGGESTIONS = {
  'minimax---a-new-flavour-of-consumer-internet-company-with-ai-branding': 'minimax-consumer-ai-company',
  'the-numbers-openai-won-t-show-you-(but-china-s-biggest-ai-company-just-did)': 'zhipu-ai-ipo-numbers',
  'veo3-vs-wan2-2-vs-sora2-zero-shot-video-generation-comparison': 'veo3-wan-sora-zero-shot-comparison',
  'from-language-barriers-to-local-ai-rebuilding-wacao-in-the-age-of-browser-intelligence': 'wacao-local-ai-browser-intelligence',
  'model-quantization-explained-run-ai-models-locally-on-your-laptop': 'model-quantization-local-llms',
  'glitch-tokens-explained-how-weird-text-strings-break-ai-models': 'glitch-tokens-explained',
  'how-to-spot-when-content-feels-artificial': 'spot-artificial-content',
  'prompting-paradigms-from-one-line-prompts-to-clue-and-reasoning-(carp)': 'prompting-paradigms-carp',
  'jagged-frontier-how-ai-shapes-the-future-of-work-(centaur-vs-cyborg)': 'jagged-frontier-centaur-vs-cyborg',
  'how-good-is-ai-translation-lessons-from-my-nlp-book-in-german-spanish': 'ai-translation-nlp-book-lessons',
  'how-i-used-ai-video-generation-for-my-hackathon-submission': 'ai-video-generation-hackathon',
  'ai-generated-podcasts-personalized-just-for-you': 'personalized-ai-podcasts',
  'faster-image-generation-how-flow-matching-and-lcm-unlock-real-time-ai-creativity': 'flow-matching-lcm-realtime-images',
  'llm-task-vectors-how-language-models-learn-new-tasks-on-the-fly': 'llm-task-vectors-explained',
  'ai-interpretability-and-safety-how-features-could-shape-the-future-of-llms': 'ai-interpretability-safety-features',
};

// ----- where each source CSV's posts lived on the live Framer site -----------

const FRAMER_ROUTE_PREFIX = {
  Articles: '/customer-stories',
  Blog: '/blog',
};

// ----- inventory pass --------------------------------------------------------

const SOURCES = [
  { label: 'Articles', path: 'migration/exports/Articles.csv' },
  { label: 'Blog',     path: 'migration/exports/Blog.csv' },
];

const COLUMNS = [
  // identification (auto-filled from source CSV; treat as read-only when annotating)
  'title',
  'source_collection',
  'source_slug',
  'framer_url',
  'source_date',
  'source_categories',
  'source_image',
  // decision (fill these in)
  'target_collection',   // blog | work | training | products | skip
  'slug_suggestion',     // informational only — copy into new_slug if accepted
  'new_slug',            // blank = preserve source_slug
  'description',         // required for every non-skip row (Zod-enforced at build)
  'draft',               // true | false (defaults false)
  // blog-only fields
  'author',
  'tags',                // comma-separated; e.g. "ai,product"
  // work-only fields
  'client',
  'industry',
  'scope',
  'outcome',
  'featured',            // true | false
  // training-only fields
  'audience',
  'format',
  'duration',
];

function buildRow(sourceLabel, csvRow, header) {
  const get = (name) => {
    const idx = header.indexOf(name);
    return idx === -1 ? '' : (csvRow[idx] ?? '');
  };

  const slug = get('Slug').trim();
  const prefix = FRAMER_ROUTE_PREFIX[sourceLabel];

  const data = {
    title: get('Title'),
    source_collection: sourceLabel,
    source_slug: slug,
    framer_url: `https://www.nuefunnel.com${prefix}/${slug}`,
    source_date: get('Date'),
    source_categories: get('Categories'),
    source_image: get('Image'),
    target_collection: '',
    slug_suggestion: SLUG_SUGGESTIONS[slug] ?? '',
    new_slug: '',
    description: '',
    draft: '',
    author: '',
    tags: '',
    client: '',
    industry: '',
    scope: '',
    outcome: '',
    featured: '',
    audience: '',
    format: '',
    duration: '',
  };

  return COLUMNS.map((c) => data[c]);
}

const allRows = [COLUMNS];
const stats = { Articles: 0, Blog: 0, suggestions: 0 };

for (const { label, path } of SOURCES) {
  const text = readFileSync(resolve(path), 'utf8');
  const rows = parseCSV(text);
  if (rows.length === 0) {
    console.warn(`${path}: empty file, skipping`);
    continue;
  }
  const header = rows[0];
  for (const row of rows.slice(1)) {
    if (row.every((cell) => cell === '')) continue; // skip blank trailing rows
    const out = buildRow(label, row, header);
    allRows.push(out);
    stats[label]++;
    if (out[COLUMNS.indexOf('slug_suggestion')] !== '') stats.suggestions++;
  }
}

const outPath = resolve('migration/decisions.csv');
writeFileSync(outPath, rowsToCSV(allRows), 'utf8');

console.log(`Wrote ${outPath}`);
console.log(`  Articles rows: ${stats.Articles}`);
console.log(`  Blog rows:     ${stats.Blog}`);
console.log(`  Total rows:    ${stats.Articles + stats.Blog}`);
console.log(`  Rows with a slug_suggestion populated: ${stats.suggestions}`);
console.log('');
console.log('Next: open migration/decisions.csv in a spreadsheet and fill in');
console.log('target_collection / description / target-specific fields. Then we run');
console.log('the migrate pass.');
