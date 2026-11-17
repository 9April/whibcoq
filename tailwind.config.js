/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',
          surface: '#1e293b',
          card: '#1e293b',
          border: '#334155',
          gold: '#f59e0b',
          emerald: '#10b981',
          ruby: '#ef4444'
        }
      },
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'IBM Plex Sans Arabic', 'Segoe UI', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
