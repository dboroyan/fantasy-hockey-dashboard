/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        hockey: {
          // Minimal + modern accents
          primary: '#111827',   // near-black for headings
          secondary: '#4F46E5', // indigo-600 for brand accents
          accent: '#14B8A6',    // teal-500 for secondary accents
          gold: '#D4AF37',      // muted gold for trophies/highlights
          neutral: '#F8FAFC',   // soft background
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
