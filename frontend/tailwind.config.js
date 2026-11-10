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
          50: '#F3F0FF',
          100: '#E6DEFE',
          200: '#D0C0FD',
          300: '#B599FC',
          400: '#8E67FA',
          500: '#6D4AFF', // Primary brand
          600: '#5035C8', // Primary dark
          700: '#3D25A0',
          800: '#2F1B7F',
          900: '#1F1159',
        },
        lavender: {
          surface: '#F3F0FF',
          border: '#E4DCFD',
        },
        pinkaccent: {
          DEFAULT: '#F3A6C7',
          surface: '#FFF0F6',
          border: '#FAD2E1',
          dark: '#E075A4',
        },
        app: {
          bg: '#FAF9FD',
          surface: '#FFFFFF',
          border: '#E8E4F0',
        },
        content: {
          primary: '#27233A',
          secondary: '#77728A',
          muted: '#A5A0B8',
        },
        status: {
          success: '#198754',
          warning: '#B7791F',
          danger: '#C2415D',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(109, 74, 255, 0.05), 0 1px 3px rgba(0, 0, 0, 0.05)',
        'card': '0 4px 20px -2px rgba(39, 35, 58, 0.06)',
        'modal': '0 20px 40px -10px rgba(39, 35, 58, 0.15)',
      }
    },
  },
  plugins: [],
}

