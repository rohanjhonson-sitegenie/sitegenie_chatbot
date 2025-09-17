/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'slide-in-up': 'slideInUp 0.4s ease-out',
        'bubble': 'bubble 1.5s ease-in-out infinite',
        'sparkle': 'sparkle 3s linear infinite',
      },
      keyframes: {
        slideInUp: {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        bubble: {
          '0%, 60%, 100%': {
            transform: 'scale(1) translateY(0)'
          },
          '30%': {
            transform: 'scale(1.2) translateY(-3px)'
          },
        },
        sparkle: {
          '0%': {
            transform: 'translateX(-100%) translateY(-100%) rotate(45deg)'
          },
          '100%': {
            transform: 'translateX(100%) translateY(100%) rotate(45deg)'
          },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}