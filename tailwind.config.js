/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FBF7E9',
          100: '#F6ECC8',
          200: '#EDD98E',
          300: '#E4C75A',
          400: '#D4AF37',
          500: '#C29E2E',
          600: '#A88526',
          700: '#856A1F',
          800: '#5E4A16',
          900: '#3D300F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 4px 14px 0 rgba(212, 175, 55, 0.35)',
        'gold-sm': '0 2px 8px 0 rgba(212, 175, 55, 0.25)',
      },
    },
  },
  plugins: [],
};
