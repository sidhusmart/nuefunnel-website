# nuefunnel Website

This repository contains the code for the static content website for www.nuefunnel.com

This follows a JAMStack pattern using **Astro** and is hosted directly on **Cloudflare Pages**.

## 🚀 Tech Stack

- **Framework:** [Astro](https://astro.build/) - Modern static site generator
- **Styling:** [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Content:** MDX (Markdown + JSX) with Astro Content Collections
- **CMS:** [Decap CMS](https://decapcms.org/) (formerly Netlify CMS) - Git-based CMS
- **Deployment:** [Cloudflare Pages](https://pages.cloudflare.com/)

## 📁 Project Structure

```
nuefunnel-website/
├── public/
│   ├── admin/              # Decap CMS admin interface
│   │   ├── index.html
│   │   └── config.yml
│   ├── images/             # Static images
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
├── functions/              # Cloudflare Pages Functions
│   └── oauth/              # OAuth proxy for Decap CMS
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

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your GitHub OAuth credentials (see [Decap CMS Setup](#-decap-cms-setup) below).

4. **Start the development server:**
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

## 📝 Content Management

### Using Decap CMS

1. **Access the CMS:**
   - Local: `http://localhost:4321/admin`
   - Production: `https://www.nuefunnel.com/admin`

2. **Authentication:**
   - Log in with your GitHub account
   - You need write access to the repository

3. **Creating Content:**
   - Navigate to the collection (Blog, Customer Stories, Products)
   - Click "New [Collection Name]"
   - Fill in the fields
   - Save and publish

### Manual Content Creation

You can also create content manually:

1. **Create a new MDX file** in the appropriate collection folder:
   ```
   src/content/blog/my-new-post.mdx
   ```

2. **Add frontmatter and content:**
   ```mdx
   ---
   title: "My New Post"
   description: "A brief description"
   date: 2025-01-17
   author: "Your Name"
   tags: ["API", "Developer Experience"]
   ---

   # Your content here

   Write your post content using Markdown or MDX.
   ```

## 🔐 Decap CMS Setup

Decap CMS uses GitHub for authentication and storage. Here's how to set it up:

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name:** nuefunnel CMS
   - **Homepage URL:** `https://www.nuefunnel.com`
   - **Authorization callback URL:** `https://www.nuefunnel.com/oauth/callback`
4. Save and note your **Client ID** and **Client Secret**

### 2. Configure Cloudflare Pages Environment Variables

1. Go to your Cloudflare Pages project
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `GITHUB_CLIENT_ID`: Your GitHub OAuth Client ID
   - `GITHUB_CLIENT_SECRET`: Your GitHub OAuth Client Secret
4. Save and redeploy

### 3. Update Decap CMS Config

Edit `public/admin/config.yml` and update:
- `repo`: Your GitHub username/repo
- `base_url`: Your Cloudflare Pages URL (for OAuth)

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

3. **Add environment variables** (see Decap CMS Setup above)

4. **Deploy:**
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
3. Add the collection to `public/admin/config.yml`
4. Create listing and detail pages

## 📊 Analytics (Optional)

To add analytics, update `src/layouts/Layout.astro` with your analytics provider's script.

## 🐛 Troubleshooting

### Build Errors

- **"Cannot find module"**: Run `npm install`
- **TypeScript errors**: Run `npm run astro check`
- **Tailwind not working**: Ensure `global.css` is imported in Layout

### Decap CMS Issues

- **Cannot authenticate**: Check GitHub OAuth settings and environment variables
- **Changes not saving**: Ensure GitHub permissions are correct
- **404 on /admin**: Check that files exist in `public/admin/`

### Cloudflare Pages Issues

- **Build fails**: Check build logs for errors
- **Functions not working**: Verify environment variables are set
- **OAuth not working**: Ensure callback URL matches GitHub OAuth app settings

## 📚 Resources

- [Astro Documentation](https://docs.astro.build/)
- [Decap CMS Documentation](https://decapcms.org/docs/)
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
