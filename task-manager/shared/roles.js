export const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  DEVELOPER: "developer",
  CLINICIAN: "clinician",
  AI_TEAM: "ai-team",
  PROFESSOR: "professor"
});

export const USER_ROLE_VALUES = Object.freeze(Object.values(USER_ROLES));

export function isValidUserRole(value) {
  return USER_ROLE_VALUES.includes(value);
}
