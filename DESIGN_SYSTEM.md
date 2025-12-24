# Nuefunnel Design System

This document captures the design language of nuefunnel.com (built with Framer) to guide recreation in the Astro/Decap CMS stack.

---

## 1. Color Palette

### Primary Colors
| Color | Hex/RGB | Usage |
|-------|---------|-------|
| Purple (Dark) | `#580DD9` / `rgb(88, 13, 217)` | Gradient start for headings |
| Magenta | `#8E2DA6` / `rgb(142, 45, 166)` | Gradient end for headings |
| Cyan/Blue | `#00A0E4` (approx) | Logo on inner pages, "Blog posts" heading, hyperlinks |
| Muted Purple | `#6B658C` / `rgb(107, 101, 140)` | CTA button background, tagline text |

### Neutral Colors
| Color | Hex/RGB | Usage |
|-------|---------|-------|
| Black | `#111111` / `rgb(17, 17, 17)` | Logo on homepage, article titles, section headers |
| Dark Gray | `#001122` / `rgb(0, 17, 34)` | Primary body text (computed) |
| Gray | `rgb(107, 101, 140)` | Subheadings, date text, body paragraphs |
| Light Gray | `rgba(0, 0, 0, 0.08)` | Dotted background pattern |
| White | `#FFFFFF` | Page background, card text |

### Accent Colors
| Color | Hex/RGB | Usage |
|-------|---------|-------|
| Charcoal | `rgb(26, 26, 26)` | Footer background elements |
| Light Lavender | `rgba(229, 221, 255, 0.3)` (approx) | Feature card backgrounds |

---

## 2. Typography

### Font Families
| Font | Usage |
|------|-------|
| **Bungee** | Logo "NUEFUNNEL" (Google Font) |
| **Inter** | All body text, headings, navigation |
| **Times** (fallback) | Some italic taglines |

### Font Sizes & Weights
| Element | Size | Weight | Style |
|---------|------|--------|-------|
| Logo | 20px | 400 | Normal, uppercase |
| Hero Heading (H1) | 72px | 700 | Bold |
| Section Tagline | 24px | 500 | Italic |
| Page Title (Blog/Stories) | ~48px | 700 | Bold |
| Article Title | ~32px | 700 | Bold |
| Section Headers (H2) | ~24px | 700 | Bold |
| Body Text | 16-18px | 400 | Normal |
| Navigation Links | 15px | 400 | Normal |
| Date/Meta | 14-16px | 400 | Normal, gray color |

---

## 3. Background Pattern

### Dotted/Polka Dot Pattern
The entire site uses a subtle dotted background pattern:

```css
/* Approximate implementation */
background-image: radial-gradient(circle, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
background-size: 24px 24px;
background-color: #FFFFFF;
```

**Key Characteristics:**
- Very light gray dots (~8% opacity black)
- Uniform spacing (~24px grid)
- Consistent across all pages
- Creates subtle texture without distraction

---

## 4. Navigation Bar

### Structure
```
[LOGO]                    [Products] [Customer Stories] [Blog]
```

### Styling
- **Position:** Sticky/fixed at top
- **Background:** White (`#FFFFFF`)
- **Top Border:** Thin cyan/blue line (1-2px)
- **Padding:** ~15-20px vertical
- **Max Width:** Contained, centered

### Logo
- Font: Bungee
- Size: 20px
- Color: Black (`#111111`) on homepage
- Color: Cyan/Blue on inner pages (Customer Stories, Blog)
- Text Transform: Uppercase
- Letter Spacing: Normal

### Navigation Links
- Font: Inter, 15px
- Color: Cyan/Blue for non-active
- Active State: Underlined
- Hover: Underline animation
- Spacing: ~30px between links

---

## 5. Homepage Components

### Hero Section
```css
/* Hero Heading Gradient */
.hero-heading {
  font-family: 'Inter', sans-serif;
  font-size: 72px;
  font-weight: 700;
  background: linear-gradient(0deg, #580DD9 16.24%, #8E2DA6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
}
```

### Hero Subheading
- Font: Inter
- Size: ~18-20px
- Color: Gray (`rgb(107, 101, 140)`)
- Text Align: Center
- Max Width: ~700px

### CTA Button
```css
.cta-button {
  background-color: #6B658C;
  color: white;
  border-radius: 8px;
  padding: 15px 30px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.cta-button:hover {
  background-color: #5a5578; /* Slightly darker */
}
```

### Section Tagline
```css
.section-tagline {
  font-family: 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 500;
  font-style: italic;
  color: #6B658C;
  text-align: center;
  background: linear-gradient(0deg, #580DD9, #8E2DA6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Feature Cards
```css
.feature-card {
  background: linear-gradient(180deg, rgba(229, 221, 255, 0.2) 0%, rgba(229, 221, 255, 0.4) 100%);
  border-radius: 12px;
  padding: 30px;
  text-align: center;
}

.feature-card-icon {
  color: #6B658C;
  font-size: 32px;
  margin-bottom: 16px;
}

.feature-card-title {
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
}

.feature-card-description {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #6B658C;
  line-height: 1.6;
}
```

**Grid Layout:**
- 2x2 grid for first 4 cards
- Full width centered card for 5th card
- Gap: ~24px

### Video/Demo Section
- Container: Rounded corners (~16px)
- Background: Purple gradient
- Shadow: Subtle drop shadow
- Aspect Ratio: 16:9
- Play button: Centered, circular

---

## 6. List Pages (Blog, Customer Stories)

### Page Title
- Font: Inter
- Size: ~48px
- Weight: 700
- Color: Cyan/Blue (Blog) or Black (Customer Stories)
- Text Align: Center

### Article List Item
```css
.article-item {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 20px 0;
}

.article-thumbnail {
  width: 180px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.article-title {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #111;
  margin-bottom: 8px;
  text-decoration: none;
}

.article-title:hover {
  text-decoration: underline;
}

.article-date {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #6B658C;
}
```

---

## 7. Article/Blog Post Page

### Article Header
- Title: Black, bold, centered, ~32-40px
- Date: Gray, centered, below title
- Featured Image: Full width (within content area), rounded corners

### Article Content
```css
.article-content {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px;
}

.article-content p {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  line-height: 1.8;
  color: #555;
  margin-bottom: 24px;
}

.article-content h2 {
  font-family: 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #111;
  margin-top: 40px;
  margin-bottom: 20px;
}

.article-content strong {
  font-weight: 600;
  color: #333;
}

.article-content em {
  font-style: italic;
}

.article-content a {
  color: #00A0E4;
  text-decoration: none;
}

.article-content a:hover {
  text-decoration: underline;
}
```

### Special Elements
- **Emoji Numbers:** Used for numbered lists (1️⃣, 2️⃣, etc.)
- **Bold Intro:** First paragraph often bold + italic
- **Embedded Video:** Rounded corners, centered, full content width

---

## 8. Footer

### Structure
```
[© nuefunnel LLC. 2025]          [Twitter] [LinkedIn] [Email]
```

### Styling
```css
footer {
  padding: 24px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.footer-copyright {
  font-size: 14px;
  color: #666;
}

.footer-links a {
  color: #00A0E4;
  text-decoration: none;
  margin-left: 24px;
  font-size: 14px;
}

.footer-links a:hover {
  text-decoration: underline;
}
```

---

## 9. Layout & Spacing

### Container
- Max Width: ~1200px
- Padding: 0 20px (mobile), 0 40px (desktop)
- Centered horizontally

### Vertical Spacing
- Section Gap: 80-120px
- Element Gap: 24-40px
- Paragraph Gap: 24px

### Content Width
- Hero/Feature sections: Full container
- Article content: Max 720px

---

## 10. Responsive Behavior

### Breakpoints (Estimated)
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile Adaptations
- Navigation: Likely hamburger menu (not observed)
- Hero heading: Reduced to ~36-48px
- Feature cards: Stack vertically
- Article list: Stack thumbnail above text

---

## 11. Animation & Interactions

### Observed Animations
- **Link Hover:** Underline appears
- **Button Hover:** Background color darkens slightly
- **Page Transitions:** Smooth (Framer default)

### Recommended Additions for Astro
```css
/* Smooth transitions */
a, button {
  transition: all 0.2s ease;
}

/* Hover states */
.nav-link:hover {
  text-decoration: underline;
}

.cta-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

---

## 12. Implementation Notes for Astro

### Required Google Fonts
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bungee&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### CSS Variables (Recommended)
```css
:root {
  /* Colors */
  --color-primary-purple: #580DD9;
  --color-primary-magenta: #8E2DA6;
  --color-accent-cyan: #00A0E4;
  --color-muted-purple: #6B658C;
  --color-text-dark: #111111;
  --color-text-body: #555555;
  --color-text-light: #6B658C;
  --color-bg-white: #FFFFFF;
  --color-bg-lavender: rgba(229, 221, 255, 0.3);

  /* Typography */
  --font-logo: 'Bungee', cursive;
  --font-body: 'Inter', sans-serif;

  /* Spacing */
  --spacing-xs: 8px;
  --spacing-sm: 16px;
  --spacing-md: 24px;
  --spacing-lg: 40px;
  --spacing-xl: 80px;

  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
}
```

### Gradient Mixin
```css
.gradient-text {
  background: linear-gradient(0deg, var(--color-primary-purple) 16.24%, var(--color-primary-magenta) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## 13. Key Design Principles

1. **Minimalism:** Clean, uncluttered layouts with generous whitespace
2. **Subtle Texture:** Dotted background adds visual interest without distraction
3. **Gradient Accents:** Purple-magenta gradient used sparingly for emphasis
4. **Consistent Typography:** Inter font family throughout with clear hierarchy
5. **Accessible Contrast:** Text colors maintain good readability
6. **Focused CTAs:** Muted purple buttons stand out without being aggressive
7. **Content-First:** Design supports rather than overwhelms content

---

## 14. File Structure Suggestion for Astro

```
src/
├── styles/
│   ├── global.css          # Global styles, CSS variables, base styles
│   ├── components/
│   │   ├── navigation.css
│   │   ├── footer.css
│   │   ├── hero.css
│   │   ├── feature-cards.css
│   │   ├── article-list.css
│   │   └── article-content.css
│   └── utilities.css       # Gradient text, spacing utilities
├── components/
│   ├── Navigation.astro
│   ├── Footer.astro
│   ├── Hero.astro
│   ├── FeatureCard.astro
│   ├── ArticleList.astro
│   └── ArticleContent.astro
└── layouts/
    ├── BaseLayout.astro    # Includes dotted background
    ├── HomeLayout.astro
    └── ArticleLayout.astro
```
