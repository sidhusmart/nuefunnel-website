# nuefunnel Website

This repository contains the code for the static content website for www.nuefunnel.com

This follows a JAMStack pattern using **Astro** and is hosted directly on **Cloudflare Pages**.

## 🚀 Tech Stack

- **Framework:** [Astro](https://astro.build/) - Modern static site generator
- **Styling:** [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Content:** MDX (Markdown + JSX) with Astro Content Collections
- **Editing:** Direct on GitHub (via [github.dev](https://github.dev) for web-based editing) — see [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Deployment:** [Cloudflare Pages](https://pages.cloudflare.com/)

## 📁 Project Structure

```
nuefunnel-website/
├── public/
│   ├── images/             # Static images (including uploads/ for content images)
│   ├── robots.txt
│   └── favicon.svg
├── src/
│   ├── components/         # Reusable Astro components
│   │   ├── Header.astro
│   │   └── Footer.astro
│   ├── content/            # Content Collections
│   │   ├── blog/           # Blog posts (MDX)
│   │   ├── customer-stories/
│   │   ├── products/
│   │   └── config.ts       # Collection schemas
│   ├── layouts/
│   │   └── Layout.astro    # Base layout with SEO
│   ├── pages/              # File-based routing
│   │   ├── index.astro     # Homepage
│   │   ├── blog/
│   │   ├── customer-stories/
│   │   └── products.astro
│   └── styles/
│       └── global.css      # Global styles + Tailwind
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
└── package.json
```

## 🛠️ Local Development

### Prerequisites

- Node.js 18+ and npm
- Git

### Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd nuefunnel-website
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The site will be available at `http://localhost:4321`

### Available Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start development server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview built site locally |
| `npm run astro` | Run Astro CLI commands |

## 📝 Editing Content

All content lives as `.mdx` files in `src/content/{blog,customer-stories,products}/`. There is no separate CMS — the repo *is* the CMS, and editing happens directly on GitHub (recommended via [github.dev](https://github.dev) for a web-based VS Code experience).

Each collection has a `_template.mdx` file (Astro auto-excludes `_`-prefixed files) that should be copied as the starting point for new content.

For the step-by-step editing workflow (branch → commit → Cloudflare preview → PR → merge), see **[CONTRIBUTING.md](./CONTRIBUTING.md)**.

## 🚀 Deployment

### Cloudflare Pages Setup

1. **Connect your GitHub repository:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to **Workers & Pages** → **Create application** → **Pages**
   - Connect your GitHub account and select the repository

2. **Configure build settings:**
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** 18 or higher

3. **Deploy:**
   - Click "Save and Deploy"
   - Cloudflare will automatically build and deploy your site
   - Future commits to the main branch will trigger automatic deployments

### Custom Domain

1. Go to your Cloudflare Pages project settings
2. Navigate to **Custom domains**
3. Add your domain (`www.nuefunnel.com`)
4. Update DNS settings as instructed

## 🎨 Customization

### Design System

The site uses TailwindCSS with a custom theme defined in `tailwind.config.mjs`:

- **Primary color:** `#6b658c` (purple)
- **Accent color:** `#09f` (blue)
- **Font:** Inter (loaded from Google Fonts)
- **Breakpoints:** Mobile (390px), Tablet (810px), Desktop (1200px)

### Adding Components

Create new components in `src/components/`:

```astro
---
// src/components/MyComponent.astro
export interface Props {
  title: string;
}

const { title } = Astro.props;
---

<div class="my-component">
  <h2>{title}</h2>
</div>
```

### SEO

SEO metadata is configured in the base layout (`src/layouts/Layout.astro`). Each page can override:

- `title`: Page title
- `description`: Meta description
- `image`: Open Graph image
- `type`: OpenGraph type (website/article)

## 🔍 Content Collections

Content Collections provide type-safe content with automatic schema validation.

### Schema Definition

See `src/content/config.ts` for collection schemas.

### Adding a New Collection

1. Create a new folder in `src/content/`
2. Define the schema in `src/content/config.ts`
3. Create listing and detail pages
4. Add a `_template.mdx` to the new folder as a starting point for new entries

## 📊 Analytics (Optional)

To add analytics, update `src/layouts/Layout.astro` with your analytics provider's script.

## 🐛 Troubleshooting

### Build Errors

- **"Cannot find module"**: Run `npm install`
- **TypeScript errors**: Run `npm run astro check`
- **Tailwind not working**: Ensure `global.css` is imported in Layout

### Cloudflare Pages Issues

- **Build fails**: Check build logs for errors
- **Preview deploy missing on PR**: Verify Cloudflare Pages is connected to the GitHub repo and branch deploys are enabled

## 📚 Resources

- [Astro Documentation](https://docs.astro.build/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

## 📄 License

Copyright © 2025 nuefunnel. All rights reserved.

## 🤝 Contributing

For internal team members:

1. Create a feature branch
2. Make your changes
3. Test locally with `npm run dev` and `npm run build`
4. Submit a pull request
5. After approval, merge to main (triggers automatic deployment)

## 📞 Support

For questions or issues, contact the development team.
