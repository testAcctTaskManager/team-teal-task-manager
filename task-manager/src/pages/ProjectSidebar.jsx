import { useEffect, useState } from "react";
import ProjectSelector from "../components/ProjectSelector"

export default function ProjectSidebar() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
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
    <ProjectSelector
      projects={projects}
      selectedProjectId={selectedProjectId}
      onSelectProject={setSelectedProjectId}
    />
  )
}