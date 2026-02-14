/* eslint react-refresh/only-export-components: "off" */
import { createContext, useContext, useEffect, useState } from "react";

const UsersContext = createContext({
  users: [],
  loading: false,
  error: null,
  refetch: () => {},
  // DEV-ONLY: currentUser is inferred from the users list for now.
  // TODO: Once real auth is implemented, currentUser should come from
  // an auth-backed endpoint (e.g. /api/auth/me) instead of guessing.
  currentUser: null,
  setCurrentUser: () => {},
});

export function UsersProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users");
      const data = await res.json().catch(() => null);

      if (!res.ok || !Array.isArray(data) || data.error) {
        console.error("API error loading users", data);
        setError("Unable to load users.");
        setUsers([]);
      } else {
        setUsers(data);
      }
    } catch (err) {
      console.error("Fetch error loading users", err);
      setError("Network error loading users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // DEV-ONLY currentUser behavior:
  // Infer a "current" user from the loaded users list so components can
  // consume useUsers().currentUser while real auth is still in progress.
  // We simply pick the first user once, and allow consumers to override
  // via setCurrentUser (e.g., for a future user-switcher UI).
  useEffect(() => {
    if (!currentUser && users.length > 0) {
      setCurrentUser(users[0]);
    }
  }, [users, currentUser]);

  const value = {
    users,
    loading,
    error,
    refetch: loadUsers,
    currentUser,
    setCurrentUser,
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  return useContext(UsersContext);
}
