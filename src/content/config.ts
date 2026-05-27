import { z, defineCollection } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    author: z.string().optional().default('nuefunnel Team'),
    image: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    draft: z.boolean().optional().default(false),
  }),
});

const workCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    client: z.string().optional(),
    industry: z.string().optional(),
    scope: z.string().optional(),
    outcome: z.string().optional(),
    image: z.string().optional(),
    featured: z.boolean().optional().default(false),
    draft: z.boolean().optional().default(false),
    // legacy field kept so older draft files still pass schema validation
    company: z.string().optional(),
  }),
});

const productsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    // Short category line shown under the name on /products and the home page.
    tagline: z.string().optional(),
    // One-sentence summary. Drives the condensed home-page highlight and the
    // page <meta> description; the full pitch lives in the MDX body.
    description: z.string(),
    // External "Visit" link — the product's own site acts as its detail page,
    // so there are no internal /products/[slug] routes.
    url: z.string().url().optional(),
    // "Built for" detail row on /products.
    audience: z.string().optional(),
    // "Pricing" detail row on /products.
    price: z.string().optional(),
    features: z.array(z.string()).optional().default([]),
    // Product logo/icon. Path under public/images/uploads/ (build-time
    // optimized). Rendered as a rounded-square tile on /products and the home
    // highlight; falls back to the product's initial letter when unset.
    logo: z.string().optional(),
    order: z.number().optional().default(0),
    draft: z.boolean().optional().default(false),
  }),
});

const trainingCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    audience: z.string().optional(),
    format: z.string().optional(),
    duration: z.string().optional(),
    date: z.coerce.date().optional(),
    image: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

// Founder/team profiles. A `data` collection (JSON entries) so the same source
// of truth feeds both the homepage hero and the About page, instead of being
// hardcoded — and drifting — in each page.
const teamCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    initials: z.string(),
    // Path under public/ that the build-time image optimizer can pick up.
    photo: z.string().optional(),
    // Display order; getCollection() makes no ordering guarantee.
    order: z.number().default(0),
    links: z.array(z.object({
      label: z.string(),
      href: z.string().url(),
    })).optional().default([]),
  }),
});

export const collections = {
  blog: blogCollection,
  work: workCollection,
  products: productsCollection,
  training: trainingCollection,
  team: teamCollection,
};
