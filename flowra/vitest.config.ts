import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Fixed TZ so day bucketing in tests is deterministic.
    env: { TZ: "Asia/Kolkata" },
  },
});
