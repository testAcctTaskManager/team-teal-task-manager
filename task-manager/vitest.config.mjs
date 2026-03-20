import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    reporters: "default",
    // Only discover component/unit tests by default.
    // Integration tests require a running server + JWT tokens and are run
    // separately via `npm run test:integration` (see scripts/test-with-server.mjs).
    include: ["tests/components/**/*.test.{js,ts,jsx,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/components/**/*.{js,jsx}", "src/pages/**/*.{js,jsx}", "src/contexts/**/*.{js,jsx}"],
      exclude: ["*ProjectSidebar", "*Board"],
    },
  },
});

