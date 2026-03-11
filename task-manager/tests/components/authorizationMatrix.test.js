import { describe, it, expect } from "vitest";
import {
  AUTHZ_DECISIONS,
  DEFAULT_AUTHORIZATION_DECISION,
  findAuthorizationEntry,
  getAuthorizationDecision,
} from "../../functions/api/constants/authorizationMatrix.js";

describe("authorizationMatrix", () => {
  it("matches exact collection routes", () => {
    const decision = getAuthorizationDecision({
      pathname: "/api/users",
      method: "GET",
      role: "admin",
    });
    expect(decision).toBe(AUTHZ_DECISIONS.ALLOW);
  });

  it("matches parameterized item routes", () => {
    const [pattern] = findAuthorizationEntry("/api/users/42");
    expect(pattern).toBe("/api/users/:id");

    const decision = getAuthorizationDecision({
      pathname: "/api/users/42",
      method: "GET",
      role: "developer",
    });
    expect(decision).toBe(AUTHZ_DECISIONS.SELF);
  });

  it("normalizes trailing slash and query string", () => {
    const decision = getAuthorizationDecision({
      pathname: "/api/users/42/?from=test",
      method: "PATCH",
      role: "clinician",
    });
    expect(decision).toBe(AUTHZ_DECISIONS.SELF);
  });

  it("returns default deny for unknown path or method", () => {
    const unknownPath = getAuthorizationDecision({
      pathname: "/api/not-real",
      method: "GET",
      role: "admin",
    });
    expect(unknownPath).toBe(DEFAULT_AUTHORIZATION_DECISION);

    const unknownMethod = getAuthorizationDecision({
      pathname: "/api/users",
      method: "POST",
      role: "admin",
    });
    expect(unknownMethod).toBe(DEFAULT_AUTHORIZATION_DECISION);
  });

  it("allows OPTIONS preflight on known routes", () => {
    const decision = getAuthorizationDecision({
      pathname: "/api/users",
      method: "OPTIONS",
      role: "developer",
    });
    expect(decision).toBe(AUTHZ_DECISIONS.ALLOW);
  });
});
