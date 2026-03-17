import React, { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { waitFor } from "@testing-library/react";
import Profile from "../../src/pages/Profile";
import { renderWithRoot } from "../test-utils/reactTestUtils";

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

        global.fetch = vi.fn(async (url) => {
            if (url === "/api/auth/me") {
                return {
                    ok: true,
                    json: async () => ({
                        id: 1,
                        display_name: "Alice Developer",
                        email: "alice@example.com",
                        timezone: "UTC",
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
        expect(container.textContent).toContain("UTC");
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