import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8f9fb',
          100: '#f1f3f6',
          200: '#e3e7ed',
          300: '#d0d6e0',
          400: '#b8c2d1',
          500: '#182945',
          600: '#15243d',
          700: '#121f35',
          800: '#0f1a2d',
          900: '#0c1525',
        },
      },
      boxShadow: {
        card: '0 6px 14px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        soft: '12px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} satisfies Config