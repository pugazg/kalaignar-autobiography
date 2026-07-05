import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./sections/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0F1720",
        paper: "#FAF7F1",
        mist: "#E8E2D6",
        marina: { DEFAULT: "#0E5D63", light: "#1B7F87", faint: "#0E5D6314" },
        brass: "#B98A2F",
        night: { DEFAULT: "#0C1116", surface: "#131B23", text: "#EDE7DB" },
      },
      fontFamily: {
        display: ["var(--font-newsreader)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        tamil: ["var(--font-tamil)", "serif"],
      },
      maxWidth: { content: "72rem" },
      keyframes: {
        scrollhint: {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(10px)", opacity: "0" },
        },
      },
      animation: { scrollhint: "scrollhint 1.6s ease-in-out infinite" },
    },
  },
  plugins: [],
};
export default config;
