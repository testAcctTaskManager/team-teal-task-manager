import React, { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { waitFor } from "@testing-library/react";
import Profile from "../../src/pages/Profile";
import { renderWithRoot, click } from "../test-utils/reactTestUtils";

function renderProfile(initialPath = "/profile") {
    return renderWithRoot(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path="/profile" element={<Profile />}/>
            </Routes>
        </MemoryRouter>
    );
}

describe("Profile page", () => {
    let originalFetch;

    beforeEach(() => {
        originalFetch = global.fetch;

        global.fetch = vi.fn(async (url, options) => {
            if (url === "/api/auth/me") {
                return {
                    ok: true,
                    json: async () => ({
                        id: 1,
                        display_name: "Alice Developer",
                        email: "alice@example.com",
                        timezone: "America/New_York",
                    }),
                };
            }
            if (url === "/api/users/1" && options?.method === "PATCH") {
                const body = JSON.parse(options.body);
                return {
                    ok: true,
                    json: async () => ({
                        id: 1,
                        display_name: "Alice Developer",
                        email: "alice@example.com",
                        timezone: body.timezone,
                    }),
                };
            }
            return {
                ok: false,
                json: async () => ({
                    error: "unhandled"
                }),
            };
        });

    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    it("Shows loading profile message before displaying anything", async () => {
        const {container} = renderProfile();

        expect(container.textContent).toContain("Loading profile…");

    });

    it("Renders a user profile", async () => {
        const {container} = renderProfile();

        await act(async () => {});

        expect(container.textContent).toContain("Alice Developer");
        expect(container.textContent).toContain("alice@example.com");
        expect(container.textContent).toContain("New York (America)");
    });

    it("Shows Edit button for timezone", async () => {
        const {container} = renderProfile();

        await act(async () => {});

        const editButton = container.querySelector("button");
        expect(editButton).not.toBeNull();
        expect(editButton.textContent).toBe("Edit");
    });

    it("Clicking Edit shows timezone dropdown and Save/Cancel buttons", async () => {
        const {container} = renderProfile();

        await act(async () => {});

        const editButton = container.querySelector("button");
        await click(editButton);

        // Should now show a select dropdown
        const select = container.querySelector("select");
        expect(select).not.toBeNull();

        // Should have Save and Cancel buttons
        const buttons = container.querySelectorAll("button");
        const buttonTexts = Array.from(buttons).map(b => b.textContent);
        expect(buttonTexts).toContain("Save");
        expect(buttonTexts).toContain("Cancel");
    });

    it("Cancel exits edit mode without saving", async () => {
        const {container} = renderProfile();

        await act(async () => {});

        // Enter edit mode
        const editButton = container.querySelector("button");
        await click(editButton);

        // Click Cancel
        const cancelButton = Array.from(container.querySelectorAll("button"))
            .find(b => b.textContent === "Cancel");
        await click(cancelButton);

        // Should be back to read mode with Edit button
        const buttons = container.querySelectorAll("button");
        expect(buttons.length).toBe(1);
        expect(buttons[0].textContent).toBe("Edit");

        // No PATCH request should have been made
        const patchCalls = global.fetch.mock.calls.filter(
            ([, opts]) => opts?.method === "PATCH"
        );
        expect(patchCalls.length).toBe(0);
    });

    it("Save updates timezone and exits edit mode", async () => {
        const {container} = renderProfile();

        await act(async () => {});

        // Enter edit mode
        const editButton = container.querySelector("button");
        await click(editButton);

        // Change the timezone
        const select = container.querySelector("select");
        await act(async () => {
            select.value = "Europe/London";
            select.dispatchEvent(new Event("change", { bubbles: true }));
        });

        // Click Save
        const saveButton = Array.from(container.querySelectorAll("button"))
            .find(b => b.textContent === "Save");
        await click(saveButton);

        // Wait for async save to complete
        await act(async () => {});

        // Verify PATCH was called with new timezone
        const patchCalls = global.fetch.mock.calls.filter(
            ([, opts]) => opts?.method === "PATCH"
        );
        expect(patchCalls.length).toBe(1);
        expect(patchCalls[0][0]).toBe("/api/users/1");
        expect(JSON.parse(patchCalls[0][1].body)).toEqual({ timezone: "Europe/London" });

        // Should be back to read mode
        const buttons = container.querySelectorAll("button");
        expect(buttons.length).toBe(1);
        expect(buttons[0].textContent).toBe("Edit");

        // Should show updated timezone
        expect(container.textContent).toContain("London (Europe)");
    });

    it("handles API error when loading profile info", async () => {
        const mockFetch = vi.fn(async () => {
            return { 
                ok: false, 
                json: async () => ({ error: "Unable to load user from server" }) 
            };
        });

        global.fetch = mockFetch;

        const { container } = renderProfile();

        await waitFor(() => {
            expect(container.textContent).toContain("Unable to load user from server");
        });
    });


    it("Catch block throws network failure error", async () => {
        global.fetch = vi.fn(async () => {
            throw new Error("error")
        });

        const { container } = renderProfile();

        await waitFor(() => {
            expect(container.textContent).toContain("Unable to get user");
        });
    });

});