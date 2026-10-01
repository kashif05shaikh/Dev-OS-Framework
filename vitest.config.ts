import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "tests/database/**"],
    coverage: {
      enabled: true,
      provider: "v8",
      reportOnFailure: true,
      reporter: ["text", "text-summary", "json-summary"],
      include: ["src/lib/**/*.ts", "src/components/states.tsx"],
      exclude: ["src/components/ui/**", "src/**/*.d.ts", "**/*.test.{ts,tsx}"],
    },
  },
});
