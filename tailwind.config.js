/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#c11267',
        'background-light': '#f3f4f6',
        'background-dark': '#0f1115',
        'surface-light': '#ffffff',
        'surface-dark': '#1a1d23',
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body: ['Open Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        xl: '1rem',
      },
    },
  },
  plugins: [],
}
