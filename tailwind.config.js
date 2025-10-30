/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          yellow: '#F4D03F',
          'yellow-dark': '#E8C430',
        },
        background: {
          main: '#F5F5F5',
          white: '#FFFFFF',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#666666',
          light: '#999999',
        },
        success: '#22C55E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
