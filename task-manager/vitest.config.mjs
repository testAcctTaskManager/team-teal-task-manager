import { defineConfig } from 'vitest/config';
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    reporters: 'default',
    // Allow both component/unit tests and integration tests to be discovered.
    // Scripts choose which folders to run (tests/components vs tests/integration).
    include: ['tests/**/*.test.{js,ts,jsx,tsx}'],
  },
});
