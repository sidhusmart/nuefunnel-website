import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ── Sitemap lastmod map ─────────────────────────────────────────────────────
// Google honours <lastmod> (and ignores changefreq/priority), so we derive an
// accurate per-URL lastmod from each content entry's `date` frontmatter. Read
// at config-eval time — the sitemap integration's serialize() has no access to
// content collections itself. Listing pages get their newest child's date.
const contentBase = join(dirname(fileURLToPath(import.meta.url)), 'src/content');

function collectDates(collection, urlPrefix) {
  const dir = join(contentBase, collection);
  const map = {};
  let newest = null;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.mdx') || file.startsWith('_')) continue;
    const raw = readFileSync(join(dir, file), 'utf8');
    const m = raw.match(/^date:\s*["']?([0-9T:.+\-Z]+)["']?/m);
    if (!m) continue;
    const iso = new Date(m[1]).toISOString();
    map[`${urlPrefix}${file.replace(/\.mdx$/, '')}/`] = iso;
    if (!newest || iso > newest) newest = iso;
  }
  return { map, newest };
}

const blog = collectDates('blog', '/blog/');
const work = collectDates('work', '/work/');
const training = collectDates('training', '/training/');

const lastmodByPath = {
  ...blog.map,
  ...work.map,
  ...training.map,
  // Listing pages reflect their most recently dated entry.
  '/blog/': blog.newest,
  '/work/': work.newest,
  '/training/': training.newest,
  // Homepage tracks the freshest content anywhere on the site.
  '/': [blog.newest, work.newest, training.newest].filter(Boolean).sort().at(-1),
};

// https://astro.build/config
export default defineConfig({
  site: 'https://www.nuefunnel.com',
  integrations: [
    mdx(),
    sitemap({
      // The RSS endpoint is a feed, not a page — keep it out of the sitemap.
      filter: (page) => !page.endsWith('/rss.xml'),
      serialize(item) {
        const { pathname } = new URL(item.url);
        const lastmod = lastmodByPath[pathname];
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
    tailwind(),
    react(),
  ],
  output: 'static',
  build: {
    format: 'directory',
  },
});
