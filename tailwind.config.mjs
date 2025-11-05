/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#6b658c',
        accent: '#09f',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        tight: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
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
