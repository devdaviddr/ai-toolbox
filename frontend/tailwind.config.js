/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    'node_modules/flowbite-react/lib/esm/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#030712',
        },
      },
    },
  },
  plugins: [require('flowbite/plugin')],
  darkMode: 'class',
};
