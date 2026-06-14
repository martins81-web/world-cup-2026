import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000/api/health",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/worldcup2026_test?schema=public",
      ADMIN_SYNC_TOKEN: process.env.ADMIN_SYNC_TOKEN ?? "test-admin-sync-token-123",
      ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET ?? "test-admin-session-secret-123456789",
      NEXT_PUBLIC_API_SPORTS_WIDGET_KEY: process.env.NEXT_PUBLIC_API_SPORTS_WIDGET_KEY ?? "",
      NEXT_PUBLIC_API_SPORTS_WIDGET_HOST: process.env.NEXT_PUBLIC_API_SPORTS_WIDGET_HOST ?? "https://widgets.api-sports.io"
    }
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } }
  ]
});
