# Agent Instructions for nuefunnel-website

This repository uses Astro + Tailwind and Cloudflare Pages.
Use these notes when building or editing.

## Issue Tracking (bd)
This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

### Quick Reference
```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Repo Layout
- `src/pages/` Astro routes
- `src/components/` reusable UI components (`PascalCase.astro`)
- `src/layouts/` shared layouts
- `src/content/` MDX content collections + schemas
- `src/styles/` global Tailwind CSS
- `public/` static assets and Decap CMS admin
- `functions/` Cloudflare Pages Functions (OAuth)
- `scripts/` Node scripts (image optimization)

## Build, Lint, Test
### Install
```bash
npm install
```

### Development
```bash
npm run dev         # http://localhost:4321
```

### Production build
```bash
npm run build       # optimize images + astro check + build
```

### Preview build
```bash
npm run preview
```

### Typecheck / diagnostics
```bash
npm run astro -- check
```

### Image optimization
```bash
npm run optimize:images
```

### Linting
- No ESLint/Prettier configured.
- Keep formatting consistent with existing files.

### Tests
- No unit/integration test runner configured.
- There is no single-test command; use `npm run astro -- check` for type checks.

## Code Style Guidelines
### General
- Use 2-space indentation.
- Use single quotes in JS/TS/astro scripts.
- Always include semicolons.
- Prefer `const`, use `let` only when reassigning.
- Use `async/await` for async flows.
- Keep functions small and focused.

### Imports
- Use ES modules everywhere.
- Order imports: external libs → internal aliases → relative.
- Keep import paths relative (no path aliases configured).

### Naming
- Components: `PascalCase.astro` and `PascalCase.ts`.
- Variables/functions: `camelCase`.
- Constants: `SCREAMING_SNAKE_CASE` only for true constants (rare).
- Content slugs/folders: kebab-case.

### Formatting
- Keep object/array trailing commas when multiline.
- Wrap long attributes across lines as in existing `.astro` files.
- Use template literals for class concatenation.

### Types
- TS is in `strict` mode (see `tsconfig.json`).
- Use explicit types for exported values where helpful.
- Favor `zod` schemas in content collections.

### Error Handling
- In Cloudflare functions, return `new Response(...)` with status.
- Guard required params early (e.g., missing OAuth code).
- For scripts, log meaningful errors and `process.exit(1)` on fatal failures.

## Astro Patterns
- Frontmatter goes between `---` blocks at top.
- Keep layout/page data in frontmatter and pass props to components.
- Use `<Layout>` wrapper with `title`/`description` props.
- Use `Astro.url` for route checks and conditional classes.

## Tailwind + CSS
- Use utility classes for layout/spacing; rely on `src/styles/global.css` for shared styles.
- Custom colors/fonts are defined in `tailwind.config.mjs`; reuse them.
- Prefer `@apply` in `global.css` for reusable patterns (`btn-primary`, `container-custom`).

## Content Collections (MDX)
- Content lives in `src/content/{blog,customer-stories,products}`.
- Follow schemas in `src/content/config.ts` (required fields: title, description, date).
- Use `draft: true` for unpublished content.

## Cloudflare Pages Functions
- Files live under `functions/` and export `onRequest`.
- Access secrets via `env` (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`).
- Avoid adding heavy dependencies here.

## Assets & Images
- Raw uploads: `public/images/uploads`.
- Optimized output: `public/images/optimized` + metadata JSON.
- Run `npm run optimize:images` before production builds if assets change.

## Cursor/Copilot Rules
- No `.cursor/rules`, `.cursorrules`, or `.github/copilot-instructions.md` found.

## Frontend Design Skill (Claude)
Source: `https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md`

### Intent
- Create distinctive, production-grade frontend interfaces with clear aesthetic direction.
- Avoid generic AI aesthetics and cookie-cutter layouts.

### Design Thinking
- Define purpose, tone, constraints, and differentiators before coding.
- Commit to a bold aesthetic (e.g., minimal, maximal, retro, brutalist).

### Aesthetic Guidelines
- Typography: favor distinctive font pairings over defaults.
- Color: cohesive palette with strong accents and CSS variables.
- Motion: deliberate animations (staggered reveals, hover states).
- Layout: asymmetry, overlap, and intentional spacing.
- Backgrounds: texture, gradients, shadows, and visual depth.

### Avoid
- Overused fonts (Inter, Roboto, Arial) and default gradients.
- Predictable components with no context-specific character.

## Landing the Plane (Session Completion)
**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**
1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
