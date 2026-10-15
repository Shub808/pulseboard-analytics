import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Vite resolves the `@/*` alias from tsconfig natively — no extra plugin.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    // Playwright specs live in tests/e2e and run under their own runner.
    exclude: ["tests/e2e/**", "node_modules/**"],
    restoreMocks: true,
  },
});
