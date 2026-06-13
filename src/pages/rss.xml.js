import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

// Blog RSS/Atom feed. Discoverable via the <link rel="alternate"> tag in
// Layout.astro and served at /rss.xml.
export async function GET(context) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  return rss({
    title: 'nuefunnel — Blog',
    description: 'Writing from the nuefunnel studio.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.slug}/`,
    })),
  });
}
