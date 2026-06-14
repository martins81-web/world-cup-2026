import { describe, expect, it } from "vitest";
import { createAdminSession, hashAdminPassword, verifyAdminPassword, verifyAdminSession } from "@/lib/admin-auth";
import { hasAdminAccess } from "@/lib/admin-request";

describe("admin authentication", () => {
  it("verifies password hashes", () => {
    const hash = hashAdminPassword("secret", "fixedsalt");
    expect(verifyAdminPassword("secret", hash)).toBe(true);
    expect(verifyAdminPassword("wrong", hash)).toBe(false);
  });

  it("creates and verifies signed sessions", () => {
    expect(verifyAdminSession(createAdminSession("admin"))).toBe(true);
  });

  it("rejects unauthorized admin sync requests", () => {
    expect(hasAdminAccess(new Request("https://example.test/api/admin/sync"))).toBe(false);
  });

  it("accepts the server-side sync token", () => {
    const request = new Request("https://example.test/api/admin/sync", {
      headers: { "x-admin-sync-token": "test-admin-sync-token-123" }
    });
    expect(hasAdminAccess(request)).toBe(true);
  });
});
