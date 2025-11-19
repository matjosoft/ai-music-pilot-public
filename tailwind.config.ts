import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",
        secondary: "#8B5CF6",
        success: "#10B981",
        // Dark theme colors
        dark: {
          bg: "#0f0f15",
          card: "#1a1a24",
          lighter: "#252533",
        },
        // Neon accent colors
        neon: {
          purple: "#B794F6",
          cyan: "#06B6D4",
          magenta: "#EC4899",
          green: "#10B981",
        },
      },
      boxShadow: {
        'neon-purple': '0 0 20px rgba(183, 148, 246, 0.5), 0 0 40px rgba(183, 148, 246, 0.3)',
        'neon-cyan': '0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.3)',
        'neon-magenta': '0 0 20px rgba(236, 72, 153, 0.5), 0 0 40px rgba(236, 72, 153, 0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
