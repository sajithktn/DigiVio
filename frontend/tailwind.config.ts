import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Emerald Green Theme
        primary: {
          DEFAULT: '#059669', // Emerald Green
          hover: '#047857',
          pressed: '#065F46',
          light: '#D1FAE5',
        },
        secondary: {
          DEFAULT: '#34D399',
          hover: '#10B981',
        },
        accent: {
          DEFAULT: '#D1FAE5', // Light Accent
          light: '#ECFDF5',
          hover: '#A7F3D0',
        },
        // Semantic aliases ensuring full project-wide consistency
        deep: '#064E3B',       // Dark emerald for headers, footers & sidebars
        plum: '#172B24',       // Primary Text / Dark Headings
        violet: '#34D399',     // Secondary Emerald
        lavender: {
          DEFAULT: '#D1FAE5',  // Light Accent Green
          light: '#ECFDF5',    // Subtle clean green background
        },
        surface: {
          bg: '#F5FAF7',       // Page Background
          card: '#FFFFFF',     // Card Background
        },
        ink: {
          DEFAULT: '#172B24',  // Primary Text
          muted: '#64748B',    // Secondary Text
        },
        line: '#E2E8F0',       // Borders
        border: '#E2E8F0',     // Borders alias
        success: '#16A34A',    // Success
        danger: '#DC2626',     // Error
        error: '#DC2626',      // Error alias
        warning: '#F59E0B',    // Warning
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
        pill: '999px',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(23, 43, 36, 0.04)',
        card: '0 8px 24px rgba(5, 150, 105, 0.08)',
        lift: '0 16px 40px rgba(5, 150, 105, 0.14)',
        focus: '0 0 0 4px rgba(5, 150, 105, 0.20)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #064E3B 0%, #0F291E 55%, #059669 140%)',
        'promo-gradient': 'linear-gradient(120deg, #059669 0%, #34D399 100%)',
        'soft-gradient': 'linear-gradient(180deg, #D1FAE5 0%, #F5FAF7 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
