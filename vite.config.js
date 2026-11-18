import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],

  root: command === "serve" ? "demo" : undefined,
  server: { fs: { allow: [".."] } }, 
  build: {
    lib: {
      entry: "src/index.js",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
    },
    rollupOptions: {

      external: ["react", "react-dom", "react/jsx-runtime"],
    },
    cssCodeSplit: false, // one style.css
  },
}));