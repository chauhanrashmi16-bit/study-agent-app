/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#03060f',
        surface: '#0f172a',
        panel: '#111827',
        accent: '#2563eb',
        accentSoft: '#1e3a8a',
      },
    },
  },
  plugins: [],
};
