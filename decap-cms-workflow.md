# Decap CMS — Implementation, Workflows & Security Findings

> Last updated: May 2026  
> Repository: `sidhusmart/nuefunnel-website`  
> Deployment: Cloudflare Pages · `https://nuefunnel.com`

---

## Part 1: Current Implementation

### 1.1 Overview

The site uses **Decap CMS** (formerly Netlify CMS) as its headless CMS. Decap is a git-based CMS — it has no standalone database or backend. All content is stored as MDX files directly in the GitHub repository. The CMS admin UI is a single-page application (SPA) served from `/admin`, and it reads and writes content via the GitHub API using an access token obtained through OAuth.

---

### 1.2 Authentication Flow

Authentication is handled by two **Cloudflare Pages Functions** that act as a server-side OAuth proxy for GitHub. This proxy is necessary because GitHub's CORS policy prevents a browser from exchanging an OAuth code for a token directly.

#### Files involved

| File | Route | Purpose |
|------|-------|---------|
| `functions/oauth/index.js` | `GET /oauth` | Initiates the GitHub OAuth flow |
| `functions/oauth/callback.js` | `GET /oauth/callback` | Exchanges the auth code for a token |
| `public/admin/index.html` | `/admin` | Decap CMS SPA shell |
| `public/admin/config.yml` | — | CMS configuration (backend, collections, OAuth settings) |

#### Step-by-step auth sequence

1. **User visits `/admin`** in their browser. The page loads the Decap CMS SPA from a CDN script tag:
   ```html
   <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
   ```

2. **User clicks "Login with GitHub"**. Decap opens `/oauth` in a popup window, per the `auth_endpoint: oauth` setting in `config.yml`.

3. **`functions/oauth/index.js` handles `GET /oauth`**. It constructs a GitHub OAuth authorization URL with:
   - `client_id` from the `GITHUB_CLIENT_ID` environment variable
   - `scope: repo,user`
   - `redirect_uri` pointing to `/oauth/callback` on the same origin
   
   It then issues a `302` redirect to `https://github.com/login/oauth/authorize`.

4. **GitHub shows the authorization page**. The user approves. GitHub redirects back to `/oauth/callback?code=<auth_code>`.

5. **`functions/oauth/callback.js` handles `GET /oauth/callback`**. It:
   - Reads the `code` query parameter
   - Makes a server-side `POST` to `https://github.com/login/oauth/access_token` with the `client_id`, `client_secret`, and `code`
   - Receives `{ access_token, token_type }` from GitHub
   - Reformats the token as `{ token, provider: "github" }` to match Decap's expected shape

6. **The callback page performs a `postMessage` handshake** with the parent Decap window:
   - Sends `"authorizing:github"` to `window.opener` with `"*"` as the target origin
   - Listens for a message back containing `"authorizing:github"`
   - On receipt, responds with `"authorization:github:success:" + JSON.stringify(token)` back to the sender's origin
   - Closes the popup after 1 second (with a 5-second hard-close fallback)

7. **Decap receives the token** via `postMessage`, stores it in memory/session, and uses it for all subsequent GitHub API calls (read content, commit changes, create branches).

#### Environment variables

| Variable | Stored in | Used by |
|----------|-----------|---------|
| `GITHUB_CLIENT_ID` | Cloudflare Pages env + local `.env` | `functions/oauth/index.js` |
| `GITHUB_CLIENT_SECRET` | Cloudflare Pages env only (never committed) | `functions/oauth/callback.js` |

The client secret is never sent to the browser. It is only used server-side inside the Cloudflare Function.

---

### 1.3 CMS Configuration

Defined in `public/admin/config.yml`:

```yaml
backend:
  name: github
  repo: sidhusmart/nuefunnel-website
  branch: main
  base_url: https://nuefunnel-website.pages.dev
  auth_endpoint: oauth

publish_mode: editorial_workflow

media_folder: "public/images/uploads"
public_folder: "/images/uploads"
```

Key points:
- **`backend: github`** — Decap writes content directly to GitHub via API, no intermediary.
- **`base_url`** — used by Decap to construct the full OAuth endpoint URL (`base_url + "/" + auth_endpoint`).
- **`publish_mode: editorial_workflow`** — enables the Draft → In Review → Ready → Published content state machine.

---

### 1.4 Content Collections

Three collections are configured in the CMS, each mapping to a folder of MDX files in the repository:

| Collection | CMS label | Folder | Key fields |
|------------|-----------|--------|------------|
| `blog` | Blog Posts | `src/content/blog/` | title, description, date, author, image, tags, draft |
| `customer-stories` | Customer Stories | `src/content/customer-stories/` | title, description, date, company, industry, featured, draft |
| `products` | Products | `src/content/products/` | title, description, price, features, order, draft |

All collections share a `draft: boolean` field. Astro's `getCollection()` calls filter out drafts at build time using `({ data }) => !data.draft`.

---

### 1.5 Editorial (Publishing) Workflow

`publish_mode: editorial_workflow` gives content a lifecycle managed through Git branches.

#### Content states

| State | What happens in Git |
|-------|---------------------|
| **Draft** | Decap creates a new branch `cms/[collection]/[slug]` and commits the MDX there |
| **In Review** | Content stays on the same branch; status metadata updated |
| **Ready** | Content stays on the same branch; marked approved |
| **Published** | Decap merges the branch into `main` via the GitHub API |

#### Cloudflare Pages preview deploys

Because Cloudflare Pages deploys every branch automatically, each draft on a `cms/*` branch gets its own preview URL (e.g., `cms-blog-my-post.nuefunnel-website.pages.dev`). This lets editors preview content in context before it is merged to production.

#### Media uploads

When an editor uploads an image via the CMS, it is committed to `public/images/uploads/`. The `scripts/optimize-images.mjs` script (run as part of `npm run build`) then processes those uploads into WebP variants at 400w, 800w, and 1200w using Sharp, outputting them to `public/images/optimized/`.

---

### 1.6 How the Site Consumes Content

Decap CMS never runs at request time on the live site. The CMS only commits MDX files to GitHub. Astro then:

1. Reads all MDX files at **build time** via Content Collections (`src/content/config.ts`)
2. Validates them against Zod schemas
3. Pre-renders all pages as static HTML into `dist/`
4. Cloudflare Pages serves the static files from its CDN edge

The CMS and the public website are entirely decoupled at runtime.

---

## Part 2: Security Findings — Codex Adversarial Review

> Review date: May 2026  
> Reviewer: Codex (adversarial mode)  
> Verdict: **needs-attention** — do not ship until critical and high findings are addressed

---

### Finding 1 — CRITICAL: OAuth callback can disclose the GitHub token to any opener origin

**File:** `functions/oauth/callback.js`, lines 10–82

The callback exchanges the authorization code, embeds the resulting token in the page, sends an initial `postMessage` to `window.opener` with `'*'` as the target origin, then listens for any message containing `"authorizing:github"` and replies to that sender's origin with the full token.

**Attack path (no MITM required):**
- A malicious site opens the GitHub OAuth authorize URL as a popup (with itself as the opener).
- The victim navigates to the popup and authorizes.
- GitHub redirects to `/oauth/callback` with a valid code.
- The callback page sends the initial handshake to `window.opener` with `'*'` — the attacker's page is the opener.
- The attacker's page responds with `"authorizing:github"`.
- The callback sends `"authorization:github:success:<token>"` back to the attacker's origin.
- The attacker now holds a `repo,user`-scoped GitHub token with write access to the repository.

**Root cause:** No OAuth `state` parameter is generated or validated, and the `postMessage` target origin is `'*'` rather than a bound allowlist.

**Recommendation:** Generate a cryptographically random `state` nonce at the start of the flow, store it in the session, validate it on callback, and reject mismatches. Only `postMessage` the token to the exact expected admin origin (e.g., `https://nuefunnel.com`), verified against both `e.origin` and `e.source`.

---

### Finding 2 — HIGH: Access token logged in cleartext in the browser console

**File:** `functions/oauth/callback.js`, lines 57–65

The callback success page contains multiple `console.log` statements that output the full token object and the complete `"authorization:github:success:<token>"` message string.

**Risk:** Browser console output is accessible to any browser extension with `tabs` or `debugger` permissions, screen-share or recording sessions, support tooling, and retained DevTools logs. A `repo,user`-scoped GitHub token logged this way can be captured without any network interception.

**Recommendation:** Remove all `console.log` statements that contain token data. If diagnostics are needed, log only non-sensitive identifiers (e.g., `"OAuth callback: success"` with no token value).

---

### Finding 3 — HIGH: Admin page loads token-handling code from a mutable CDN URL with no integrity check

**File:** `public/admin/index.html`, lines 10–11

The Decap CMS SPA is loaded via:
```html
<script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
```

This is the script that receives, stores, and uses the GitHub token. It is loaded from an external CDN with a floating semver range (`^3.0.0`), no Subresource Integrity (SRI) hash, and no Content Security Policy restricting what scripts `/admin` may execute.

**Risk:** A compromised unpkg CDN response, a semver-resolved update that introduces malicious code, or any script injection into the `/admin` page can exfiltrate the token and commit arbitrary content to the repository. HTTPS alone does not protect against this — it only prevents passive interception, not CDN-side compromise.

**Recommendation:** Either bundle Decap from the pinned npm dependency (`decap-cms-app@^3.4.0` is already in `package.json`) and serve it as a local asset, or at minimum pin an exact immutable CDN URL and add an SRI `integrity` attribute. Add a Content Security Policy header for `/admin` that restricts `script-src` to the specific expected source.

---

### Finding 4 — MEDIUM: OAuth token scope is broader than necessary

**File:** `functions/oauth/index.js`, lines 9–12

The OAuth flow requests the scope `repo,user`. For a public repository used only for content management:

- `repo` grants read/write access to **all** of the user's repositories (public and private), not just the content repository. If the authenticated GitHub user has access to other private repositories, a stolen token exposes all of them.
- `user` grants read access to the user's profile data, which is not required for CMS content operations.

**Risk:** Combined with findings 1 and 2, if a token is stolen it has a blast radius far beyond the nuefunnel website repository.

**Recommendation:** Use `public_repo` instead of `repo` for a public repository. Drop the `user` scope unless Decap explicitly requires it (verify in Decap docs). For the strongest isolation, migrate to a GitHub App with a fine-grained token scoped to only the single repository and only the required operations (contents read/write, pull requests).

---

### Summary

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 1 | Critical | `functions/oauth/callback.js:10-82` | Token disclosed to any opener via unvalidated `postMessage` + missing `state` param |
| 2 | High | `functions/oauth/callback.js:57-65` | GitHub token logged in cleartext in browser console |
| 3 | High | `public/admin/index.html:10-11` | Decap loaded from mutable CDN with no SRI or CSP |
| 4 | Medium | `functions/oauth/index.js:9-12` | OAuth scope `repo,user` is broader than required |

**Recommended action before going live:** Findings 1, 2, and 3 must be fixed. Finding 4 should be addressed. None of these require a network-level MITM to exploit.
