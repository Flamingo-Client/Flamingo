import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        canvas: token('canvas'),
        surface: {
          DEFAULT: token('surface'),
          raised: token('surface-raised'),
          sunken: token('surface-sunken'),
        },
        line: {
          DEFAULT: token('line'),
          strong: token('line-strong'),
        },
        body: token('body'),
        muted: token('muted'),
        faint: token('faint'),
        accent: {
          DEFAULT: token('accent'),
          foreground: token('accent-foreground'),
        },
        good: token('good'),
        warn: token('warn'),
        bad: token('bad'),
        danger: token('bad'),
        idle: token('idle'),
        method: {
          get: token('method-get'),
          post: token('method-post'),
          put: token('method-put'),
          patch: token('method-patch'),
          delete: token('method-delete'),
          options: token('method-neutral'),
          head: token('method-neutral'),
        },
        border: token('line'),
        input: token('line-strong'),
        ring: token('accent'),
        background: token('surface'),
        foreground: token('body'),
        popover: {
          DEFAULT: token('surface-raised'),
          foreground: token('body'),
        },
        card: {
          DEFAULT: token('surface-raised'),
          foreground: token('body'),
        },
      },
      fontFamily: {
        sans: ['Onest', 'system-ui', 'sans-serif'],
        mono: ['GoogleSansCode', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      borderRadius: {
        xs: '6px',
        sm: '9px',
        md: '13px',
        lg: '18px',
        xl: '24px',
        '2xl': '30px',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.35, 0.64, 1)',
      },
      boxShadow: {
        panel: 'var(--panel-shadow)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
        },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.96) translateY(-4px)' },
        },
        'pop-out': {
          to: { opacity: '0', transform: 'scale(0.97)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'rise-in': 'rise-in 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        'pop-in': 'pop-in 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
        'pop-out': 'pop-out 0.12s ease-in',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
