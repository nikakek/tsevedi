import { describe, expect, it } from "vitest";
import { contactLinks, formatPhone, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it.each([
    ["555 12 34 56", "+995555123456"],
    ["555-123-456", "+995555123456"],
    ["0555123456", "+995555123456"],
    ["+995 555 12 34 56", "+995555123456"],
    ["995555123456", "+995555123456"],
    ["00995555123456", "+995555123456"],
    ["322 12 34 56", "+995322123456"],
    ["+374 91 123456", "+37491123456"],
  ])("normalises %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(["", "12345", "+995 555 12", "155123456", "abc"])("rejects %s", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe("formatPhone", () => {
  it("groups Georgian numbers for reading", () => {
    expect(formatPhone("+995555123456")).toBe("+995 555 12 34 56");
    expect(formatPhone("+37491123456")).toBe("+37491123456");
  });
});

describe("contactLinks", () => {
  it("builds call and messenger links", () => {
    expect(contactLinks.call("+995555123456")).toBe("tel:+995555123456");
    expect(contactLinks.whatsapp("+995555123456", "გამარჯობა")).toBe(
      "https://wa.me/995555123456?text=%E1%83%92%E1%83%90%E1%83%9B%E1%83%90%E1%83%A0%E1%83%AF%E1%83%9D%E1%83%91%E1%83%90",
    );
    expect(contactLinks.viber("+995555123456")).toBe("viber://chat?number=%2B995555123456");
  });
});
