/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['InterVariable', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
      colors: {
        bg: '#ffffff',
        fg: '#0f172a',
        muted: '#475569',
        accent: '#2563eb',
        border: '#e2e8f0',
        'chip-bg': '#eff6ff',
        'chip-fg': '#1e40af',
      },
    },
  },
  plugins: [],
}
