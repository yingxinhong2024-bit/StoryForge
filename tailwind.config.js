/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#6366f1',
        surface: '#0f172a',
        card: '#1e293b',
      },
    },
  },
  plugins: [],
};
