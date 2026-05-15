# Website Design Document

## Purpose

This site is the front door for a two-person AI operator portfolio offering products, consulting, and training. It is **not** a traditional company website. It centers the two founders and their work, with the three business lines acting as entry points rather than equal-weight service pillars.

## What this site is (and isn't)

**It is:** an operator portfolio — closer in spirit to early 37signals or senior indie operators than to a startup company site (Anthropic, Scale, etc.).

**It is not:** a faceless corporate site with a `/services` page, generic "About Us" copy, and equal tiles for each line of business.

**It does its job** when a visitor figures out within 10 seconds:

1. Who the founders are (real people, named, faces visible)
2. What kind of work they do (specific, not "we leverage cutting-edge GenAI")
3. Whether the work is relevant to the visitor
4. What to do next

Trust, authenticity, and expertise are the *consequences* of doing the above well — not standalone goals the design optimizes for directly.

## Success criteria

The primary measurable outcome is **showing up as legitimate when a referred visitor verifies the company.** This is not a conversion-optimized lead funnel. It is a credibility-verification surface that *also* makes engagement easy for the small number of qualified visitors who want it.

Secondary outcomes (in priority order):

1. Inbound for medium-sized consulting projects (smaller, coding-agent-deliverable scope)
2. Inbound for corporate training (peaky, low volume, high value)
3. Discovery of products (which then live and convert on their own domains)

## Who arrives, and how

Most visitors arrive having heard of the company elsewhere — referral, LinkedIn post, podcast appearance, conference talk, book mention. The homepage is almost always the **second** page in a visit, not the first.

Visitors come to verify: "is this real? do these people exist? do they do work I care about?"

Implications:

- The site is a credibility-verification surface more than a lead-generation funnel.
- Specific proof points matter more than persuasive copy.
- Each artifact (case study, post, product page) must stand on its own URL — individual artifacts get shared in proposals, on LinkedIn, in cold reach-outs. If a case study only exists as a section of the homepage, it can't be linked cleanly.

## Strategic positioning of the three lines

The three lines are not symmetric and should not be presented as such on the site.

**Consulting.** The site should *filter*, not promote. Case studies make scope explicit ("4 weeks, 2 people, coding-agent-assisted"). An explicit "what we don't do" signal politely declines large enterprise compliance work and staff-augmentation engagements. Senior buyers respect this; mismatched buyers self-select out.

**Products.** Framed as "things we built," not a service catalog. Each product lives on its own dedicated domain. The site links out with a short narrative explaining why the product exists. Products are credibility artifacts and content engines, not the primary revenue story.

**Training.** Reactive. No course funnel. Make it easy for corporate inbound to find a contact form. Surface evidence of past delivery (book, courses-taught numbers, talks). Let inbound come from content.

## Information architecture

```
/                          Landing page (rich summary)
/about                     Founders page (deeper bios, story)
/work/                     Case study index
/work/[slug]               Individual case study pages
/writing/                  Blog index
/writing/[slug]            Individual post pages
/products/                 Built-things index (optional; can fold into landing)
/products/[slug]           Product narrative pages (link out to actual product sites)
/training                  Corporate training inquiry page
/contact                   Engagement / project inquiry page
```

**Explicitly excluded:**

- A `/services` page
- A `/about-us` page with corporate boilerplate
- Three equal-weight tiles or pages for Products / Consulting / Training as parallel service lines

## Landing page structure

Sections, top to bottom:

**1. Hero**

- Two founders by name, faces visible (photo or distinctive illustration)
- One-line positioning that is *specific* — what kind of AI work, for whom. Not "we help companies leverage AI."
- At most two CTAs: a primary engagement path and a secondary "see the work."

**2. Recent / featured work** — 3 case studies

- Each as a card: client/context, problem, scope (duration + team size), outcome, one telling detail
- Each card links to a full case study page
- Scope is **explicit** — this is the consulting filter doing its work

**3. Built things** — 1–3 products

- Short callout for each: what it is, why it exists, link out to its own site
- Frames products as "things we built," not "products we sell"

**4. Writing & talks** — authority surface

- 3–5 representative pieces: blog posts, book, conference talks
- Each links to its artifact (own page, external talk recording, book page)

**5. Engagement paths**

- Project work → `/contact` (with implicit scope signals)
- Corporate training → `/training`
- Optional: "keep reading" → `/writing` for visitors who want to evaluate further before transacting

**6. Footer**

- Contact, social, GitHub, link to product site(s), legal

## Deep page templates

### Case study page (`/work/[slug]`)

The strongest single-page artifact on the site. Each case study:

- Context (industry, company size where shareable, problem in concrete terms)
- Approach (technical + team composition; be explicit about coding-agent leverage where relevant)
- Scope: weeks, people, what was in/out of scope
- Outcome: what changed, measured where possible
- Honest reflection (what we'd do differently)
- CTA at the bottom linking to the engagement page

These pages must be shareable in proposals and on LinkedIn as standalone artifacts.

### Founders page (`/about`)

Goes deeper than the homepage hero. Real bios — background, expertise, what each founder leads. The two-distinct-but-complementary-skill-sets narrative (data science/ML/AI on one side, product/conversational AI on the other) is the central differentiator and should be foregrounded.

### Blog post page (`/writing/[slug]`)

Standard long-form post template. Each post links out to:

- Related case study (if applicable)
- Related product (if applicable)
- A soft CTA at the bottom ("we help teams ship things like this — get in touch")

### Product narrative page (`/products/[slug]`)

A *brief* page explaining the product's existence and linking out. Not the product's actual marketing site (that lives elsewhere). One paragraph on why it exists, one screenshot or demo, link out.

### Training inquiry page (`/training`)

- What kinds of corporate training are offered
- Past delivery proof (book, courses, students taught, named clients where possible)
- A simple inquiry form — not a course catalog

### Engagement page (`/contact`)

- Clear about what kind of work *is* a fit (scope signals: "engagements typically X–Y weeks, X–Y people")
- Clear about what *isn't* a fit ("we don't take on large enterprise compliance work or staff augmentation")
- Simple inquiry form

## Tone, voice, aesthetic

**Voice:**

- Specific over abstract
- First-person plural ("we built," "we found") — these are humans, not a corporation
- Concrete numbers, durations, outcomes wherever possible
- Honest about what didn't work — unusual, and trust-building

**Avoid:**

- "We leverage cutting-edge generative AI to unlock business value" and similar
- "Our team of expert practitioners"
- Stock photos of people pointing at laptops
- Generic AI iconography (neural-network diagrams, glowing brains, neon gradients)
- Three-column "Our Services" tile arrangements

**Aesthetic direction:**

- Clean, type-led, restrained
- Names and faces prominent
- Whitespace over density
- Reference points: early 37signals, mid-2010s personal sites of senior operators, indie product hub sites
- Strongly avoid: enterprise SaaS look, AI-hype gradient/neon aesthetic

## Proof points to surface

Available assets and where they belong:

- **5 case studies** from real projects → 3 featured on landing, all 5 listed on `/work`
- **1 live product** → callout on landing + `/products/[slug]` page
- **Lab-type GitHub repos** → linked from founders page + relevant posts
- **Published book** → hero of `/writing`, linked from `/about`
- **Conference talks** → `/writing`, `/about`

Principle: the strongest three of each type on the landing page, the full inventory on the dedicated page. Don't crowd the homepage with everything.

## Open questions to resolve while iterating

1. **Language**: German, international English, or both? Default to English unless the target audience is primarily German-speaking.
2. **Segmentation hero**: should the hero ask "what brings you here?" and route, or be a single positioning statement that lets visitors self-navigate? Default to single positioning unless visitor segments turn out to be very distinct.
3. **Pricing transparency**: starting prices for consulting engagements visible on the site (a strong filter and trust signal), or inquire-only?
4. **Founders page**: single shared page, or one per founder?
5. **Newsletter / subscribe surface**: include now, or hold until content cadence is established?

---

**Use this document as the guiding principles for design and copy decisions. Where the document is silent on a specific detail, fall back to the principle: "operator portfolio, specific over abstract, faces and work front and center."**
