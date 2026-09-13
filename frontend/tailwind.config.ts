import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./types/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light forensic interface
        app: { DEFAULT: "#f1f3f6" },
        surface: { DEFAULT: "#ffffff", elevated: "#f7f8fa", subtle: "#f0f2f5" },
        border: { soft: "#e4e7ec", main: "#d1d5db", DEFAULT: "#d1d5db" },
        // Dark investigation workspace
        inv: {
          bg: "#0c1220",
          surface: "#111827",
          elevated: "#172032",
          border: "#1e2d3d",
          "border-s": "#253448",
        },
        // Accent
        accent: {
          DEFAULT: "#0f76ad",
          dim: "#0e6699",
          soft: "rgba(15,118,173,0.10)",
          inv: "#38bdf8",
        },
        // Text
        txt: {
          primary: "#111827",
          secondary: "#4b5563",
          muted: "#9ca3af",
          inv: "#e8edf5",
          "inv-dim": "#7d8fa3",
          "inv-muted": "#3f5168",
        },
        // Risk semantic
        risk: {
          high: "#dc2626",
          med: "#d97706",
          low: "#059669",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8) inset",
        "card-hover": "0 4px 16px rgba(0,0,0,0.1)",
        "inv-panel": "0 4px 20px rgba(0,0,0,0.35)",
        "risk-high": "0 0 18px rgba(220,38,38,0.15)",
        "risk-med": "0 0 14px rgba(217,119,6,0.12)",
        "risk-low": "0 0 12px rgba(5,150,105,0.12)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-in-up": "slideInUp 0.3s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "node-pulse": "nodePulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        nodePulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(220,38,38,0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(220,38,38,0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
