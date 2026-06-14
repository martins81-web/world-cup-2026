import { expect, test } from "@playwright/test";

test("homepage and widget fallback", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /World Cup 2026/i })).toBeVisible();
  await expect(page.getByTestId("widget-fallback").first()).toBeVisible();
});

test("matches filters and details", async ({ page }) => {
  await page.goto("/matches?group=Group%20A");
  await expect(page.getByRole("heading", { name: "Matches" })).toBeVisible();
  await page.getByPlaceholder("Team").fill("Development");
  await page.getByRole("button", { name: "Filter" }).click();
  await expect(page).toHaveURL(/team=Development/);
  await page.goto("/matches/1");
  await expect(page.getByRole("heading", { name: /Match/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lineups" })).toBeVisible();
});

test("groups, third place, bracket and statistics", async ({ page }) => {
  await page.goto("/groups");
  await expect(page.getByRole("heading", { name: "Groups" })).toBeVisible();
  await expect(page.getByRole("table").first()).toBeVisible();
  await page.goto("/third-place");
  await expect(page.getByRole("heading", { name: "Third-place Ranking" })).toBeVisible();
  await page.goto("/bracket");
  await expect(page.getByRole("heading", { name: "Bracket" })).toBeVisible();
  await expect(page.getByRole("table", { name: /Accessible knockout bracket/i })).toBeVisible();
  await page.goto("/statistics");
  await expect(page.getByRole("heading", { name: "Statistics" })).toBeVisible();
});

test("team, squad and player pages", async ({ page }) => {
  await page.goto("/teams");
  const team = page.locator("article a").first();
  await expect(team).toBeVisible();
  await team.click();
  await expect(page.getByRole("link", { name: "Squad" })).toBeVisible();
  await page.getByRole("link", { name: "Squad" }).click();
  await expect(page.getByRole("heading", { name: /Squad/i })).toBeVisible();
  const player = page.locator("article a").first();
  if (await player.count()) {
    await player.click();
    await expect(page.getByRole("heading")).toBeVisible();
  }
});

test("admin login, unauthorized access and manual synchronization", async ({ page }) => {
  await page.goto("/admin/sync");
  await expect(page).toHaveURL(/\/admin/);
  await page.goto("/admin");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("test-admin-sync-token-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/sync/);
  await expect(page.getByRole("button", { name: /Run sync/i })).toBeVisible();
});

test("provider conflict resolution page", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("test-admin-sync-token-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.goto("/admin/mapping-errors");
  await expect(page.getByRole("heading", { name: "API Mapping Errors" })).toBeVisible();
});

test("mobile navigation and focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  await expect(page.getByRole("link", { name: "matches" })).toBeVisible();
});
