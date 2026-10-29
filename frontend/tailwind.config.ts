import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0a0e1a',
          surface: '#111827',
          border: '#1f2937',
          green: '#00ff88',
          'green-dim': '#00aa55',
          'green-dark': '#003322',
          red: '#ff4444',
          'red-dim': '#aa2222',
          'red-dark': '#330000',
          amber: '#fbbf24',
          'amber-dim': '#b45309',
          white: '#f9fafb',
          gray: '#9ca3af',
          'gray-dim': '#4b5563',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      keyframes: {
        'glow-pulse-green': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0,255,136,0.3), 0 0 10px rgba(0,255,136,0.1)' },
          '50%': { boxShadow: '0 0 15px rgba(0,255,136,0.6), 0 0 30px rgba(0,255,136,0.3)' },
        },
        'glow-pulse-red': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255,68,68,0.3), 0 0 10px rgba(255,68,68,0.1)' },
          '50%': { boxShadow: '0 0 15px rgba(255,68,68,0.6), 0 0 30px rgba(255,68,68,0.3)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scan: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100%' },
        },
      },
      animation: {
        'glow-green': 'glow-pulse-green 2s ease-in-out infinite',
        'glow-red': 'glow-pulse-red 2s ease-in-out infinite',
        blink: 'blink 1s step-start infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-down': 'slide-down 0.4s ease-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
      },
      backgroundImage: {
        'grid-dark':
          'linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '40px 40px',
      },
    },
  },
  plugins: [],
};

export default config;
