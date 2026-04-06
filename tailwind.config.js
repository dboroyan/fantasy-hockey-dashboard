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
          primary: '#0f172a',   // slate-900 — page background
          surface: '#1e293b',   // slate-800 — cards, panels
          border: '#334155',    // slate-700 — borders, dividers
          secondary: '#4ade80', // green-400 — primary accent
          accent: '#22c55e',    // green-500 — secondary accent
          gold: '#D4AF37',      // muted gold — champions
          neutral: '#0f172a',   // dark background (was light)
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
