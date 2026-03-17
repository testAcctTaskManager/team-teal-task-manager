import { defineConfig } from "cypress";
import viteConfig from "./vite.config.js";

export default defineConfig({
  e2e: {
    baseUrl: "http://127.0.0.1:5173",
    specPattern: "tests/cypress/integration/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "tests/cypress/support/integration.js",
    // Pass test tokens from env vars (set by test-with-server.mjs)
    setupNodeEvents(on, config) {
      config.env.TEST_SESSION_TOKEN = process.env.CYPRESS_TEST_SESSION_TOKEN || process.env.TEST_SESSION_TOKEN;
      config.env.TEST_ADMIN_SESSION_TOKEN = process.env.CYPRESS_TEST_ADMIN_SESSION_TOKEN || process.env.TEST_ADMIN_SESSION_TOKEN;
      config.env.TEST_MUTABLE_SESSION_TOKEN = process.env.CYPRESS_TEST_MUTABLE_SESSION_TOKEN || process.env.TEST_MUTABLE_SESSION_TOKEN;
      
      // Add log task for debugging
      on('task', {
        log(message) {
          console.log('[CYPRESS DEBUG]', message);
          return null;
        },
      });
      
      return config;
    },
  },
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
      viteConfig,
    },
    specPattern: "tests/cypress/component/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "tests/cypress/support/component.jsx",
    indexHtmlFile: "tests/cypress/support/component-index.html",
  },
});
