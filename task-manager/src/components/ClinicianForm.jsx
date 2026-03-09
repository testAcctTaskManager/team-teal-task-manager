import { useState, useEffect } from "react";
import { useUsers } from "../contexts/UsersContext.jsx";

const EMPTY_FORM = {
  title: "",
  description: "",
  due_date: "",
  project_id: "",
};

export default function ClinicianForm({ onSuccess, onCancel }) {
  const { currentUser } = useUsers();
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
  }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState(null);

  async function createTaskApi(payload) {
    const resp = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await resp.json().catch(() => null);
    return { resp, data };
  }

  // Load projects to choose from for use in form dropdown
  async function loadProjects() {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const res = await fetch("/api/projects");
      const projectsArr = await res.json().catch(() => null);
      if (!Array.isArray(projectsArr) || projectsArr.error) {
        console.error("API error loading projects", projectsArr);
        setProjectsError("Unable to load projects");
        setProjects([]);
        return;
      }
      setProjects(projectsArr);
    } catch (err) {
      console.error("Fetch error loading projects", err);
      setProjectsError("Network error loading projects");
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const newErrors = {};

    if (!form.title) {
      newErrors.title = "This field is required";
    }

    if (!form.project_id) {
      newErrors.project_id = "This field is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitMessage("");
    setSubmitStatus(null);

    if (!validate()) return;

    setSubmitting(true);

    const projectIdNum = Number(form.project_id);
    if (isNaN(projectIdNum)) {
      setSubmitMessage("Current project is invalid");
      setSubmitStatus("error");
      setSubmitting(false);
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      sprint_id: null,
      reporter_id: currentUser?.id ?? null,
      assignee_id: null,
      start_date: null,
      due_date: form.due_date || null,
      project_id: projectIdNum,
      column_id: null,
      created_by: currentUser?.id ?? null,
      modified_by: currentUser?.id ?? null,
    };

    try {
      const { resp, data } = await createTaskApi(payload);
      if (!resp.ok) {
        console.error("Clinician request creation failed", data);
        setSubmitMessage(data?.error || "Unable to save the request.");
        setSubmitStatus("error");
        return;
      }

      // Reset form
      setForm({
        ...EMPTY_FORM,
      });

      setSubmitMessage("Request successfully created!");
      setSubmitStatus("success");

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      console.error("Clinician request save error", err);
      setSubmitMessage("Unable to save the request.");
      setSubmitStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

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
              Create Clinician Request
            </h1>
          </div>

          <div className="p-6 space-y-4">
            {submitMessage && (
              <p
                className={`text-sm ${
                  submitStatus === "success" ? "text-green-400" : "text-red-400"
                }`}
              >
                {submitMessage}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4">
              <label className="flex flex-col">
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

              <label className="flex flex-col">
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
                <span className="text-white/80 text-sm mb-1.5">Project*</span>
                {projectsLoading && (
                  <div className="text-white/60 text-xs">Loading projects…</div>
                )}
                {projectsError && (
                  <div className="text-red-400 text-xs">{projectsError}</div>
                )}
                <select
                  name="project_id"
                  value={form.project_id}
                  onChange={handleChange}
                  disabled={projectsLoading}
                  className="bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 disabled:opacity-50"
                >
                  <option value="">Select a project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || `Project ${p.id}`}
                    </option>
                  ))}
                </select>
                {errors.project_id && (
                  <span className="text-red-400 text-xs mt-1">
                    {errors.project_id}
                  </span>
                )}
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
              </label>
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4 bg-white/5 border-t border-white/10">
            <button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 disabled:from-slate-800 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg shadow-md transition-all duration-200"
            >
              {submitting ? "Saving..." : "Create Request"}
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
