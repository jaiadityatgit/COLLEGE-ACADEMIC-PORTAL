/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        // Primary colors
        primary: {
          DEFAULT: "#18181b",
          hover:   "#27272a",
          active:  "#09090b",
          fg:      "#ffffff",
        },
        // Accent colors
        accent: {
          50:  "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#0f766e",
          600: "#115e59",
          700: "#134e4a",
          800: "#042f2e",
          900: "#021c1b",
        },
        indigo: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          500: "#18181b",
          600: "#0f172a",
        },
        // Pastel tokens
        pastel: {
          mint:   "#ecfdf5",
          "mint-fg": "#065f46",
          amber:  "#fffbeb",
          "amber-fg": "#92400e",
          rose:   "#fff1f2",
          "rose-fg": "#9f1239",
          sky:    "#f0f9ff",
          "sky-fg": "#075985",
          violet: "#f5f3ff",
          "violet-fg": "#5b21b6",
          slate:  "#f8fafc",
          "slate-fg": "#475569",
        },
        // Neutral palette
        slate: {
          50:  "#f8f9fa",
          100: "#f1f3f5",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          950: "#030712",
        },
        // Semantic light surface tokens
        surface: {
          DEFAULT: "#f8f9fa",
          canvas:  "#f8f9fa",
          card:    "#ffffff",
          raised:  "#ffffff",
          muted:   "#f3f4f6",
          border:  "#e5e7eb",
          hairline: "rgba(0, 0, 0, 0.05)",
          input:   "#ffffff",
        },
        ink: {
          DEFAULT:   "#0f172a",
          primary:   "#18181b",
          secondary: "#4b5563",
          muted:     "#6b7280",
          faint:     "#9ca3af",
        },
        // Dark surface tokens
        dark: {
          bg:       "#0f1117",
          surface:  "#161922",
          card:     "#1c202c",
          raised:   "#232838",
          border:   "rgba(255,255,255,0.07)",
          ink:      "#f8fafc",
          muted:    "#94a3b8",
          faint:    "#64748b",
        },
        brand: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          500: "#18181b",
          600: "#0f172a",
          700: "#020617",
        },
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg:   "0.75rem",   // 12px — inputs, small buttons
        xl:   "0.875rem",  // 14px — pills, tooltips
        "2xl": "1.125rem", // 18px — standard cards
        "3xl": "1.375rem", // 22px — large cards, containers
        "4xl": "1.75rem",  // 28px — floating docks
        full: "9999px",
      },
      boxShadow: {
        // SpaceIQ & Social Media diffuse, feathered shadows
        xs:      "0 1px 2px 0 rgba(0, 0, 0, 0.02)",
        sm:      "0 2px 6px -1px rgba(0, 0, 0, 0.04), 0 1px 3px -1px rgba(0, 0, 0, 0.02)",
        DEFAULT: "0 4px 16px -2px rgba(15, 23, 42, 0.04), 0 1px 4px -1px rgba(15, 23, 42, 0.02)",
        md:      "0 6px 20px -3px rgba(15, 23, 42, 0.05), 0 2px 6px -2px rgba(15, 23, 42, 0.03)",
        lg:      "0 10px 28px -4px rgba(15, 23, 42, 0.06), 0 4px 10px -3px rgba(15, 23, 42, 0.03)",
        card:    "0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 1px 4px -1px rgba(15, 23, 42, 0.02)",
        "card-hover": "0 12px 32px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.03)",
        float:   "0 16px 36px -6px rgba(15, 23, 42, 0.09), 0 6px 16px -4px rgba(15, 23, 42, 0.04)",
        pill:    "0 2px 8px -1px rgba(0, 0, 0, 0.06)",
        overlay: "0 24px 48px -12px rgba(0,0,0,0.14), 0 8px 16px -8px rgba(0,0,0,0.06)",
      },
      fontSize: {
        "2xs":  ["0.6875rem", { lineHeight: "1rem" }],       // 11px
        xs:     ["0.75rem",   { lineHeight: "1.125rem" }],   // 12px
        sm:     ["0.8125rem", { lineHeight: "1.25rem" }],    // 13px
        base:   ["0.875rem",  { lineHeight: "1.375rem" }],   // 14px
        md:     ["0.9375rem", { lineHeight: "1.5rem" }],     // 15px
        lg:     ["1.0625rem", { lineHeight: "1.625rem" }],   // 17px
        xl:     ["1.25rem",   { lineHeight: "1.75rem" }],    // 20px
        "2xl":  ["1.5rem",    { lineHeight: "2rem" }],       // 24px
        "3xl":  ["1.875rem",  { lineHeight: "2.25rem" }],    // 30px
        "4xl":  ["2.25rem",   { lineHeight: "2.5rem" }],     // 36px
      },
      spacing: {
        4.5: "1.125rem",
        13:  "3.25rem",
        15:  "3.75rem",
        18:  "4.5rem",
        22:  "5.5rem",
      },
      animation: {
        "fade-in":     "fadeIn 0.15s ease-out",
        "slide-up":    "slideUp 0.18s ease-out",
        "slide-left":  "slideLeft 0.2s ease-out",
        "scale-in":    "scaleIn 0.15s ease-out",
        "shimmer":     "shimmer 1.5s ease-in-out infinite",
        "pulse-soft":  "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideLeft: {
          "0%":   { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.6" },
        },
      },
      transitionDuration: {
        120: "120ms",
        180: "180ms",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
