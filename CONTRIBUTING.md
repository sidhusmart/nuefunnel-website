# Editing content on nuefunnel.com

This guide is for editing blog posts, customer stories, and product pages on the nuefunnel website without needing a local development setup. All you need is a GitHub account and a browser.

---

## What this repo is

The nuefunnel website is built with Astro. Every blog post, customer story, and product page is an `.mdx` file (Markdown with optional embedded components) stored in `src/content/`. When you commit a change to a branch, Cloudflare Pages automatically deploys a preview at a unique URL. When the branch merges to `main`, the change goes live at nuefunnel.com.

There's no separate CMS to log into. The repo IS the CMS, and GitHub's web editor is the editing UI.

---

## Editing in github.dev

`github.dev` is a free, web-based version of VS Code that runs entirely in your browser. To open it:

1. Navigate to the repo on github.com: `github.com/sidhusmart/nuefunnel-website`
2. Press the `.` key (period)
3. The full repo opens in a VS Code-style editor with file tree on the left

That's it. No installation, no setup. Sign in with your GitHub account when prompted (only happens once per session).

---

## Creating a new post

Each content type has a `_template.mdx` file that acts as the starting point. Don't edit `_template.mdx` directly — copy it.

1. In the file tree, expand `src/content/`. You'll see three folders:
   - `blog/` — long-form articles
   - `customer-stories/` — case studies
   - `products/` — product pages
2. Open the relevant folder. You'll see existing posts and a `_template.mdx` file.
3. Right-click `_template.mdx` → **Copy**, then right-click the folder → **Paste**. A copy named something like `_template copy.mdx` appears.
4. Right-click the copy → **Rename** → give it a descriptive kebab-case name (lowercase, hyphens, no spaces). **This filename becomes the URL slug.** For example, `building-with-claude.mdx` becomes `nuefunnel.com/blog/building-with-claude`.
5. Open the new file. The frontmatter at the top (between the `---` lines) has comments explaining each field. Update at minimum the `title`, `description`, and `date`.
6. Write the body below the closing `---`.

---

## Publishing: branch → commit → preview → PR → merge

When you make changes, you don't edit `main` directly. You create a branch, commit your changes there, wait for a preview deploy, then open a pull request (PR) to merge into `main`.

### 1. Create a new branch for your edit

Look at the **bottom-left of the github.dev window**. You'll see `main` next to a small branching icon. Click it. A picker opens at the top of the window. Choose **➕ Create new branch from "main"...** and name it something descriptive — e.g. `content/new-blog-post-about-x` (slashes are allowed). Press Enter. The bottom-left now shows your new branch name. Any unsaved edits move with you.

### 2. Open the Source Control panel

In the left activity bar (the vertical strip of icons), click the **branching icon** (three nodes connected). Keyboard alternative: `Cmd + Shift + G` then `G` again. A panel opens listing your changed files under **Changes**.

### 3. Review your changes (optional)

Click a filename in the Changes list to see a side-by-side diff. Catches typos before committing.

### 4. Stage the changes

Hover over each changed filename → a `+` icon appears. Click it. The file moves from "Changes" to "Staged Changes". Or click the `+` next to the **Changes** header to stage all at once.

### 5. Write a commit message

In the text box at the top of the Source Control panel, type a short description of what you changed — e.g. `Add blog post about X` or `Update intro paragraph in pricing story`.

### 6. Commit

Click the blue **Commit** button, or press `Cmd + Enter` in the message box. In github.dev, this commits *and* pushes in one step — your branch is now on GitHub.

### 7. Open a pull request

Three ways to get there, pick whichever is easiest:

- **Inside github.dev**: `Cmd + Shift + P` → type "Create Pull Request" → **GitHub Pull Requests: Create Pull Request**. A form opens.
- **On github.com**: open a new tab to the repo. A yellow banner appears: `<your-branch> had recent pushes — Compare & pull request`. Click it.
- **Direct URL**: `github.com/sidhusmart/nuefunnel-website/pull/new/<your-branch-name>`

Confirm the base is `main`, fill in a title (autofills from your commit message), and click **Create pull request**.

### 8. Wait for the Cloudflare preview deploy

On the PR page, scroll to the **Checks** section. A Cloudflare entry appears:
- First: yellow dot, `Deploying…`
- After ~30–90 seconds: green check, `Deployment successful`

Click **Details** on that row (or look in the right sidebar under **Deployments**) for the preview URL — something like `https://<hash>.nuefunnel-website.pages.dev`.

### 9. Open the preview URL and verify

You'll see the real rendered site with your changes — proper styling, real images, all components working. If anything's wrong, go back to github.dev and **repeat steps 4 → 5 → 6** (stage → message → commit). Don't open a new PR — the existing one follows your branch. Cloudflare rebuilds in ~60s.

### 10. Merge to production

When you're happy, on the PR page click the green **Merge pull request** button → **Confirm merge**. Optionally click **Delete branch** afterward. Cloudflare redeploys `main` → nuefunnel.com in another ~60s.

---

## Drafts

Want to save work-in-progress without it going live? Set `draft: true` in the frontmatter:

```yaml
---
title: "Half-finished post"
description: "..."
date: 2026-05-11
draft: true
---
```

The post will still be committed and visible in the repo, but won't appear in the public listing or be reachable by URL on nuefunnel.com. Flip it to `draft: false` when ready to publish.

---

## Images

1. Drag an image file from your desktop into the `public/images/uploads/` folder in github.dev's file tree. Use a descriptive, lowercase, hyphenated filename (e.g. `2026-q2-revenue-chart.png`, not `Screenshot 2025-11-21.png`).
2. Reference it in your MDX with the absolute path: `![Alt text describing the image](/images/uploads/your-image.png)`
3. Commit the image file along with your post.

The build automatically optimizes images: WebP variants at 400, 800, and 1200 widths. You don't need to do anything for this — just reference the original PNG/JPG.

**Heads up:** Images won't render in github.dev's Markdown preview pane (it can't resolve `/images/...` paths). They DO render correctly in the Cloudflare branch preview — use that to verify image placement.

---

## What the Markdown preview pane shows (and doesn't)

In github.dev, you can preview an `.mdx` file by opening it and pressing `Cmd + K V` (preview to the side). The preview is helpful but partial:

| Element | In the preview pane | In the Cloudflare branch preview |
|---------|---------------------|----------------------------------|
| Headings, paragraphs, lists, bold/italic | ✓ Yes | ✓ Yes |
| Links | ✓ Yes | ✓ Yes |
| Blockquotes | ✓ Yes | ✓ Yes |
| Tables | ✓ Yes | ✓ Yes |
| `/images/uploads/...` images | ✗ Broken in preview | ✓ Yes |
| Site styling (fonts, colours, layout) | ✗ Generic preview | ✓ Real site styling |

**Rule of thumb:** use the github.dev preview to check structure and prose. Use the Cloudflare branch preview to check the final result.

---

## Asking for review

When your PR is ready for review, assign Sidharth as reviewer:

1. On the PR page, in the right sidebar, find **Reviewers** → click the gear icon → select `sidhusmart`.
2. He'll get a GitHub notification.
3. He'll comment, request changes (commit more to the same branch), or approve and merge.

---

## Getting unstuck

If something doesn't work the way this guide describes, or you get an error message you don't understand: take a screenshot, paste the URL of your branch or PR, and message Sidharth. The github.dev UI shifts occasionally and this guide may lag behind by a few weeks.
