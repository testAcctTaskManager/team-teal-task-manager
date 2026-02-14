import { useEffect, useState } from "react";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json().catch(() => null);
      if (Array.isArray(data)) setProjects(data);
      else setProjects([]);
    } catch (err) {
      console.error("Fetch error", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
        <h1>Projects</h1>
        {!loading && projects.length === 0 && (
            <p>No projects found.</p>
        )}
        {!loading && projects.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", paddingBottom: 6 }}>ID</th>
              <th style={{ textAlign: "left", paddingBottom: 6 }}>Name</th>
              <th style={{ textAlign: "left", paddingBottom: 6 }}>Created By</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td style={{ padding: "6px 8px" }}>{p.id}</td>
                <td style={{ padding: "6px 8px" }}>{p.name || "-"}</td>
                <td style={{ padding: "6px 8px" }}>{p.created_by || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );

}