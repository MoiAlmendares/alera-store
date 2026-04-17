/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './*.html',
    './js/**/*.js',
    './src/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          50:  '#f0fdf8',
          100: '#ccfbef',
          200: '#99f6e0',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        },
      },
    },
  },
  plugins: [],
};
