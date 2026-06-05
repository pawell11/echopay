import type { Config } from "tailwindcss";
import { tailwindPreset } from "@vantagepay/config/tailwind";

const config: Config = {
  presets: [tailwindPreset],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow": "radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)",
        "card-shine": "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
      },
    },
  },
};

export default config;
