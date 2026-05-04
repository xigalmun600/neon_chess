import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],

  theme: {
    extend: {
      colors: {
        primary: "#00ffff",
        secondary: "#ff00ff",
        "bg-dark": "#0e1115",
        "surface-dark": "#161b22",
        "surface-light": "#1c222a",
        "border-muted": "#273a3a",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)",
        "neon-sm": "0 0 5px rgba(0, 255, 255, 0.4)",
        "neon-magenta":
          "0 0 10px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(0, 255, 255, 0.2)" },
          "50%": { boxShadow: "0 0 20px rgba(0, 255, 255, 0.6)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 3s infinite",
      },
    },
  },

  plugins: [],
} as Config;
