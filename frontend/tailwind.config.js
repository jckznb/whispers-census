/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: {
          50:  '#f0ebff',
          100: '#d9ceff',
          200: '#b89dff',
          300: '#9b6dff',
          400: '#7c3aed',
          500: '#5c2d91',
          600: '#3d1a6e',
          700: '#261048',
          800: '#1a0a30',
          900: '#0d0518',
          950: '#06020d',
        },
        yogg: {
          purple: '#9b4cc4',
          eye:    '#c084fc',
          tentacle: '#4c1d95',
          void:   '#1e0a3c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cinzel', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'void-gradient': 'radial-gradient(ellipse at top, #1a0a30 0%, #06020d 70%)',
      },
    },
  },
  plugins: [],
}
