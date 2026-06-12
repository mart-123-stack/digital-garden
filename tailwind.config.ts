import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        void: "#03040a",
        starlight: "#eef4ff",
        comet: "#f5c84b",
        roseglow: "#e85d75"
      },
      fontFamily: {
        display: ["var(--font-serif)", "Georgia", "serif"],
        body: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        "ship-ring": "0 0 0 1px rgba(238,244,255,0.28), 0 0 28px rgba(155,220,255,0.16)"
      }
    }
  },
  plugins: []
};

export default config;
