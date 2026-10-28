import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        crmate: {
          dark: '#292D32',
          blue: '#8FC2F0',
          green: '#77CE69',
          canvas: '#EFF3F8',
          card: '#FFFFFF',
          border: '#E2E8F0',
          subtle: '#64748B',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Rounded"',
          '"SF Pro Display"',
          '"SF Pro"',
          'var(--font-outfit)',
          'var(--font-urbanist)',
          'var(--font-cairo)',
          'system-ui',
          'sans-serif'
        ],
        arabic: ['var(--font-cairo)', 'system-ui', 'sans-serif'],
        urbanist: ['var(--font-urbanist)', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'sans-serif'],
        num: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Rounded"',
          '"SF Pro Display"',
          '"SF Pro"',
          'var(--font-outfit)',
          'var(--font-urbanist)',
          'sans-serif'
        ],
        mono: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Rounded"',
          '"SF Pro Display"',
          'var(--font-outfit)',
          'ui-monospace',
          'monospace'
        ],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
