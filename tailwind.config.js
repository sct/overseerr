// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: [
    './node_modules/react-tailwindcss-datepicker-sct/dist/index.esm.js',
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Apple TV inspired color palette
        'tv-bg': '#000000',                    // Pure black background
        'tv-bg-elevated': '#0a0a0a',           // Slightly elevated surfaces
        'tv-card': 'rgba(28, 28, 30, 0.8)',    // Card with transparency for glass effect
        'tv-card-hover': 'rgba(44, 44, 46, 0.8)', // Hover state
        'tv-surface': '#1c1c1e',               // Solid surface elements
        'tv-surface-light': '#2c2c2e',         // Lighter surface
        'tv-border': 'rgba(255, 255, 255, 0.08)', // Subtle borders
        'tv-border-hover': 'rgba(255, 255, 255, 0.12)', // Border hover
        'tv-text': '#f5f5f7',                  // Primary text (off-white)
        'tv-text-secondary': '#98989d',        // Secondary text (light gray)
        'tv-text-tertiary': '#636366',         // Tertiary text (medium gray)
        'tv-accent': '#0A84FF',                // Apple system blue
        'tv-accent-hover': '#409CFF',          // Blue hover state
        'tv-success': '#30D158',               // Apple green
        'tv-warning': '#FFD60A',               // Apple yellow
        'tv-error': '#FF453A',                 // Apple red
      },
      backdropBlur: {
        'glass': '40px',                       // Standard glass effect
        'glass-strong': '60px',                // Stronger blur
        'glass-light': '20px',                 // Lighter blur
      },
      transitionProperty: {
        'max-height': 'max-height',
        width: 'width',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        'tv': '12px',                          // Standard Apple TV radius
        'tv-lg': '16px',                       // Large radius
        'tv-xl': '20px',                       // Extra large radius
      },
      boxShadow: {
        'tv': '0 8px 32px rgba(0, 0, 0, 0.4)', // Standard elevation
        'tv-lg': '0 16px 48px rgba(0, 0, 0, 0.5)', // Large elevation
        'tv-xl': '0 24px 64px rgba(0, 0, 0, 0.6)', // Extra large elevation
        'glow': '0 0 20px rgba(10, 132, 255, 0.3)', // Accent glow
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.300'),
            a: {
              color: theme('colors.indigo.500'),
              '&:hover': {
                color: theme('colors.indigo.400'),
              },
            },

            h1: {
              color: theme('colors.gray.300'),
            },
            h2: {
              color: theme('colors.gray.300'),
            },
            h3: {
              color: theme('colors.gray.300'),
            },
            h4: {
              color: theme('colors.gray.300'),
            },
            h5: {
              color: theme('colors.gray.300'),
            },
            h6: {
              color: theme('colors.gray.300'),
            },

            strong: {
              color: theme('colors.gray.400'),
            },

            code: {
              color: theme('colors.gray.300'),
            },

            figcaption: {
              color: theme('colors.gray.500'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
