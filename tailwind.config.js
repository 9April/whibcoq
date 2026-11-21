/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        softgreen: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
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
      spacing: {
        '13': '3.25rem',
        '14': '3.5rem',
        '15': '3.75rem',
        '16': '4rem',
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
