import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#080a0f",
        surface: "#0f141f",
        "surface-light": "#171f30",
        border: "#1e293b",
        "border-glow": "#22c55e33",
        neon: {
          green: "#00ff88",
          emerald: "#10b981",
          lime: "#84cc16",
        },
        accent: {
          gold: "#f59e0b",
          red: "#ef4444",
          cyan: "#06b6d4",
          purple: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Rajdhani", "Chakra Petch", "sans-serif"],
      },
      boxShadow: {
        "neon-green": "0 0 20px -3px rgba(0, 255, 136, 0.35)",
        "neon-glow": "0 0 35px -5px rgba(16, 185, 129, 0.25)",
        "card-glow": "0 8px 30px rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glowPulse: {
          "0%": { boxShadow: "0 0 15px rgba(0, 255, 136, 0.2)" },
          "100%": { boxShadow: "0 0 30px rgba(0, 255, 136, 0.5)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
