import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0B0B0B",
          dark: "#141414",
          orange: "#FF7A00",
          "orange-dark": "#E66A00",
        },
        ink: "#1C1C1A",
        graphite: "#5F5E5A",
        mist: "#F1EFE8",
        accent: {
          DEFAULT: "#FF7A00",
          dark: "#E66A00",
        },
        whatsapp: "#25D366",
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
