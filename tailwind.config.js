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
        field: {
          darkest: '#07090e',
          bg: '#0b0d17',
          card: '#131826',
          cardHover: '#182032',
          border: '#1e293b',
          borderLight: '#334155',
        }
      }
    },
  },
  plugins: [],
}
