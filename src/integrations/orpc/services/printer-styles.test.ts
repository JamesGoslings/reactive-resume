import { describe, expect, it } from "vite-plus/test";

import { getSubsequentPageTopMarginStyle } from "./printer-styles";

describe("getSubsequentPageTopMarginStyle", () => {
  it("uses print padding when the template applies page padding", () => {
    expect(getSubsequentPageTopMarginStyle(12, 24)).toContain("@page { margin-top: 12pt; }");
  });

  it("falls back to the resume page margin when no print padding is applied", () => {
    expect(getSubsequentPageTopMarginStyle(0, 24)).toContain("@page { margin-top: 24pt; }");
  });

  it("leaves the first PDF page unchanged", () => {
    expect(getSubsequentPageTopMarginStyle(12, 24)).toContain("@page :first { margin-top: 0; }");
  });

  it("returns null when there is no vertical spacing", () => {
    expect(getSubsequentPageTopMarginStyle(0, 0)).toBeNull();
  });
});
