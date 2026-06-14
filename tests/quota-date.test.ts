import { describe, expect, it } from "vitest";
import { startOfUtcDay } from "@/lib/date";

describe("quota date normalization", () => {
  it("normalizes dates to the start of the UTC day", () => {
    expect(startOfUtcDay(new Date("2026-06-14T23:59:59-04:00")).toISOString()).toBe("2026-06-15T00:00:00.000Z");
  });
});
