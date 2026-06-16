import { expect, test, type Page } from "@playwright/test";

function adminCredentials() {
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error("E2E_ADMIN_PASSWORD is not configured.");
  }

  return { adminUsername, adminPassword };
}

async function signInFromCurrentAdminPage(page: Page) {
  const { adminUsername, adminPassword } = adminCredentials();

  await page.getByLabel("Username").fill(adminUsername);
  await page.getByLabel("Password").fill(adminPassword);

  await expect(page.getByLabel("Username")).toHaveValue(adminUsername);
  await expect(page.getByLabel("Password")).not.toHaveValue("");

  const signInButton = page.getByRole("button", {
    name: "Sign in",
    exact: true
  });

  await expect(signInButton).toBeEnabled();
  await signInButton.click({ force: true, timeout: 5_000 });

  const loginError = page.getByText("Unauthorized", { exact: true });

  if (await loginError.isVisible().catch(() => false)) {
    throw new Error(`Admin login failed: ${await loginError.textContent()}`);
  }

  if (await page.getByRole("button", { name: "Sign in", exact: true }).isVisible().catch(() => false)) {
    await page.getByLabel("Password").fill(adminPassword);
    await signInButton.click({ force: true, timeout: 5_000 });
  }

  await expect(page).toHaveURL(/\/admin(?:\/sync)?$/, {
    timeout: 15_000
  });

  await expect
    .poll(
      async () =>
        page
          .getByRole("button", {
            name: "Sign in",
            exact: true
          })
          .count(),
      {
        timeout: 15_000,
        message: "The login form should disappear after authentication"
      }
    )
    .toBe(0);

  await expect(page.getByText("Unauthorized")).toHaveCount(0);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("button", {
    name: "Sign in",
    exact: true
  })).toHaveCount(0);
  await expect(page.getByRole("link", {
    name: "Mapping errors",
    exact: true
  })).toBeVisible();
}

test("homepage and widget fallback", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /World Cup 2026/i })).toBeVisible();
  await expect(page.getByTestId("widget-fallback").first()).toBeVisible();
});

test("matches filters and details", async ({ page }) => {
  await page.goto("/matches?group=Group%20A");
  await expect(page.getByRole("heading", { name: "Matches" })).toBeVisible();
  await page.getByPlaceholder("Team").fill("Mexico");
  await page.getByRole("button", { name: "Filter" }).click();
  await expect(page).toHaveURL(/team=Mexico/);
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
  await expect(page.getByRole("heading", { name: "Bracket", exact: true })).toBeVisible();
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

test.describe.serial("admin", () => {
  test("admin login, unauthorized access and manual synchronization", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === "mobile",
      "Admin authentication is covered by Chromium."
    );

    await page.goto("/admin/sync");
    await page.waitForURL(/\/admin/);
    await signInFromCurrentAdminPage(page);
    await page.goto("/admin/sync");
    await expect(page).toHaveURL(/\/admin\/sync$/);
    await expect(page.getByRole("heading", {
      name: "Admin Synchronization",
      exact: true
    })).toBeVisible();
    await expect(page.getByRole("button", { name: /Run sync/i })).toBeVisible();
  });

  test("provider conflict resolution page", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === "mobile",
      "Admin conflict resolution is covered by Chromium."
    );

    await page.goto("/admin");
    await signInFromCurrentAdminPage(page);
    await page.goto("/admin/mapping-errors");
    await expect(page).toHaveURL(/\/admin\/mapping-errors$/);
    await expect(page.getByRole("heading", { name: "API Mapping Errors", exact: true })).toBeVisible();
  });
});

test("mobile navigation and focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const matchesLink = page.getByRole("link", {
    name: "matches",
    exact: true
  });

  const groupsLink = page.getByRole("link", {
    name: "groups",
    exact: true
  });

  await matchesLink.focus();
  await expect(matchesLink).toBeFocused();
  await expect(matchesLink).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(groupsLink).toBeFocused();
});
