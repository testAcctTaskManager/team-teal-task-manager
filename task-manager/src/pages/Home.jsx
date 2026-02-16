import { useState, useEffect } from "react";
import TaskForm from "../components/TaskForm.jsx";
import Kanban from "../components/Kanban.jsx";
import { Link } from "react-router-dom";
import ProjectSelector from "../components/ProjectSelector.jsx";

export default function Home({ projectId: initialProjectId }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [columns, setColumns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(initialProjectId);

  // Load the columns and tasks for the provided project ID
  async function loadColumns(projectId) {
    try {
      const [colRes, taskRes] = await Promise.all([
        fetch(`/api/columns?project_id=${projectId}`),
        fetch(`/api/tasks?project_id=${projectId}`),
      ]);

      const cols = await colRes.json().catch(() => null);
      if (!Array.isArray(cols) || cols.error) {
        console.error("API error loading columns", cols);
        setColumns([]);
        return;
      }

      const taskList = await taskRes.json().catch(() => null);
      if (!Array.isArray(taskList) || taskList.error) {
        console.error("API error loading tasks", taskList);
        setColumns([]);
        return;
      }
      console.log(taskList);
      const columnsWithTasks = cols.map((col) => {
        const colTasks = taskList
          .filter((t) => Number(t.column_id) === Number(col.id))
          .sort(
            (a, b) => (Number(a.position) || 0) - (Number(b.position) || 0),
          );
        return {
          ...col,
          title: col.name,
          tasks: colTasks,
        };
      });

      setColumns(columnsWithTasks);
    } catch (err) {
      console.error("Fetch error", err);
      setColumns([]);
    }
  }

  async function loadProjects(){
    try {
      // Fetch projects from API
      const res = await fetch(`/api/projects`);

      // Ensure projectsArr is an array and there was no error
      const projectsArr = await res.json().catch(() => null);
      if (!Array.isArray(projectsArr) || projectsArr.error) {
        console.error("API error loading projects", projectsArr);
        setProjects([]);
        return;
      }

      // Update projects useState
      setProjects(projectsArr);
    } 
    catch (err) {
      console.error("Fetch error", err);
      setProjects([]);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (!projectId) return;
    loadColumns(projectId);
  }, [projectId]);

  function openModal() {
    setShowCreateModal(true);
  }

  function closeModal() {
    setShowCreateModal(false);
  }

  async function handleCreated(task) {
    console.log("Created task", task);
    // On successful task creation, reload columns data to show the new task
    try {
      await loadColumns(projectId);
    } catch (err) {
      console.error("Error reloading board after create", err);
    }
    closeModal();
  }

  return (
    <div>
      <ProjectSelector projects={projects} selectedProjectId={projectId} onSelectProject={setProjectId}/>
      <header>
        <Link to="/profile" style={{float: "right"}}>
          My Profile
        </Link>
      </header>

      <h1>Project {projectId} Board</h1>
      <div>
        <button type="button" onClick={openModal}>
          + New Task
        </button>

        {showCreateModal && (
          <TaskForm
            projectId={projectId}
            createdBy={1}
            modifiedBy={1}
            columnsForStatus={columns}
            onSuccess={handleCreated}
            onCancel={closeModal}
          />
        )}
      </div>

      <div>
        <Kanban columns={columns} setColumns={setColumns} />
      </div>
    </div>
  );
}
