/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // We override 'indigo' to be your new Brand Green. 
        // This means all existing 'bg-indigo-600' buttons will instantly turn Green.
        indigo: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a', // Standard Green
          700: '#15803d', // Your "Forest Green"
          800: '#166534', // Darker Green
          900: '#14532d', // Deepest Green
          950: '#052e16',
        }
      }
    },
  },
  plugins: [],
}