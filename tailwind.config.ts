/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        light: {
          primary: '#F3EDE2',
          text: '#8B5E3C',
          secondary: '#43B3E5',
          accent: '#E9C46A',
          card: '#EADDC7',
          nav: '#ede4d4',
        },
        dark: {
          primary: '#0f172a',
          text: '#f1f5f9',
          secondary: '#3b82f6',
          accent: '#3b82f6',
          nav: '#1e293b',
        },
        bg_accent: '#820000',
        popover: '#CAAAC',
        muted: '#64748B',
        accent: '#F1F5F9',
        danger: '#ee1c1c',
        border: '#E2E8F0',
        input: '#E2E8F0',
        success: '#39AD6A',
        // Invoice accent — deep slate-blue for invoice module
        'invoice-accent': {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
        },
        // MTD accent — professional blue for tax module
        'mtd-accent': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      backgroundImage: {
        'gradient': 'linear-gradient(to bottom, #c5ebe6, #d6e7d7, #e4e2d3, #e8ded8, #e3dede)',
        'gradient_2': 'linear-gradient(to bottom, #b5ede6, #b8ede6, #bbede6, #beece6, #c1ece6, #c6ede8, #cbeee9, #d0efeb, #d8f2ef, #e1f6f2, #e9f9f6, #f1fcfa)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};