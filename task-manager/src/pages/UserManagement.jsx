import { useEffect, useState } from "react";
import { USER_ROLE_VALUES } from "../constants/roles.js";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingRoles, setPendingRoles] = useState({});
  const [savingById, setSavingById] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);

  useEffect(() => {
    async function loadUsers() {
      setUsersLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/users`);
        const data = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(data)) {
          console.error("API error loading users", data);
          setError("Unable to load users from server.");
          setUsers([]);
        } else {
          setUsers(data);
        }
      } catch (err) {
        console.error("Fetch error loading users", err);
        setError("Network error loading users");
        setUsers([]);
      } finally {
        setUsersLoading(false);
      }
    }

    loadUsers();
  }, []);

  function handleRoleChange(userId, role) {
    setPendingRoles((prev) => ({ ...prev, [userId]: role }));
  }

  async function saveRole(user) {
    const selectedRole = pendingRoles[user.id] ?? user.role;
    if (selectedRole === user.role) return;

    setSaveError(null);
    setSaveSuccess(null);
    setSavingById((prev) => ({ ...prev, [user.id]: true }));
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error("Unable to update role.");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: selectedRole } : u)),
      );
      setPendingRoles((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });

      setSaveSuccess(`Updated ${user.display_name} to ${selectedRole}.`);
    } catch (err) {
      console.error("Error updating role", err);
      setSaveError("Could not update role.");
    } finally {
      setSavingById((prev) => ({ ...prev, [user.id]: false }));
    }
  }

  return (
    <div className="user-management-page">
      <h1>User Management</h1>

      <div id="user-list">
        {users.map((user) => {
          const selectedRole = pendingRoles[user.id] ?? user.role;
          const unchanged = selectedRole === user.role;
          const saving = !!savingById[user.id];

          return (
            <div key={user.id}>
              <span>{user.display_name}</span> <span>({user.email})</span>{" "}
              <span>Current role: {user.role}</span>{" "}
              <select
                value={selectedRole || ""}
                onChange={(e) => handleRoleChange(user.id, e.target.value)}
              >
                {USER_ROLE_VALUES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>{" "}
              <button
                type="button"
                onClick={() => saveRole(user)}
                disabled={unchanged || saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          );
        })}
      </div>
      {usersLoading && <p>Loading users...</p>}
      {error && <p>{error}</p>}
      {saveError && <p>{saveError}</p>}
      {saveSuccess && <p>{saveSuccess}</p>}
    </div>
  );
}
