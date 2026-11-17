import baseConfig from "@v1/ui/tailwind.config";
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  presets: [baseConfig],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#080D19",
          surface: "#0F172A",
          "surface-elevated": "#131F37",
          "surface-hover": "#172545",
          border: "rgba(148, 163, 184, 0.14)",
          "border-bright": "rgba(34, 211, 238, 0.3)",
          blue: "#2563EB",
          "blue-light": "#3B82F6",
          cyan: "#22D3EE",
          indigo: "#6366F1",
          emerald: "#10B981",
          amber: "#F59E0B",
        },
      },
      backgroundImage: {
        "radial-gradient": "radial-gradient(circle at 50% 0%, var(--tw-gradient-stops))",
        "radial-card": "radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(37, 99, 235, 0.08), transparent 40%)",
        "mesh-dark": "radial-gradient(at 0% 0%, rgba(37,99,235,0.12) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(34,211,238,0.1) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(99,102,241,0.08) 0px, transparent 50%)",
      },
      animation: {
        marquee: "marquee 25s linear infinite",
        marquee2: "marquee2 25s linear infinite",
        "pulse-subtle": "pulseSubtle 4s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        marquee2: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0%)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
} satisfies Config;
