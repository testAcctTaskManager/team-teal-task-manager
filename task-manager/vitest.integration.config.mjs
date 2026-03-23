import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.{js,ts,jsx,tsx}"],
    // Integration tests share a real database — running files concurrently causes
    // race conditions when multiple tests mutate the same rows (e.g. user roles).
    fileParallelism: false,
  },
});
