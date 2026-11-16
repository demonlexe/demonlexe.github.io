import { describe, expect, it } from "vitest";
import { yearsSince } from "./experience.ts";

describe("yearsSince", () => {
  it("counts whole calendar years from the start year to now", () => {
    expect(yearsSince(2016, new Date("2026-11-15T12:00:00Z"))).toBe(10);
  });

  it("ticks over on 1 January", () => {
    expect(yearsSince(2016, new Date("2026-12-31T12:00:00Z"))).toBe(10);
    expect(yearsSince(2016, new Date("2027-01-01T12:00:00Z"))).toBe(11);
  });

  it("is zero in the start year and never negative", () => {
    expect(yearsSince(2026, new Date("2026-06-01T12:00:00Z"))).toBe(0);
    expect(yearsSince(2030, new Date("2026-06-01T12:00:00Z"))).toBe(0);
  });

  it("defaults to the current date", () => {
    expect(yearsSince(2016)).toBe(new Date().getFullYear() - 2016);
  });
});
