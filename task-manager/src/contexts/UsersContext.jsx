/* eslint react-refresh/only-export-components: "off" */
import { createContext, useContext, useEffect, useState, useCallback } from "react";

export const UsersContext = createContext({
  users: [],
  loading: false,
  error: null,
  refetch: () => {},
  currentUser: null,
  isAuthenticated: false,
  authLoading: true,
  logout: () => {},
});

export function UsersProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const loadUsers = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
          await loadUsers();
        }
      } catch {
        // not authenticated
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [loadUsers]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // best-effort
    }
    setCurrentUser(null);
    setUsers([]);
  }

  const value = {
    users,
    loading,
    error,
    refetch: loadUsers,
    currentUser,
    isAuthenticated: !!currentUser,
    authLoading,
    logout,
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  return useContext(UsersContext);
}

