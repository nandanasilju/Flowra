import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      colors: {
        plum: {
          50: "#F6F0FB",
          100: "#EADCF5",
          200: "#D3B8EA",
          300: "#B48ED9",
          500: "#7A45AE",
          600: "#5B2A86",
          700: "#4A2270",
          800: "#3A1B58",
        },
        teal: {
          50: "#E8F6F7",
          100: "#C7EAEC",
          500: "#14969F",
          600: "#0E7C86",
          700: "#0B636B",
        },
        sand: { 50: "#FBF8F5", 100: "#F4EEE8", 200: "#E8DFD6", 400: "#A69A8E", 600: "#6B6159", 800: "#3B3530" },
        level: { green: "#1B7F5A", yellow: "#946200", orange: "#C2410C", urgent: "#B42318" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: { lg: "1rem", md: "0.75rem", sm: "0.5rem" },
      fontFamily: {
        // One font family everywhere (system stack: works offline, supports Devanagari & Malayalam).
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Noto Sans", "Noto Sans Devanagari", "Noto Sans Malayalam", "sans-serif"],
      },
      keyframes: {
        pulsering: { "0%": { transform: "scale(1)", opacity: "0.55" }, "100%": { transform: "scale(1.6)", opacity: "0" } },
        slideup: { "0%": { transform: "translateY(100%)" }, "100%": { transform: "translateY(0)" } },
      },
      animation: {
        pulsering: "pulsering 1.4s ease-out infinite",
        slideup: "slideup 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
