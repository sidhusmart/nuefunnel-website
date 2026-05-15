// migration/scripts/verify-decisions.mjs
//
// Reads a decisions CSV (default: migration/decisions_updated.csv), auto-
// detects whether it's comma- or semicolon-delimited (Numbers exports use
// `;` in many locales), strips a leading BOM if present, validates every
// row against its target collection's schema, and prints a structured
// report.
//
// With --write, also rewrites migration/decisions.csv as a canonical
// comma-delimited file once everything looks clean.
//
// Usage:
//   node migration/scripts/verify-decisions.mjs                    # verify only
//   node migration/scripts/verify-decisions.mjs <path>             # custom input
//   node migration/scripts/verify-decisions.mjs --write            # verify + rewrite decisions.csv
//   node migration/scripts/verify-decisions.mjs <path> --write     # both

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ----- args ------------------------------------------------------------------

const argv = process.argv.slice(2);
const shouldWrite = argv.includes('--write');
const inputPath = argv.find((a) => !a.startsWith('--')) || 'migration/decisions_updated.csv';

// ----- delimiter-aware CSV parser/writer -------------------------------------

function detectDelimiter(headerLine) {
  // count commas vs semicolons outside quoted regions on the first line
  let comma = 0, semi = 0, inQuotes = false;
  for (let i = 0; i < headerLine.length; i++) {
    const c = headerLine[i];
    if (c === '"') { inQuotes = !inQuotes; continue; }
    if (inQuotes) continue;
    if (c === ',') comma++;
    else if (c === ';') semi++;
  }
  return semi > comma ? ';' : ',';
}

function parseCSV(text, delim) {
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
    if (c === delim) { row.push(field); field = ''; continue; }
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
  return rows.map((r) => r.map(csvEscape).join(',')).join('\n') + '\n';
}

// ----- read & parse ----------------------------------------------------------

const raw = readFileSync(resolve(inputPath), 'utf8').replace(/^﻿/, ''); // strip BOM
const firstLineEnd = raw.indexOf('\n');
const headerLine = firstLineEnd === -1 ? raw : raw.slice(0, firstLineEnd);
const delim = detectDelimiter(headerLine);
const rows = parseCSV(raw, delim);

if (rows.length < 2) {
  console.error(`No data rows found in ${inputPath}`);
  process.exit(1);
}

const header = rows[0];
const dataRows = rows.slice(1).filter((r) => r.some((cell) => cell !== ''));

const col = (name) => header.indexOf(name);
const get = (row, name) => {
  const idx = col(name);
  return idx === -1 ? '' : (row[idx] ?? '').trim();
};

console.log(`Input:           ${inputPath}`);
console.log(`Delimiter:       ${delim === ';' ? 'semicolon (;)' : 'comma (,)'}`);
console.log(`Columns:         ${header.length}`);
console.log(`Data rows:       ${dataRows.length}`);
console.log('');

// ----- validation ------------------------------------------------------------

const VALID_TARGETS = ['blog', 'work', 'training', 'products', 'skip'];
const REQUIRED_NONEMPTY = {
  blog:     ['description'],
  work:     ['description'],
  training: ['description'],
  products: ['description'],
  skip:     [],
};
const RECOMMENDED = {
  work: ['client', 'industry', 'scope', 'outcome'],
  training: ['audience', 'format', 'duration'],
};
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const errors = [];
const warnings = [];
const finalSlugsByTarget = new Map(); // target -> Map<finalSlug, source_slug[]>
const targetCounts = { blog: 0, work: 0, training: 0, products: 0, skip: 0 };

for (let i = 0; i < dataRows.length; i++) {
  const r = dataRows[i];
  const ctx = `row ${i + 2}`; // +2 because: header is row 1, dataRows[0] is row 2
  const slug = get(r, 'source_slug');
  const newSlug = get(r, 'new_slug');
  const target = get(r, 'target_collection');
  const title = get(r, 'title');

  if (!title) errors.push(`${ctx}: title is blank`);
  if (!slug) errors.push(`${ctx}: source_slug is blank`);

  if (!target) {
    errors.push(`${ctx} (${slug}): target_collection is blank`);
    continue;
  }
  if (!VALID_TARGETS.includes(target)) {
    errors.push(`${ctx} (${slug}): invalid target_collection "${target}" — must be one of ${VALID_TARGETS.join(', ')}`);
    continue;
  }

  targetCounts[target]++;

  // new_slug validity
  if (newSlug) {
    if (!SLUG_RE.test(newSlug)) {
      errors.push(`${ctx} (${slug}): new_slug "${newSlug}" doesn't match slug pattern (lowercase a-z0-9 separated by single hyphens)`);
    }
  }

  // required fields per target
  for (const req of REQUIRED_NONEMPTY[target]) {
    if (!get(r, req)) {
      errors.push(`${ctx} (${slug}): missing required "${req}" for target=${target}`);
    }
  }

  // recommended fields per target — warn only
  if (RECOMMENDED[target]) {
    const blank = RECOMMENDED[target].filter((f) => !get(r, f));
    if (blank.length) {
      warnings.push(`${ctx} (${slug}): no value for ${blank.join(', ')} (optional but recommended for ${target})`);
    }
  }

  // boolean-ish columns
  for (const boolField of ['featured', 'draft']) {
    const v = get(r, boolField);
    if (v && !['true', 'false', 'TRUE', 'FALSE'].includes(v)) {
      errors.push(`${ctx} (${slug}): "${boolField}" must be true/false, got "${v}"`);
    }
  }

  // final slug uniqueness check within target collection
  if (target !== 'skip') {
    const finalSlug = newSlug || slug;
    if (!finalSlugsByTarget.has(target)) finalSlugsByTarget.set(target, new Map());
    const bucket = finalSlugsByTarget.get(target);
    if (!bucket.has(finalSlug)) bucket.set(finalSlug, []);
    bucket.get(finalSlug).push(slug);
  }
}

// duplicate-slug check
for (const [target, bucket] of finalSlugsByTarget) {
  for (const [final, sources] of bucket) {
    if (sources.length > 1) {
      errors.push(`collision: target=${target}, final_slug="${final}" produced by ${sources.length} source rows: ${sources.join(', ')}`);
    }
  }
}

// ----- redirect preview ------------------------------------------------------

const FRAMER_PREFIX = { Articles: '/customer-stories', Blog: '/blog' };
const TARGET_PREFIX = { blog: '/blog', work: '/work', training: '/training', products: '/products' };
const SKIP_TARGET = { Articles: '/work', Blog: '/blog' };

const redirects = [];
for (const r of dataRows) {
  const sourceCol = get(r, 'source_collection');
  const slug = get(r, 'source_slug');
  const newSlug = get(r, 'new_slug');
  const target = get(r, 'target_collection');
  const oldPath = `${FRAMER_PREFIX[sourceCol]}/${slug}`;

  if (target === 'skip') {
    redirects.push({ from: oldPath, to: SKIP_TARGET[sourceCol], kind: 'skip→index' });
    continue;
  }
  if (!VALID_TARGETS.includes(target) || !TARGET_PREFIX[target]) continue;

  const finalSlug = newSlug || slug;
  const newPath = `${TARGET_PREFIX[target]}/${finalSlug}`;
  if (oldPath !== newPath) {
    const kind = (FRAMER_PREFIX[sourceCol] !== TARGET_PREFIX[target] && newSlug)
      ? 'route+slug'
      : (FRAMER_PREFIX[sourceCol] !== TARGET_PREFIX[target] ? 'route only' : 'slug only');
    redirects.push({ from: oldPath, to: newPath, kind });
  }
}

// ----- report ----------------------------------------------------------------

console.log('Target distribution:');
for (const t of VALID_TARGETS) {
  if (targetCounts[t]) console.log(`  ${t.padEnd(10)} ${targetCounts[t]}`);
}
console.log('');

console.log(`Redirects that will be emitted: ${redirects.length}`);
const byKind = redirects.reduce((acc, r) => { acc[r.kind] = (acc[r.kind] || 0) + 1; return acc; }, {});
for (const [k, n] of Object.entries(byKind)) console.log(`  ${k.padEnd(12)} ${n}`);
console.log('');

if (errors.length) {
  console.log(`ERRORS (${errors.length}) — must fix before --write:`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  console.log('');
} else {
  console.log('No errors. ✓');
  console.log('');
}

if (warnings.length) {
  console.log(`Warnings (${warnings.length}) — optional but worth checking:`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
  console.log('');
}

// ----- optional write to canonical decisions.csv -----------------------------

if (shouldWrite) {
  if (errors.length) {
    console.error('Refusing to --write while errors are unresolved.');
    process.exit(1);
  }
  // Reuse the same header order as the input. Re-emit cleanly with comma delim.
  const outRows = [header, ...dataRows];
  const outPath = resolve('migration/decisions.csv');
  writeFileSync(outPath, rowsToCSV(outRows), 'utf8');
  console.log(`Wrote canonical comma-delimited file to: ${outPath}`);
} else {
  console.log('Run again with --write to canonicalize into migration/decisions.csv.');
}

process.exit(errors.length ? 1 : 0);
