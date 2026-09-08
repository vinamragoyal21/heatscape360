/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palette matched to the provided HeatScape 360 screens: deep forest
        // green nav/surfaces, warm off-white content background, heat-risk
        // traffic-light scale.
        brand: {
          950: '#0b1f16',
          900: '#0f2a1e',
          800: '#13351f',
          700: '#1a4527',
          600: '#22592f',
          500: '#2d6e3a',
          400: '#4a9459',
          100: '#e7f3ea',
        },
        heat: {
          low: '#3fb950',
          moderate: '#e3b341',
          high: '#f0883e',
          veryhigh: '#e5484d',
        },
        surface: {
          DEFAULT: '#f6f5ef',
          card: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 42, 30, 0.06), 0 1px 12px rgba(15, 42, 30, 0.06)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
