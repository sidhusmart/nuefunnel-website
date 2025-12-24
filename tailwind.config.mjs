/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Primary gradient colors
        'primary-purple': '#580DD9',
        'primary-magenta': '#8E2DA6',
        // Accent color for links, logo on inner pages
        'accent-cyan': '#00A0E4',
        // Muted purple for buttons, body text
        'muted-purple': '#6B658C',
        // Keep old primary for backward compatibility during migration
        primary: '#6b658c',
        accent: '#09f',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        tight: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        logo: ['Bungee', 'cursive'],
      },
      maxWidth: {
        desktop: '1200px',
        tablet: '810px',
        mobile: '390px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
