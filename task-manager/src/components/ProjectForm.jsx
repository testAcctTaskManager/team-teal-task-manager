import { useState } from "react";
import { useUsers } from "../contexts/UsersContext.jsx";

/**
 * ProjectForm
 *
 * Modal form for creating a new project.
 * Posts to /api/projects with the project name and the current user as created_by.
 *
 * Props:
 * - onSuccess(project): called after successful creation with the new project object.
 * - onCancel(): called when the user cancels; parent hides the modal.
 */
export default function ProjectForm({ onSuccess, onCancel }) {
  const { currentUser } = useUsers();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Project name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
if (!currentUser?.id) {
  setError("Unable to create project: no user session found.");
  setSubmitting(false);
  return;
}
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
created_by: currentUser?.id,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Server returned ${res.status}`);
      }

      const created = await res.json();
      onSuccess(created);
    } catch (err) {
      setError(err.message || "Failed to create project.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-white/10"
      >
        <h2 className="text-xl font-semibold text-white mb-4">New Project</h2>

        <label
          htmlFor="project-name"
          className="block text-white/70 text-sm mb-1"
        >
          Project Name
        </label>
        <input
          id="project-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter project name"
          autoFocus
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 mb-4"
        />

        {error && (
          <p className="text-red-400 text-sm mb-3">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium px-4 py-2 rounded-lg shadow-md transition-all duration-200 text-sm disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
