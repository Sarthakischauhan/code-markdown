import { defineConfig } from "tsup";
import { copyFileSync } from "fs";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "themes/index": "src/themes/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
  esbuildPlugins: [],
  minify: false,
  target: "es2020",
  onSuccess: async () => {
    copyFileSync("src/styles.css", "dist/styles.css");
  },
});
