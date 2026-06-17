import { defineConfig, devices } from "@playwright/test";

const e2ePort = process.env.E2E_PORT ?? "3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${e2ePort}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: `npm run dev -- -p ${e2ePort}`,
    url: `http://127.0.0.1:${e2ePort}/api/health`,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/worldcup2026_test?schema=public",
      ADMIN_SYNC_TOKEN: process.env.ADMIN_SYNC_TOKEN ?? "test-admin-sync-token-123",
      ADMIN_USERNAME: process.env.ADMIN_USERNAME ?? "admin",
      ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH ?? "",
      ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET ?? "test-admin-session-secret-123456789",
      API_SPORTS_WIDGETS_ENABLED: process.env.API_SPORTS_WIDGETS_ENABLED ?? "false",
      API_SPORTS_WIDGETS_KEY: process.env.API_SPORTS_WIDGETS_KEY ?? "",
      API_SPORTS_WIDGETS_HOST: process.env.API_SPORTS_WIDGETS_HOST ?? "v3.football.api-sports.io",
      API_SPORTS_WIDGETS_LEAGUE_ID: process.env.API_SPORTS_WIDGETS_LEAGUE_ID ?? "1",
      API_SPORTS_WIDGETS_SEASON: process.env.API_SPORTS_WIDGETS_SEASON ?? "2026",
      API_SPORTS_WIDGETS_THEME: process.env.API_SPORTS_WIDGETS_THEME ?? "light",
      API_SPORTS_WIDGETS_LANG: process.env.API_SPORTS_WIDGETS_LANG ?? "en"
    }
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } }
  ]
});
