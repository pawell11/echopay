import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 30_000,
    hookTimeout: 120_000,
    globalSetup: ["./vitest.global-setup.ts"],
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@vantagepay/utils": path.resolve(__dirname, "../../packages/utils/src"),
      "@vantagepay/api": path.resolve(__dirname, "../../packages/api/src"),
    },
  },
});