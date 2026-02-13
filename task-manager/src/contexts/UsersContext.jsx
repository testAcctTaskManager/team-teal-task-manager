/* eslint react-refresh/only-export-components: "off" */
import { createContext, useContext, useEffect, useState } from "react";

const UsersContext = createContext({
  users: [],
  loading: false,
  error: null,
  refetch: () => {},
});

export function UsersProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const value = { users, loading, error, refetch: loadUsers };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  return useContext(UsersContext);
}
