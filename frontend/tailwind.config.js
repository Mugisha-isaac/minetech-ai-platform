/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        mine: {
          900: '#1a1208',
          800: '#2d1f0e',
          700: '#3d2a12',
          600: '#5c3d1a',
          500: '#8B6914',
          400: '#b8890f',
          300: '#d4a520',
          200: '#e8c84a',
          100: '#f5e49a',
          50:  '#fdf8e8',
        },
        slate: {
          950: '#0a0e1a',
          900: '#0f172a',
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body:    ['var(--font-body)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
