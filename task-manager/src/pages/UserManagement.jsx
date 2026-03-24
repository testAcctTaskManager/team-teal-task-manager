import { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout.jsx";
import { USER_ROLE_VALUES } from "../constants/roles.js";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingRoles, setPendingRoles] = useState({});
  const [pendingActive, setPendingActive] = useState({});
  const [savingById, setSavingById] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [newEmail, setNewEmail] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newRole, setNewRole] = useState(USER_ROLE_VALUES[0]);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);
  const [creating, setCreating] = useState(false);

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

  function handleActiveChange(userId, value) {
    setPendingActive((prev) => ({ ...prev, [userId]: value }));
  }

  async function saveRole(user) {
    const selectedRole = pendingRoles[user.id] ?? user.role;
    const selectedActive =
      pendingActive[user.id] ?? (Number(user.is_active) === 1 ? 1 : 0);
    const unchangedRole = selectedRole === user.role;
    const unchangedActive = selectedActive === (Number(user.is_active) === 1 ? 1 : 0);
    if (unchangedRole && unchangedActive) return;

    setSaveError(null);
    setSaveSuccess(null);
    setSavingById((prev) => ({ ...prev, [user.id]: true }));
    try {
      const body = {};
      if (!unchangedRole) {
        body.role = selectedRole;
      }
      if (!unchangedActive) {
        body.is_active = selectedActive;
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        if (data?.error === "Cannot remove the only active admin account.") {
          throw new Error("There must be at least one active admin.");
        }
        throw new Error("Could not update user.");
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                role: selectedRole,
                is_active: selectedActive,
              }
            : u,
        ),
      );
      setPendingRoles((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
      setPendingActive((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });

      const activeLabel = selectedActive === 1 ? "active" : "inactive";
      setSaveSuccess(
        `Updated ${user.display_name} to ${selectedRole} (${activeLabel}).`,
      );
    } catch (err) {
      console.error("Error updating role", err);
      setSaveError(err?.message || "Could not update user.");
    } finally {
      setSavingById((prev) => ({ ...prev, [user.id]: false }));
    }
  }

  async function createUser(e) {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    const email = newEmail.trim().toLowerCase();
    const displayName = newDisplayName.trim();
    if (!email) {
      setCreateError("Email is required.");
      return;
    }
    if (!displayName) {
      setCreateError("Display name is required.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          display_name: displayName,
          role: newRole,
          is_active: 1,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error("Unable to create user.");
      }

      setUsers((prev) => [...prev, data]);
      setNewEmail("");
      setNewDisplayName("");
      setNewRole(USER_ROLE_VALUES[0]);
      setCreateSuccess(`Added ${data.email}.`);
    } catch (err) {
      console.error("Error creating user", err);
      setCreateError("Could not add user.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageLayout title="User Management">
    <div className="w-full text-left space-y-5">
      <section className="rounded-lg w-full bg-slate-800/30 shadow-xl border border-white/10 overflow-hidden">
        <form onSubmit={createUser} className="p-5 space-y-4 bg-gradient-to-b from-slate-900/20 to-slate-900/40">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-white/80">
            Add User
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="space-y-1">
              <span className="text-xs font-medium text-white/80">Email</span>
              <input
                id="new-user-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new.user@example.com"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-white/80">Display name</span>
              <input
                id="new-user-display-name"
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="New User"
                required
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-white/80">Role</span>
              <select
                id="new-user-role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10"
              >
                {USER_ROLE_VALUES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={creating}
              className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 disabled:from-slate-800 disabled:to-slate-700 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200"
            >
              {creating ? "Adding..." : "Add user"}
            </button>
            {createError && <p className="text-sm text-rose-400">{createError}</p>}
            {createSuccess && <p className="text-sm text-emerald-400">{createSuccess}</p>}
          </div>
        </form>
      </section>

      <section className="rounded-lg w-full bg-slate-800/30 shadow-xl border border-white/10 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white px-5 py-3">
          <h2 className="text-lg font-semibold m-0">Team Users</h2>
        </div>
        <div className="overflow-x-auto" id="user-list">
          <table className="min-w-full text-sm text-white/90">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/60">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">User</th>
                <th className="px-4 py-3 text-left font-semibold">Current</th>
                <th className="px-4 py-3 text-left font-semibold">Role</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-gradient-to-b from-slate-900/20 to-slate-900/40">
              {users.map((user) => {
                const selectedRole = pendingRoles[user.id] ?? user.role;
                const selectedActive =
                  pendingActive[user.id] ?? (Number(user.is_active) === 1 ? 1 : 0);
                const unchanged =
                  selectedRole === user.role &&
                  selectedActive === (Number(user.is_active) === 1 ? 1 : 0);
                const saving = !!savingById[user.id];
                const currentStatus = Number(user.is_active) === 1 ? "active" : "inactive";

                return (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{user.display_name}</div>
                      <div className="text-xs text-white/60">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/75">
                      <div>Current role: {user.role}</div>
                      <div>Current status: {currentStatus}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={selectedRole || ""}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="w-40 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10"
                      >
                        {USER_ROLE_VALUES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={selectedActive}
                        onChange={(e) => handleActiveChange(user.id, Number(e.target.value))}
                        className="w-32 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10"
                      >
                        <option value={1}>active</option>
                        <option value={0}>inactive</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => saveRole(user)}
                        disabled={unchanged || saving}
                        className="rounded-lg bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/40 px-3 py-2 text-xs font-semibold text-white transition-colors border border-white/15"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(usersLoading || error || saveError || saveSuccess) && (
          <div className="px-4 py-3 border-t border-white/10 space-y-1 text-sm">
            {usersLoading && <p className="text-white/60">Loading users...</p>}
            {error && <p className="text-rose-400">{error}</p>}
            {saveError && <p className="text-rose-400">{saveError}</p>}
            {saveSuccess && <p className="text-emerald-400">{saveSuccess}</p>}
          </div>
        )}
      </section>
    </div>
    </PageLayout>
  );
}
