/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        campus: {
          bg: '#09090c',
          card: '#111118',
          cardHover: '#181824',
          subtle: '#1b1b26',
          border: '#262638',
          pink: {
            50: '#fdf2f8',
            100: '#fce7f3',
            200: '#fbcfe8',
            300: '#f9a8d4',
            400: '#f472b6',
            500: '#ec4899',
            600: '#db2777',
            700: '#be185d',
            800: '#9d174d',
            900: '#831843',
            glow: 'rgba(236, 72, 153, 0.25)',
          }
        }
      },
      boxShadow: {
        'pink-glow': '0 0 25px -5px rgba(236, 72, 153, 0.3)',
        'pink-glow-sm': '0 0 15px -3px rgba(236, 72, 153, 0.25)',
        'pink-glow-lg': '0 0 40px -5px rgba(236, 72, 153, 0.35)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
