/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#FDF2F2',
          100: '#FCE7E7',
          200: '#F8C8C9',
          300: '#F1989A',
          400: '#B82427',
          500: '#A11E20',
          600: '#8D1A1C',
          700: '#751517',
          800: '#5D1113',
          900: '#480D0E',
          950: '#2E0809',
        },
        brand: {
          dark: '#0f172a',
          surface: '#1e293b',
          card: '#1e293b',
          border: '#334155',
          gold: '#f59e0b',
          emerald: '#8D1A1C',
          ruby: '#ef4444'
        }
      },
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'IBM Plex Sans Arabic', 'Segoe UI', 'sans-serif'],
        mono: ['Inter', 'Cairo', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        sans: ['Cairo', 'Tajawal', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
