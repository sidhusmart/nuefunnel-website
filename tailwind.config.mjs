/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // New operator-portfolio palette (Phase 1+)
        ink: '#111111',         // headings, wordmark, strong text
        body: '#44444C',        // body copy
        subtle: '#76767E',      // meta, captions, secondary text
        border: '#E5E3DC',      // hairline borders, dividers
        paper: '#FBFAF7',       // page background (warm off-white)
        surface: '#FFFFFF',     // cards, panels
        accent: {
          DEFAULT: '#0F766E',   // deep teal, primary CTA + links
          hover: '#0D9488',
        },

        // Deprecated tokens kept until Phase 2 page rewrites land
        'primary-purple': '#580DD9',
        'primary-magenta': '#8E2DA6',
        'accent-cyan': '#00A0E4',
        'muted-purple': '#6B658C',
        primary: '#6b658c',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        tight: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        // logo aliased to Inter Tight so any stale font-logo references render sensibly
        logo: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        desktop: '1200px',
        content: '720px',
        tablet: '810px',
        mobile: '390px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
