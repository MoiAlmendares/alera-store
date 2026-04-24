/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './js/*.js'],
  theme: {
    extend: {
      colors: {
        mint: {
          50:  '#f0fdf8',
          100: '#ccfbef',
          200: '#99f6e0',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        }
      }
    }
  },
  plugins: [],
}
