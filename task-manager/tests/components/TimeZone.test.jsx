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

  it("displays time when user has a timezone", () => {
    const user = {
      id: 1,
      display_name: "Jesse",
      timezone: "EST",
    };
    render(<TimeZone user={user} />);
    const content = screen.getByText(/Time:/);
    expect(content.textContent).toMatch(/EST/);
  });

  it("displays different timezone correctly", () => {
    const user = {
      id: 1,
      display_name: "Jose",
      timezone: "PST",
    };
    render(<TimeZone user={user} />);
    const content = screen.getByText(/Time:/);
    expect(content.textContent).toMatch(/PST/);
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
    const initialMinute = parseInt(initialText.split(":")[1]);
    vi.advanceTimersByTime(60000);
    waitFor(() => {
      const updatedText = timeDiv.textContent;
      const updatedMinute = parseInt(updatedText.split(":")[1]);
      expect(updatedMinute).not.toBe(initialMinute);
    });
    vi.useRealTimers();
  });
});