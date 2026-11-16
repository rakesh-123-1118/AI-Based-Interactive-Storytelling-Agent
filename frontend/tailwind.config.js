/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 20px rgba(59,130,246,0.35)'
      },
      colors: {
        midnight: '#020817',
        panel: '#0f172a',
        highlight: '#7c3aed',
        accent: '#38bdf8'
      }
    }
  },
  plugins: []
};
