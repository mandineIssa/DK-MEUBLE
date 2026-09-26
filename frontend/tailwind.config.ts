import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "var(--text-primary, #1a1a1a)",
          dark: "#141414",
          orange: "var(--accent-primary, #f68b1e)",
          "orange-dark": "var(--accent-primary-hover, #e07d16)",
        },
        ink: "#1C1C1A",
        graphite: "#5F5E5A",
        mist: "#F1EFE8",
        accent: {
          DEFAULT: "var(--accent-primary, #f68b1e)",
          dark: "var(--accent-primary-hover, #e07d16)",
        },
        whatsapp: "#25D366",
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        header: "0 1px 3px rgba(0,0,0,0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
