/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-deep':     '#5E0092',
        'brand-primary':  '#8700D0',
        'brand-real':     '#9100E2',
        'brand-light':    '#AE1DFF',
        'brand-medium':   '#B42DFF',
        'brand-lavender': '#D78FFF',
        'brand-pale':     '#E0A7FF',
        'brand-magenta':  '#E30294',
        'brand-orange':   '#FF7401',
      },
    },
  },
  plugins: [],
};
