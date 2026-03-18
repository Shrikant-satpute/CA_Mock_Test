import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        card: '#111118',
        border: '#1e1e2e',
        primary: '#6366f1',
        secondary: '#f59e0b',
        success: '#10b981',
        error: '#ef4444',
        textPrimary: '#f1f5f9',
        textMuted: '#94a3b8',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'count-up': 'countUp 1s ease-out',
        'gradient-border': 'gradientBorder 3s ease infinite',
        'orb1': 'orb1 12s ease-in-out infinite',
        'orb2': 'orb2 15s ease-in-out infinite',
        'orb3': 'orb3 18s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(99,102,241,0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(99,102,241,1), 0 0 40px rgba(99,102,241,0.5)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        gradientBorder: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        orb1: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(80px, -60px) scale(1.1)' },
          '66%': { transform: 'translate(-40px, 40px) scale(0.9)' },
        },
        orb2: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(-70px, 50px) scale(1.15)' },
          '66%': { transform: 'translate(50px, -30px) scale(0.95)' },
        },
        orb3: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(60px, 70px) scale(0.9)' },
          '66%': { transform: 'translate(-80px, -50px) scale(1.1)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
