import type { Config } from "tailwindcss";

// Design tokens per eventconnect-specification.md, Section 17.
// Light theme only. Navy + amber. Card-based but restrained — most
// navigation is tabs/menus, cards are reserved for genuine summaries.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1C2B4A",
          50: "#EEF1F6",
          100: "#D6DCE9",
          200: "#AEB9D3",
          300: "#8697BC",
          400: "#5E74A6",
          500: "#3B537F", // secondary text on light surfaces
          600: "#28395C",
          700: "#1C2B4A", // brand primary
          800: "#141F36",
          900: "#0C1322",
        },
        amber: {
          DEFAULT: "#D9A44C",
          50: "#FDF6E9",
          100: "#FAEAC7",
          200: "#F3D48F",
          300: "#ECBE57",
          400: "#D9A441", // brand accent
          500: "#B98526",
          600: "#8F671D",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F7F8FA",
          border: "#E2E8F0",
        },
        state: {
          success: "#137333",
          successBg: "#E6F4EA",
          warning: "#B06000",
          warningBg: "#FEF7E0",
          danger: "#991B1B",
          dangerBg: "#FEF2F2",
          info: "#1967D2",
          infoBg: "#E8F0FE",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        control: "8px",
      },
      boxShadow: {
        ambient: "0px 4px 20px rgba(28, 43, 74, 0.06)",
        "ambient-hover": "0px 8px 30px rgba(28, 43, 74, 0.10)",
      },
      maxWidth: {
        prose: "72ch",
      },
    },
  },
  plugins: [],
};

export default config;
