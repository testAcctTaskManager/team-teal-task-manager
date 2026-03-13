import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import TimeZone from "../../src/components/TimeZone.jsx";

describe("TimeZone", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders without crashing when user is null", () => {
    render(<TimeZone user={null} />);
    expect(document.body).toBeTruthy();
  });

  it("displays 'No time zone found' when user has no timezone", () => {
    const user = {
      id: 1,
      display_name: "Samantha",
      timezone: null,
    };
    render(<TimeZone user={user} />);
    expect(screen.getByText(/No time zone found/i)).toBeTruthy();
  });

  it("displays time and date when user has a timezone", () => {
    const user = {
      id: 1,
      display_name: "Jesse",
      timezone: "America/Phoenix",
    };
    render(<TimeZone user={user} />);
    const content = screen.getByText(/Time:/);
    expect(content.textContent).toMatch(/\d{1,2}:\d{2}/);
    expect(content.textContent).toMatch(/\d{1,2}/);
    expect(content.textContent).toMatch(/[A-Z]{3,4}|GMT[+-]?\d*/);
  });

  it("displays different timezone correctly with date", () => {
    const user = {
      id: 1,
      display_name: "Jose",
      timezone: "Asia/Tokyo",
    };
    render(<TimeZone user={user} />);
    const content = screen.getByText(/Time:/);
    expect(content.textContent).toMatch(/\d{1,2}:\d{2}/);
    expect(content.textContent).toMatch(/\d{1,2}/);
    expect(content.textContent).toMatch(/[A-Z]{3,4}|GMT[+-]?\d*/);
  });

  it("updates time", () => {
    vi.useFakeTimers();
    const user = {
      id: 1,
      display_name: "Eliza",
      timezone: "UTC",
    };
    render(<TimeZone user={user} />);
    const timeDiv = screen.getByText(/Time:/);
    const initialText = timeDiv.textContent;
    const initialMinuteMatch = initialText.match(/:(\d{2})/);
    const initialMinute = initialMinuteMatch
      ? parseInt(initialMinuteMatch[1])
      : null;

    vi.advanceTimersByTime(60000);

    waitFor(() => {
      const updatedText = timeDiv.textContent;
      const updatedMinuteMatch = updatedText.match(/:(\d{2})/);
      const updatedMinute = updatedMinuteMatch
        ? parseInt(updatedMinuteMatch[1])
        : null;
      expect(updatedMinute).not.toBe(initialMinute);
    });
    vi.useRealTimers();
  });
});
