import { useState, useEffect } from "react";
import TaskForm from "../components/TaskForm.jsx";
import Kanban from "../components/Kanban.jsx";
import { Link } from "react-router-dom";

export default function Home({ projectId }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [columns, setColumns] = useState([]);

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

  useEffect(() => {
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

      <header>
        <Link to="/profile" style={{float: "right"}}>
          test
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
