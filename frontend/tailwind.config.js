/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0A0E14',
        panel: '#10161F',
        panel2: '#141B26',
        schematic: '#2A3441',
        cyan: {
          glow: '#5EEAD4',
        },
        amber: {
          glow: '#F0B429',
        },
        ink: {
          primary: '#E6EDF3',
          muted: '#8B98A9',
          faint: '#5B6675',
        },
        danger: '#F87171',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
