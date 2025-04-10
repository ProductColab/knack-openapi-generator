import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: [/^node:.*/],
    },
    target: "node16",
    outDir: "dist",
    emptyOutDir: true,
    ssr: true,
  },
});
