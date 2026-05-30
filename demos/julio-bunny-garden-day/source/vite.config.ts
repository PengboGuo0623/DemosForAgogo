import legacy from "@vitejs/plugin-legacy";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    target: "es2018",
    cssTarget: "chrome61"
  },
  plugins: [
    legacy({
      targets: ["Chrome >= 61", "Android >= 7", "iOS >= 11"],
      modernPolyfills: false,
      renderLegacyChunks: true
    })
  ]
});
