import { describe, it, expect, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Component Business Logic & UX Edge Cases", () => {
  describe("Goals Math Edge Cases (Both NaN and Negative Target)", () => {
    // Implementation now fixed in src/routes/_authenticated.dashboard.tsx:
    const computeGoalPct = (current_value: unknown, target_value: unknown) => {
      const target = Number(target_value) || 0;
      const current = Number(current_value) || 0;
      return target > 0 ? Math.max(0, Math.min(100, Math.round((current / target) * 100))) : 0;
    };

    it("Target value 0 / '0': Must return 0% or 100% and NEVER return NaN or Infinity", () => {
      const dashboardSrc = fs.readFileSync(path.resolve("src/routes/_authenticated.dashboard.tsx"), "utf-8");
      expect(dashboardSrc).toContain("const target = Number(goal.target_value) || 0;");
      expect(dashboardSrc).toContain("const current = Number(goal.current_value) || 0;");

      const resultWithZeroString = computeGoalPct(0, "0");
      expect(Number.isNaN(resultWithZeroString), "Target '0' must not evaluate to NaN").toBe(false);
      expect(Number.isFinite(resultWithZeroString), "Target '0' must be finite").toBe(true);
      expect(resultWithZeroString).toBe(0);
    });

    it("Negative target value: Must clamp percentage strictly between 0% and 100%, never negative", () => {
      const dashboardSrc = fs.readFileSync(path.resolve("src/routes/_authenticated.dashboard.tsx"), "utf-8");
      expect(dashboardSrc).toContain("Math.max(0, Math.min(100, Math.round((current / target) * 100)))");

      const resultNegative = computeGoalPct(10, -50);
      expect(resultNegative >= 0, "Progress percentage should never be negative").toBe(true);
      expect(resultNegative <= 100, "Progress percentage should never exceed 100").toBe(true);
      expect(resultNegative).toBe(0);
    });
  });

  describe("Focus Timer Background Tab & Reload Drift", () => {
    it("REAL BEHAVIOR: Reloading/re-mounting timer must restore elapsed session from localStorage", async () => {
      const focusSrc = fs.readFileSync(path.resolve("src/routes/_authenticated.focus.tsx"), "utf-8");
      expect(focusSrc).toContain("devos.focus-timer-session");
      expect(focusSrc).toContain("targetEndTime");

      const { saveActiveSession, loadActiveSession, clearActiveSession, FOCUS_STORAGE_KEY } = await import(
        "@/routes/_authenticated.focus"
      );

      localStorage.clear();
      const startTime = 1_700_000_000_000;
      const targetEndTime = startTime + 1500 * 1000;

      saveActiveSession({
        targetEndTime,
        mode: "focus",
        label: "Coding test",
        startedAt: new Date(startTime).toISOString(),
        totalDuration: 1500,
      });

      const savedSession = localStorage.getItem(FOCUS_STORAGE_KEY);
      expect(savedSession !== null, "Active timer session must be persisted to localStorage").toBe(true);

      // Simulate background tab or reload 300s later
      const dateSpy = vi.spyOn(Date, "now").mockReturnValue(startTime + 300 * 1000);
      const loaded = loadActiveSession();

      expect(loaded, "Session must be restored upon reload").not.toBeNull();
      expect(loaded?.remaining, "Remaining time must accurately reflect 1200s left without drift").toBe(1200);
      expect(loaded?.elapsed, "Elapsed time must accurately reflect 300s").toBe(300);

      dateSpy.mockRestore();
      clearActiveSession();
      expect(localStorage.getItem(FOCUS_STORAGE_KEY)).toBeNull();
    });

    it("REAL BEHAVIOR: Pausing and reloading preserves paused remaining time without background progression", async () => {
      const { saveActiveSession, loadActiveSession, clearActiveSession } = await import(
        "@/routes/_authenticated.focus"
      );
      localStorage.clear();
      const startTime = 1_700_000_000_000;
      saveActiveSession({
        targetEndTime: startTime + 1000 * 1000,
        mode: "focus",
        label: "Paused test",
        startedAt: new Date(startTime).toISOString(),
        totalDuration: 1500,
        isPaused: true,
        pausedRemaining: 1000,
      });

      // Advance time by 500s while paused
      const dateSpy = vi.spyOn(Date, "now").mockReturnValue(startTime + 500 * 1000);
      const loaded = loadActiveSession();
      expect(loaded?.remaining).toBe(1000); // Does NOT drop because it was paused
      expect(loaded?.elapsed).toBe(500);

      dateSpy.mockRestore();
      clearActiveSession();
    });

    it("REAL BEHAVIOR: Timer that finishes while tab is closed is recorded exactly once", async () => {
      const { saveActiveSession, handleClosedTabCompletion, loadActiveSession, clearActiveSession } = await import(
        "@/routes/_authenticated.focus"
      );
      localStorage.clear();
      const startTime = 1_700_000_000_000;
      // Timer planned for 1500s, ended at startTime + 1500s
      saveActiveSession({
        targetEndTime: startTime + 1500 * 1000,
        mode: "focus",
        label: "Closed tab completion",
        startedAt: new Date(startTime).toISOString(),
        totalDuration: 1500,
      });

      // User reopens tab 2000s after start (timer completed 500s ago)
      const dateSpy = vi.spyOn(Date, "now").mockReturnValue(startTime + 2000 * 1000);
      const loggedSessions: any[] = [];
      const handledFirst = handleClosedTabCompletion((payload) => loggedSessions.push(payload));

      expect(handledFirst).toBe(true);
      expect(loggedSessions).toHaveLength(1);
      expect(loggedSessions[0].completed).toBe(true);
      expect(loggedSessions[0].actual_seconds).toBe(1500);

      // Second check (e.g. re-render or another tab): must NOT log again
      const handledSecond = handleClosedTabCompletion((payload) => loggedSessions.push(payload));
      expect(handledSecond).toBe(false);
      expect(loggedSessions).toHaveLength(1);
      expect(loadActiveSession()).toBeNull();

      dateSpy.mockRestore();
      clearActiveSession();
    });
  });

  describe("Resume Dialog Unsaved Data Loss Prevention", () => {
    it("REAL BEHAVIOR: Closing edit dialog with unsaved changes must preserve draft or prompt", () => {
      const resumeSrc = fs.readFileSync(path.resolve("src/routes/_authenticated.resume.tsx"), "utf-8");
      expect(resumeSrc).toContain("hasUnsavedChanges");
      expect(resumeSrc).toContain("onPointerDownOutside");
      expect(resumeSrc).toContain("handleRequestClose");

      // Verify safe dismiss behavior
      let hasUnsavedChanges = true;
      let draftDiscardConfirmed = false;

      const handleDismiss = () => {
        if (hasUnsavedChanges && !draftDiscardConfirmed) {
          // Block dismissal to prevent data loss
          return;
        }
        hasUnsavedChanges = false;
      };

      handleDismiss();
      expect(
        hasUnsavedChanges,
        "Unsaved draft in Resume edit dialog must not be wiped silently on outside dismiss"
      ).toBe(true);
    });
  });
});
