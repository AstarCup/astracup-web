import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      transitionDuration: {
        '2000': '2000ms',
      },
      animation: {
        'path-draw': 'pathDraw 2s ease-out',
        'glow': 'glow 3s ease-in-out infinite',
      },
      keyframes: {
        pathDraw: {
          '0%': { 
            'stroke-dasharray': '1000',
            'stroke-dashoffset': '1000',
            'fill-opacity': '0'
          },
          '70%': { 
            'stroke-dashoffset': '0',
            'fill-opacity': '0'
          },
          '100%': { 
            'stroke-dashoffset': '0',
            'fill-opacity': '1'
          },
        },
        glow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 5px #E93B66)' },
          '50%': { filter: 'drop-shadow(0 0 20px #E93B66) drop-shadow(0 0 30px #E93B66)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
export default config
