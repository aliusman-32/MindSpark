// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color for the MindSpark logo text
        'mindspark-purple': '#5d40a0', 
        // Custom color for the Sign Up button and links
        'mindspark-pink': '#e91e63', 
        // The light background color of the whole page
        'page-background': '#f5f5fa',
      },
    },
  },
  plugins: [],
}
