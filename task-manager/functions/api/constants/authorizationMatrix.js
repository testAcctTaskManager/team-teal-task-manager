import { USER_ROLES } from "./roles.js";

const { ADMIN, DEVELOPER, CLINICIAN, AI_TEAM, PROFESSOR } = USER_ROLES;

/**
 * Authorization decision values returned by policy lookup.
 * An enum-like constant that standardizes what an entry in the authorization
 * matrix can lookup.
 *
 * Semantics:
 * - `allow`: request is permitted immediately.
 * - `deny`: request is rejected immediately.
 * - `self`: request is permitted only for the authenticated user's own record.
 * - `own_comment`: request is permitted only for comments authored by the authenticated user.
 *
 * @readonly
 * @enum {string}
 */
export const AUTHZ_DECISIONS = Object.freeze({
  ALLOW: "allow",
  DENY: "deny",
  SELF: "self",
  OWN_COMMENT: "own_comment",
});

// Setup shorthand for AUTHZ_DECISION enum
// Allows us to write admin: ALLOW instead of ADMIN: AUTHZ_DECISIONS.ALLOW in matrix
const { ALLOW, DENY, SELF, OWN_COMMENT } = AUTHZ_DECISIONS;

// Constructor to ensure all roles are included in each matrix entry
function decisionsByRole({ admin, developer, aiTeam, clinician, professor }) {
  return Object.freeze({
    [ADMIN]: admin,
    [DEVELOPER]: developer,
    [AI_TEAM]: aiTeam,
    [CLINICIAN]: clinician,
    [PROFESSOR]: professor,
  });
}

// Default authorization level
export const DEFAULT_AUTHORIZATION_DECISION = AUTHZ_DECISIONS.DENY;

/**
 * AUTHORIZATION MATRIX
 * Route-level authorization matrix keyed by route pattern, then HTTP method,
 * then role -> decision.
 *
 * Any unmatched path/method/role combinations should be treated as default deny.
 *
 * @readonly
 * @type {Readonly<Record<string, Readonly<Record<string, Readonly<Record<string, string>>>>>>}
 */
export const AUTHORIZATION_MATRIX = Object.freeze({
  "/api/auth/login": Object.freeze({
    GET: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
  }),
  "/api/auth/callback": Object.freeze({
    GET: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
  }),
  "/api/auth/logout": Object.freeze({
    POST: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
  }),
  "/api/auth/me": Object.freeze({
    GET: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
  }),
  // TODO(authz): tighten this back down once a scoped/minimal user-directory
  // endpoint exists for board/filter display needs.
  "/api/users": Object.freeze({
    GET: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
    POST: decisionsByRole({
      admin: ALLOW,
      developer: DENY,
      aiTeam: DENY,
      clinician: DENY,
      professor: DENY,
    }),
  }),
  "/api/users/:id": Object.freeze({
    GET: decisionsByRole({
      admin: ALLOW,
      developer: SELF,
      aiTeam: SELF,
      clinician: SELF,
      professor: SELF,
    }),
    PATCH: decisionsByRole({
      admin: ALLOW,
      developer: SELF,
      aiTeam: SELF,
      clinician: SELF,
      professor: SELF,
    }),
    DELETE: decisionsByRole({
      admin: ALLOW,
      developer: DENY,
      aiTeam: DENY,
      clinician: DENY,
      professor: DENY,
    }),
  }),

  "/api/user-providers": Object.freeze({
    GET: decisionsByRole({
      admin: SELF,
      developer: SELF,
      aiTeam: SELF,
      clinician: SELF,
      professor: SELF,
    }),
  }),

  "/api/projects": Object.freeze({
    GET: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
    POST: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: DENY,
      professor: DENY,
    }),
  }),
  "/api/projects/:id": Object.freeze({
    GET: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
    PUT: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: DENY,
      professor: DENY,
    }),
    PATCH: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: DENY,
      professor: DENY,
    }),
    DELETE: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: DENY,
      professor: DENY,
    }),
  }),

  "/api/sprints": Object.freeze({
    GET: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
    POST: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: DENY,
      professor: DENY,
    }),
  }),
  "/api/sprints/:id": Object.freeze({
    GET: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
    PUT: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: DENY,
      professor: DENY,
    }),
    PATCH: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: DENY,
      professor: DENY,
    }),
    DELETE: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: DENY,
      professor: DENY,
    }),
  }),

  "/api/columns": Object.freeze({
    GET: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
    POST: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: DENY,
      professor: DENY,
    }),
  }),
  "/api/columns/:id": Object.freeze({
    GET: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
    PUT: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: DENY,
      professor: DENY,
    }),
    PATCH: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: DENY,
      professor: DENY,
    }),
    DELETE: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: DENY,
      professor: DENY,
    }),
  }),

  "/api/tasks": Object.freeze({
    GET: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
    POST: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
  }),
  "/api/tasks/:id": Object.freeze({
    GET: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
    PUT: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
    PATCH: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
    DELETE: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
  }),

  "/api/comments": Object.freeze({
    GET: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
    POST: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
  }),
  "/api/comments/:id": Object.freeze({
    GET: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: ALLOW,
      professor: ALLOW,
    }),
    PATCH: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: OWN_COMMENT,
      professor: OWN_COMMENT,
    }),
    DELETE: decisionsByRole({
      admin: ALLOW,
      developer: ALLOW,
      aiTeam: ALLOW,
      clinician: OWN_COMMENT,
      professor: OWN_COMMENT,
    }),
  }),
});

/**
 * Finds the best matching authorization entry for a request path.
 *
 * Resolution order:
 * 1. Exact path match
 * 2. Parameterized pattern match (for example `/api/users/:id`)
 * 3. No match
 *
 * @param {string} pathname Request pathname. Query string is ignored.
 * @returns {[string|null, object|null]} Tuple of matched pattern and its matrix entry.
 */
export function findAuthorizationEntry(pathname) {
  const normalized = normalizePath(pathname);

  if (AUTHORIZATION_MATRIX[normalized]) {
    return [normalized, AUTHORIZATION_MATRIX[normalized]];
  }

  for (const [pattern, entry] of Object.entries(AUTHORIZATION_MATRIX)) {
    if (pattern.includes(":") && pathMatchesPattern(normalized, pattern)) {
      return [pattern, entry];
    }
  }

  return [null, null];
}

/**
 * Resolves the authorization decision for a request against the matrix.
 * Exported for testing purposes.
 *
 * Returns default deny when no matching path, method, or role rule exists.
 *
 * @param {object} params Parameters for decision lookup.
 * @param {string} params.pathname Request pathname.
 * @param {string} params.method HTTP method (case-insensitive).
 * @param {string} params.role Authenticated user's role value.
 * @returns {string} One of the `AUTHZ_DECISIONS` values.
 */
export function getAuthorizationDecision({ pathname, method, role }) {
  const [, entry] = findAuthorizationEntry(pathname);
  if (!entry) return DEFAULT_AUTHORIZATION_DECISION;

  const methodKey = String(method || "").toUpperCase();
  // Allow CORS preflight checks even when endpoint methods are otherwise restricted.
  if (methodKey === "OPTIONS") return AUTHZ_DECISIONS.ALLOW;
  const methodRule = entry[methodKey];
  if (!methodRule) return DEFAULT_AUTHORIZATION_DECISION;

  return methodRule[role] || DEFAULT_AUTHORIZATION_DECISION;
}

// Helper functions

function normalizePath(pathname = "") {
  if (!pathname) return "/";
  const withoutQuery = pathname.split("?")[0];
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery;
}

function splitPath(pathname) {
  return normalizePath(pathname).split("/").filter(Boolean);
}

function pathMatchesPattern(pathname, pattern) {
  const actualParts = splitPath(pathname);
  const patternParts = splitPath(pattern);

  if (actualParts.length !== patternParts.length) return false;

  for (let i = 0; i < patternParts.length; i += 1) {
    const expected = patternParts[i];
    const actual = actualParts[i];
    if (expected.startsWith(":")) continue;
    if (expected !== actual) return false;
  }

  return true;
}
