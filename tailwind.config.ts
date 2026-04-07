import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sport Seven Brand Colors
        brand: {
          primary: '#1FA3C8',        // Azul turquesa - header y elementos principales
          primaryLight: '#E8F7FB',   // Derivado claro para fondos
          primaryDark: '#1889A8',    // Versión más oscura para hover
          secondary: '#F7931E',      // Naranja - botones principales
          secondaryLight: '#FDB14E', // Naranja claro para hover
          secondaryDark: '#E07D0A',  // Naranja oscuro para active
          accent: '#FFD24A',         // Amarillo - acentos
          accentLight: '#FFF3C4',    // Amarillo claro para fondos
        },
        // Semantic colors
        status: {
          confirmed: '#22c55e',
          confirmedBg: '#dcfce7',
          pending: '#eab308',
          pendingBg: '#fef9c3',
          cancelled: '#ef4444',
          cancelledBg: '#fee2e2',
          occupied: '#9ca3af',
          occupiedBg: '#f3f4f6',
        },
        // Neutral colors
        background: '#F6F8FA',
        text: {
          dark: '#1F2937',
          medium: '#4B5563',
          light: '#6B7280',
        },
      },
    },
  },
  plugins: [],
};
export default config;
