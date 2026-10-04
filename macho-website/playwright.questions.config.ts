import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "questions.spec.ts",
  workers: 1,
  retries: 0,
  use: { baseURL: "http://localhost:4318" },
  webServer: [
    {
      command: "node e2e/fixtures/questions-server.mjs",
      url: "http://localhost:4319/health",
    },
    {
      command: "npm run dev -- --port 4318",
      url: "http://localhost:4318/questions",
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:4319",
        SUPABASE_SERVICE_ROLE_KEY: "question-test-service-key",
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
        TURNSTILE_SECRET_KEY: "",
        RESEND_API_KEY: "",
      },
    },
  ],
});
