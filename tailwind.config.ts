import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: "#0f7a4f",
        ink: "#16211f",
        gold: "#d3a536"
      }
    }
  },
  plugins: []
};

export default config;
