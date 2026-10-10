import { describe, expect, it } from "vitest";
import { validCoordinate } from "@/lib/map/coordinates";

describe("map coordinate validation", () => {
  it("accepts valid geographic coordinates", () => {
    expect(validCoordinate(13.04, 80.23)).toBe(true);
    expect(validCoordinate(-90, 180)).toBe(true);
  });

  it("rejects missing, non-numeric, and out-of-range coordinates", () => {
    expect(validCoordinate(Number.NaN, 80.23)).toBe(false);
    expect(validCoordinate(91, 80.23)).toBe(false);
    expect(validCoordinate(13.04, -181)).toBe(false);
  });
});
