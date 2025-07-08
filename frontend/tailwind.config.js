/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // StoreHub Brand Colors
        primary: {
          50: '#fff8e6',
          100: '#ffedb3',
          200: '#ffe280',
          300: '#ffd74d',
          400: '#ffcc1a',
          500: '#FFA200', // Main StoreHub Orange
          600: '#e6920a',
          700: '#cc8200',
          800: '#b37300',
          900: '#996300',
        },
        // Dark backgrounds
        dark: {
          50: '#f7f7f7',
          100: '#e3e3e3',
          200: '#c8c8c8',
          300: '#a4a4a4',
          400: '#818181',
          500: '#666666',
          600: '#515151',
          700: '#434343',
          800: '#2B2B2B', // Sidebar
          900: '#1C1C1C', // Top nav dark
        },
        // Light backgrounds
        light: {
          50: '#ffffff',
          100: '#F5F7FA', // Main content background
          200: '#f0f2f5',
          300: '#e8eaed',
          400: '#dadce0',
          500: '#bdc1c6',
          600: '#9aa0a6',
          700: '#80868b',
          800: '#5f6368',
          900: '#3c4043',
        },
        // Text colors
        text: {
          main: '#222222',
          muted: '#5C5C5C',
          sidebar: '#CCCCCC',
          'sidebar-active': '#FFFFFF',
        },
        // Dividers
        divider: '#E0E0E0',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.12)',
        'strong': '0 8px 24px rgba(0, 0, 0, 0.16)',
      },
    },
  },
  plugins: [],
} 