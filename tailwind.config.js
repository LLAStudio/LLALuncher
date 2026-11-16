/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0C0E',
        card: '#121418',
        border: '#22262E',
        lemon: '#E5FF00',
        lime: '#39FF14',
        text: '#F3F4F6',
        muted: '#8B949E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      backgroundImage: {
        acid: 'linear-gradient(135deg, #E5FF00 0%, #39FF14 100%)',
      },
      borderRadius: {
        none: '0px',
        sm: '1px',
        DEFAULT: '1px',
        md: '1px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
