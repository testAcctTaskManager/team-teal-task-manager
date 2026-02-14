import { useState, useEffect } from "react";
import "./taskform.css";

/**
 * TaskForm
 *
 * Pop-up form used to create or edit a task card.
 *
 * - Renders the task fields (title, description, sprint, reporter, assignee, dates).
 * - Handles local form state, validation, and submit state.
 * - Talks to the backend API to create or update a task via /api/tasks.
 * - When given a taskId, loads the existing task from /api/tasks/:id and switches to edit mode.
 * - Optionally links a new task to a column via /api/column_tasks when columnId is provided.
 *
 * - This popup modal is designed to be used in (at least) these three places:
 *      - Backlog/Board-level 'create task' button
 *      - Column-level 'create task' button
 *      - Task Detail 'edit task' button
 * - For creating a task, the parent omits taskId.
 * - For editing a task, the parent passes taskId; TaskForm fetches and populates the fields.
 * - The parent passes context values like projectId, createdBy, modifiedBy, and columnId
 *   based on the current user and board/column.
 * - On successful save, TaskForm calls onSuccess(taskFromApi) so the parent can update
 *   its own state (e.g., add the task to a column or close the modal).
 *
 * Props:
 * - taskId: optional id of the task to edit; when present, the form behaves in "edit" mode.
 * - projectId, createdBy, modifiedBy: non-editable values that get sent to the API, provided by parent.
 * - columnId: optional column to link the new task to via column_tasks on create.
 * - onSuccess(task): called after a successful create or update.
 * - onCancel(): called when the user clicks Cancel; parent usually hides the modal.
 *
 * TODO: We should show the Assignee and Report inputs as dropdowns of eligible users
 *
 * TODO: Eventually we may want to have this take in the projectId as a parameter
 * (where projectId is the current project view the task creation occurs on)
 * and use the columnId as null for backlog, only moving it to 1 upon starting a sprint
 *
 */
const EMPTY_FORM = {
  title: "",
  description: "",
  sprint_id: "",
  reporter_id: "",
  assignee_id: "",
  start_date: "",
  due_date: "",
  // column_id is handled via the Status dropdown; empty string / null means Backlog
  column_id: "",
};

export default function TaskForm({
  taskId = null,
  projectId = null, //TODO: auto-populate this depending on where button is clicked
  // Optional starting column when launching from a specific column; null means Backlog
  columnId = null,
  // List of columns for the current project board, used to populate the Status dropdown
  columnsForStatus = [],
  onSuccess,
  onCancel,
}) {
  const { users, loading: usersLoading, error: usersError, currentUser } = useUsers();
  // Start with an empty form; the optional columnId prop will be applied
  // as the default Status via an effect in create mode.
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
  }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [loadError, setLoadError] = useState(null);

  async function createTaskApi(payload) {
    const resp = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await resp.json().catch(() => null);
    return { resp, data };
  }

  async function updateTaskApi(id, payload) {
    const resp = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await resp.json().catch(() => null);
    return { resp, data };
  }

  useEffect(() => {
    async function loadExistingTask() {
      if (!taskId) return;
      setLoadingExisting(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/tasks/${taskId}`);
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || data.error) {
          console.error("API error loading task for edit", data);
          setLoadError("Unable to load task for editing.");
        } else {
          // Merge the existing task into the EMPTY_FORM; if the task has a column_id,
          // it will pre-populate the Status dropdown, otherwise it will be treated as Backlog.
          setForm({
            ...EMPTY_FORM,
            ...data,
          });
        }
      } catch (err) {
        console.error("Fetch error loading task for edit", err);
        setLoadError("Network error loading task for editing.");
      } finally {
        setLoadingExisting(false);
      }
    }

    loadExistingTask();
  }, [taskId]);

  // When creating (no taskId), keep the Status dropdown in sync with the
  // optional columnId prop:
  // - If columnId is provided, default to that column.
  // - If not, default to Backlog (empty string / no column).
  useEffect(() => {
    if (taskId) return; // edit mode owned by loaded task data
    setForm((prev) => ({
      ...prev,
      column_id: columnId != null ? String(columnId) : "",
    }));
  }, [columnId, taskId]);

  // When creating a new task and once a current user is available,
  // default the reporter (and optionally assignee) to that user if
  // they haven't already been set.
  useEffect(() => {
    if (taskId || !currentUser) return; // only apply in create mode
    setForm((prev) => ({
      ...prev,
      reporter_id: prev.reporter_id || String(currentUser.id),
      assignee_id: prev.assignee_id || String(currentUser.id),
    }));
  }, [taskId, currentUser]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const newErrors = {};

    if (!form.title) {
      newErrors.title = "This field is required";
    }

    if (form.start_date && form.due_date) {
      const start = new Date(form.start_date);
      const due = new Date(form.due_date);
      if (due < start) {
        newErrors.due_date = "Due date must be on or after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitMessage("");

    if (!validate()) return;

    setSubmitting(true);

    const payload = {
      title: form.title,
      description: form.description,
      sprint_id: form.sprint_id ? Number(form.sprint_id) : null,
      reporter_id: form.reporter_id ? Number(form.reporter_id) : null,
      assignee_id: form.assignee_id ? Number(form.assignee_id) : null,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
    };

    if (projectId != null) {
      payload.project_id = projectId;
    }

    // Status / column handling:
    // - Backlog: no column_id sent (form.column_id is "" or falsy)
    // - Specific column: include its id so the Tasks API can position it
    if (form.column_id) {
      payload.column_id = Number(form.column_id);
    }

    try {
      const isEdit = taskId != null;

      // Use currentUser for auditing fields.
      if (!isEdit) {
        payload.created_by = currentUser?.id ?? null;
      }
      payload.modified_by = currentUser?.id ?? null;
      let data = null;
      let message = isEdit ? "Task updated." : "Task created.";

      if (isEdit) {
        const { resp, data: body } = await updateTaskApi(taskId, payload);
        if (!resp.ok) {
          console.error("Task update failed", body);
          setSubmitMessage("Unable to save task (API not ready or error).");
          return;
        }
        data = body;
      } else {
        const { resp, data: body } = await createTaskApi(payload);
        if (!resp.ok) {
          console.error("Task create failed", body);
          setSubmitMessage("Unable to save task (API not ready or error).");
          return;
        }
        data = body;
      }

      if (!isEdit) {
        // After creating, reset the form but keep the same default Status
        // behavior: Backlog when no columnId, or the provided columnId when set.
        setForm({
          ...EMPTY_FORM,
          column_id: columnId != null ? String(columnId) : "",
        });
      }

      setSubmitMessage(message);

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      console.error("Task save error", err);
      setSubmitMessage("Network error while saving task.");
    } finally {
      setSubmitting(false);
    }
  }

  const isEdit = taskId != null;
  const titleText = isEdit ? "Edit Task" : "Create Task";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800/95 rounded-lg shadow-2xl border border-white/10 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-6 py-4">
            <h1 className="text-2xl font-semibold text-white m-0">
              {titleText}
            </h1>
          </div>

          <div className="p-6 space-y-4">
            {loadingExisting && (
              <p className="text-white/60 text-sm">Loading task…</p>
            )}
            {loadError && <p className="text-red-400 text-sm">{loadError}</p>}

            {submitMessage && (
              <p className="text-green-400 text-sm">{submitMessage}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col col-span-full">
                <span className="text-white/80 text-sm mb-1.5">Title*</span>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10"
                />
                {errors.title && (
                  <span className="text-red-400 text-xs mt-1">
                    {errors.title}
                  </span>
                )}
              </label>

              <label className="flex flex-col col-span-full">
                <span className="text-white/80 text-sm mb-1.5">
                  Description
                </span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  className="bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 resize-none"
                />
              </label>

              <label className="flex flex-col">
                <span className="text-white/80 text-sm mb-1.5">Sprint ID</span>
                <input
                  type="number"
                  name="sprint_id"
                  value={form.sprint_id}
                  onChange={handleChange}
                  className="bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10"
                />
              </label>

            {/* TODO In a perfect world, these would be searchable Select dropdowns with all eligible users */}
            <label>
              Reporter ID
              <input
                type="number"
                name="reporter_id"
                value={form.reporter_id}
                onChange={handleChange}
              />
            </label>

            <label>
              Assignee ID
              <input
                type="number"
                name="assignee_id"
                value={form.assignee_id}
                onChange={handleChange}
              />
            </label>

            <label>
              Status
              <select
                name="column_id"
                value={form.column_id}
                onChange={handleChange}
              >
                <option value="">Backlog</option>
                {columnsForStatus.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title || col.name || `Column ${col.id}`}
                  </option>
                ))}
              </select>
            </label>

              <label className="flex flex-col">
                <span className="text-white/80 text-sm mb-1.5">Start Date</span>
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  className="bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10"
                />
              </label>

              <label className="flex flex-col">
                <span className="text-white/80 text-sm mb-1.5">Due Date</span>
                <input
                  type="date"
                  name="due_date"
                  value={form.due_date}
                  onChange={handleChange}
                  className="bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10"
                />
                {errors.due_date && (
                  <span className="text-red-400 text-xs mt-1">
                    {errors.due_date}
                  </span>
                )}
              </label>
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4 bg-white/5 border-t border-white/10">
            <button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 disabled:from-slate-800 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg shadow-md transition-all duration-200"
            >
              {submitting
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Task"}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg border border-white/20 transition-all duration-200"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
