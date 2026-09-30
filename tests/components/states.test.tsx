import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { LoadingState, ErrorState, EmptyState } from "../../src/components/states";

describe("Component UI States (Loading, Error, Empty)", () => {
  describe("LoadingState", () => {
    it("Renders default loading text when no label is provided", () => {
      const { container } = render(<LoadingState />);
      // Default label has a non-breaking space or ellipsis
      expect(container.textContent).toMatch(/Loading/i);
    });

    it("Renders custom label text provided by props", () => {
      render(<LoadingState label="Syncing LeetCode stats..." />);
      expect(screen.getByText("Syncing LeetCode stats...")).toBeDefined();
    });
  });

  describe("ErrorState", () => {
    it("Displays Error object message clearly to user", () => {
      const testError = new Error("Failed to load goals from database.");
      render(<ErrorState error={testError} />);
      expect(screen.getByText("Failed to load goals from database.")).toBeDefined();
    });

    it("Falls back to generic message when error object is missing or non-Error", () => {
      render(<ErrorState error={null} />);
      expect(screen.getByText("Something went wrong.")).toBeDefined();
    });

    it("Calls onRetry callback when 'Try again' button is clicked", () => {
      const retrySpy = vi.fn();
      render(<ErrorState error={new Error("Timeout")} onRetry={retrySpy} />);

      const retryBtn = screen.getByRole("button", { name: /try again/i });
      fireEvent.click(retryBtn);
      expect(retrySpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("EmptyState", () => {
    it("Renders title, description, and action button", () => {
      const actionSpy = vi.fn();
      render(
        <EmptyState
          title="No projects found"
          description="Start building your developer portfolio."
          action={<button onClick={actionSpy}>New Project</button>}
        />,
      );

      expect(screen.getByText("No projects found")).toBeDefined();
      expect(screen.getByText("Start building your developer portfolio.")).toBeDefined();

      const btn = screen.getByRole("button", { name: "New Project" });
      fireEvent.click(btn);
      expect(actionSpy).toHaveBeenCalledTimes(1);
    });
  });
});
