import { useState } from "react";
import TaskForm from "../components/TaskForm.jsx";
import Kanban from "../components/Kanban.jsx";

export default function Home() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  function openModal() {
    setShowCreateModal(true);
  }

  function closeModal() {
    setShowCreateModal(false);
  }

  function handleCreated(task) {
    console.log("Created task", task);
    closeModal();
  }

  return (
    <div>
      <h1>Task Manager Demo</h1>
      <Kanban />
      <button type="button" onClick={openModal}>
        + New Task
      </button>

      {showCreateModal && (
        <TaskForm
          projectId={1}
          createdBy={1}
          modifiedBy={1}
          columnId={null}
          onSuccess={handleCreated}
          onCancel={closeModal}
        />
      )}
    </div>
  );
}
