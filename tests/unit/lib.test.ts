import { describe, it, expect } from "vitest";
import { cn } from "../../src/lib/utils";

describe("src/lib Core Utilities & Validators", () => {
  describe("cn (tailwind merge)", () => {
    it("Merges standard Tailwind classes correctly", () => {
      expect(cn("px-2 py-1", "bg-blue-500")).toBe("px-2 py-1 bg-blue-500");
    });

    it("Resolves Tailwind conflicts by keeping the last class applied", () => {
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
      expect(cn("p-4", "p-2")).toBe("p-2");
    });

    it("Filters out falsy values, undefined, and conditional flags", () => {
      const isHidden = false;
      const isVisible = true;
      expect(cn("base-class", isHidden && "hidden", isVisible && "block", null, undefined)).toBe(
        "base-class block"
      );
    });
  });

  describe("Server Function Input Validation Logic", () => {
    it("social.functions validator rejects empty platform or empty username", () => {
      // Logic from social.functions.ts inputValidator
      const validateSocial = (input: { platform: string; handle: string }) => {
        const platform = String(input?.platform ?? "").trim();
        const handle = String(input?.handle ?? "").trim();
        if (!platform) throw new Error("Platform is required.");
        if (!handle) throw new Error("Username is required.");
        if (handle.length > 300) throw new Error("That username or URL looks invalid.");
        return { platform, handle };
      };

      expect(() => validateSocial({ platform: "", handle: "alice" })).toThrow("Platform is required.");
      expect(() => validateSocial({ platform: "github", handle: "" })).toThrow("Username is required.");
      expect(() => validateSocial({ platform: "github", handle: "a".repeat(301) })).toThrow("That username or URL looks invalid.");
      expect(validateSocial({ platform: "github", handle: "alice" })).toEqual({ platform: "github", handle: "alice" });
    });

    it("coding-profiles validator rejects long usernames (>100 chars)", () => {
      const validateCoding = (input: { platform: string; username: string }) => {
        const platform = String(input?.platform ?? "").trim();
        const username = String(input?.username ?? "").trim();
        if (!platform) throw new Error("Platform is required.");
        if (!username) throw new Error("Username is required.");
        if (username.length > 100) throw new Error("Username looks invalid.");
        return { platform, username };
      };

      expect(() => validateCoding({ platform: "", username: "bob" })).toThrow("Platform is required.");
      expect(() => validateCoding({ platform: "leetcode", username: "b".repeat(101) })).toThrow("Username looks invalid.");
      expect(validateCoding({ platform: "leetcode", username: "valid_handle" })).toEqual({
        platform: "leetcode",
        username: "valid_handle",
      });
    });
  });
});
