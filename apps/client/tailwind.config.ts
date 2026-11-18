import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        uno: {
          red: '#EF4444',
          green: '#22C55E',
          blue: '#3B82F6',
          yellow: '#EAB308',
          wild: '#8B5CF6',
          dark: '#0F0F1A',
          card: '#1A1A2E',
          surface: '#16213E',
          border: '#2A2A4A',
        },
      },
      fontFamily: {
        display: ['system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'card-flip': 'cardFlip 0.6s ease-in-out',
        'card-play': 'cardPlay 0.4s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        cardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        cardPlay: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-100px) scale(0.8)', opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(99,102,241,0.5)' },
          '50%': { boxShadow: '0 0 30px rgba(99,102,241,0.9)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'table-felt': 'radial-gradient(ellipse at center, #1a4a2e 0%, #0d2818 100%)',
        'card-gradient': 'linear-gradient(135deg, #1e1e3f 0%, #2d2d5e 100%)',
        'hero-gradient': 'linear-gradient(135deg, #0f0f1a 0%, #1a1a3e 50%, #0f0f1a 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
