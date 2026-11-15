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
      boxShadow: {
        glowLemon: '0 0 0 1px rgba(229,255,0,0.25), 0 0 20px rgba(229,255,0,0.08)',
        glowLime: '0 0 0 1px rgba(57,255,20,0.25), 0 0 20px rgba(57,255,20,0.08)',
      },
    },
  },
  plugins: [],
};
