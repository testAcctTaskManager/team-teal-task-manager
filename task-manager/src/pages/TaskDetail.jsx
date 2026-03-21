import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { formatDate, formatDateTime, isDateOverdue } from "../utils/dateHelpers.js";
import TaskForm from "../components/TaskForm.jsx";
import TimeZone from "../components/TimeZone.jsx";
import { useUsers } from "../contexts/UsersContext.jsx";

function getUserLabel(id, users) {
  if (id == null) return null;
  const user = users.find((u) => u.id === Number(id));
  if (!user) return `User ${id}`;
  return user.display_name || user.email || `User ${user.id}`;
}

/**
 * UserWithTime
 *
 * Shows user label with time
 */
function UserWithTime({ userId, users }) {

  const user = users.find((u) => u.id === Number(userId));

  return (
    <dd>
      {getUserLabel(userId, users)}
      {user && (
        <div>
          <TimeZone user={user} />
        </div>
      )}
    </dd>
  );
}

/**
 * TaskDetail
 *
 * Route-level page that shows a read-only view of a single task.
 *
 * - Reads the task id from the URL via useParams.
 * - Loads task data from GET /api/tasks/:id.
 *
 * TODO: Project/sprint/user ids are rendered as raw ids for now; once lookup
 *   tables and joins are in place, these can be replaced with human-readable
 *   names.
 *
 * TODO: Once comments are implemented, we should also display comments
 *   on this page.
 *
 * TODO: Make sure database connection is working, once tasks backend api is implemetned
 */
export default function TaskDetail() {
  const { id } = useParams();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // List of comments for this task
  const [comments, setComments] = useState([]);
  // Loading comments state for this task
  const [commentsLoading, setCommentsLoading] = useState(true);
  // Error state for comments for this task
  const [commentsError, setCommentsError] = useState(null);
  // Content of a new comment that is being written
  const [newComment, setNewComment] = useState("");
  // Controls whether the edit modal is open
  const [showEditModal, setShowEditModal] = useState(false);
  // Columns used for the Status dropdown in the edit form
  const [columnsForStatus, setColumnsForStatus] = useState([]);
  // Project name for display
  const [projectName, setProjectName] = useState(null);

  const { users, currentUser } = useUsers();

  // Track which comment is being edited and the draft content
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");

  useEffect(() => {
    async function loadTask() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/tasks/${id}`);
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || data.error) {
          console.error("API error loading task", data);
          setError("Unable to load task from server.");
        } else {
          setTask(data);
        }
      } catch (err) {
        console.error("Fetch error loading task", err);
        setError("Network error loading task.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadTask();
    }
  }, [id]);

  // Comments useEffect
  useEffect(() => {
    async function loadComments() {
      if (!id) return;
      setCommentsLoading(true);
      setCommentsError(null);
      try {
        const res = await fetch(`/api/comments?task_id=${id}`);
        const data = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(data)) {
          console.error("API error loading comments", data);
          setCommentsError("Unable to load comments from server.");
          setComments([]);
        } else {
          setComments(data);
        }
      } catch (err) {
        console.error("Fetch error loading comments", err);
        setCommentsError("Network error loading comments.");
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    }

    loadComments();
  }, [id]);

  // Load columns for the task's project so the Status dropdown
  // in the TaskForm can show the available columns when editing.
  useEffect(() => {
    async function loadColumnsForProject(projectId) {
      try {
        const res = await fetch(`/api/columns?project_id=${projectId}`);
        const data = await res.json().catch(() => null);
        if (!Array.isArray(data) || data.error) {
          console.error("API error loading columns for task detail", data);
          setColumnsForStatus([]);
        } else {
          const columns = data.map((col) => ({
            ...col,
            title: col.name,
            tasks: [],
          }));
          setColumnsForStatus(columns);
        }
      } catch (err) {
        console.error("Fetch error loading columns for task detail", err);
        setColumnsForStatus([]);
      }
    }

    if (task && task.project_id != null) {
      loadColumnsForProject(task.project_id);
    } else {
      setColumnsForStatus([]);
    }
  }, [task]);

  const {
    title,
    description,
    project_id,
    sprint_id,
    reporter_id,
    assignee_id,
    created_by,
    modified_by,
    column_id,
    start_date,
    due_date,
    created_at,
    updated_at,
  } = task || { id };

  const isOverdue = isDateOverdue(due_date);

  // Load the project name once the task (and its project_id) are available
  useEffect(() => {
    async function loadProjectName(projectId) {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || data.error) {
          console.error("API error loading project for task detail", data);
          setProjectName(null);
        } else {
          setProjectName(data.name || null);
        }
      } catch (err) {
        console.error("Fetch error loading project for task detail", err);
        setProjectName(null);
      }
    }

    if (task && task.project_id != null) {
      loadProjectName(task.project_id);
    } else {
      setProjectName(null);
    }
  }, [task]);

  let statusLabel = null;
  if (task) {
    if (column_id == null) {
      statusLabel = "Backlog";
    } else {
      const matchingColumn = columnsForStatus.find(
        (col) => Number(col.id) === Number(column_id),
      );
      if (matchingColumn) {
        statusLabel =
          matchingColumn.name || matchingColumn.title || `Column ${column_id}`;
      } else {
        statusLabel = `Column ${column_id}`;
      }
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {loading && <p className="text-white/60">Loading task details…</p>}
      {error && <p className="text-red-400">{error}</p>}

      <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-2">
          {title || `Task ${id}`}
        </h1>

        <button type="button" onClick={() => setShowEditModal(true)}>
        Edit Task
      </button>


        {description && <p className="text-white/90 text-lg">{description}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white/5 rounded-lg p-6 shadow-lg border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-white/20">
            Summary
          </h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
            {/* TODO: These will be filled in with the actual project name and sprint name, when those tables are available*/}
            {project_id != null && (
              <div className="flex flex-col">
                <dt className="text-white/60 text-sm mb-1">Project</dt>
                <dd className="text-white font-medium">{projectName || project_id}</dd>
            </div>
          )}

          {statusLabel && (
            <div className="flex flex-col">
              <dt className="text-white/60 text-sm mb-1">Status</dt>
              <dd className="text-white font-medium">{statusLabel}</dd>
              </div>
            )}
            {sprint_id != null && (
              <div className="flex flex-col">
                <dt className="text-white/60 text-sm mb-1">Sprint</dt>
                <dd className="text-white font-medium">{sprint_id}</dd>
              </div>
            )}

            {/* TODO: Fill these in with the usernames, when those tables are available*/}
            {assignee_id != null && (
              <div className="flex flex-col">
                <dt className="text-white/60 text-sm mb-1">Assignee</dt>
                <UserWithTime userId={assignee_id} users={users} />
              </div>
            )}
            {reporter_id != null && (
              <div className="flex flex-col">
                <dt className="text-white/60 text-sm mb-1">Reporter</dt>
                <UserWithTime userId={reporter_id} users={users} />
              </div>
            )}
          </dl>
        </section>

        <section className="bg-white/5 rounded-lg p-6 shadow-lg border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-white/20">
            Dates
          </h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex flex-col">
              <dt className="text-white/60 text-sm mb-1">Start</dt>
              <dd className="text-white font-medium">
                {formatDate(start_date)}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-white/60 text-sm mb-1">Due</dt>
              <dd
                className={`font-medium ${isOverdue ? "text-[#ff6b6b]" : "text-white"}`}
              >
                {formatDate(due_date)}
              </dd>
            </div>
            {created_at && (
              <div className="flex flex-col">
                <dt className="text-white/60 text-sm mb-1">Created</dt>
                <dd className="text-white font-medium">
                  {formatDate(created_at)}
                </dd>
              </div>
            )}
            {updated_at && (
              <div className="flex flex-col">
                <dt className="text-white/60 text-sm mb-1">Updated</dt>
                <dd className="text-white font-medium">
                  {formatDate(updated_at)}
                </dd>
              </div>
            )}
          </dl>
        </section>
      </div>

      <section className="bg-white/5 rounded-lg p-6 shadow-lg border border-white/10">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
          {created_by != null && (
            <div className="flex flex-col">
              <dt className="text-white/60 text-sm mb-1">Created by</dt>
              <UserWithTime userId={created_by} users={users} />
            </div>
          )}
          {modified_by != null && (
            <div className="flex flex-col">
              <dt className="text-white/60 text-sm mb-1">Modified By</dt>
              <UserWithTime userId={modified_by} users={users} />
            </div>
          )}
        </dl>
      </section>

      <section className="bg-white/5 rounded-lg p-6 shadow-lg border border-white/10">
        <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-white/20">
          Comments
        </h2>
        {commentsError && <p className="text-red-400 mb-4">{commentsError}</p>}
        {commentsLoading && (
          <p className="text-white/60 mb-4">Loading comments…</p>
        )}
        {comments.length === 0 && !commentsLoading && (
          <p className="text-white/40 mb-4">No comments yet.</p>
        )}

        <ul className="space-y-4 mb-6">
          {comments.map((c) => (
            <li
              key={c.id}
              className="bg-white/5 rounded-lg p-4 border border-white/10"
            >
              {editingCommentId === c.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={editingCommentContent}
                    onChange={(e) => setEditingCommentContent(e.target.value)}
                    rows={3}
                    className="bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 resize-none w-full"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!editingCommentContent.trim()) return;
                        try {
                          const res = await fetch(`/api/comments/${c.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ content: editingCommentContent }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data?.error || "Failed to update comment");
                          setComments((prev) =>
                            prev.map((comment) => comment.id === c.id ? data : comment)
                          );
                          setEditingCommentId(null);
                        } catch (err) {
                          console.error("Error updating comment:", err);
                          setCommentsError(err.message);
                        }
                      }}
                      className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-medium px-4 py-1 rounded-lg shadow-md transition-all duration-200 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCommentId(null)}
                      className="text-white/50 hover:text-white text-sm px-4 py-1 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-white mb-2">{c.content}</p>
                    <div className="text-white/50 text-sm">
                      <span>
                        {getUserLabel(c.created_by, users)} • {formatDateTime(c.created_at)}
                        {c.updated_at && c.updated_at !== c.created_at && (
                          <span className="italic text-white/30 ml-1">(edited)</span>
                        )}
                      </span>
                      {(() => {
                        const commenter = users.find((u) => u.id === Number(c.created_by));
                        const commenterTz = commenter?.timezone ?? null;
                        if (!commenterTz) return null;
                        return (
                          <div>Local time: {formatDateTime(c.created_at, commenterTz)}</div>
                        );
                      })()}
                    </div>
                  </div>
                  {currentUser && Number(c.created_by) === currentUser.id && (
                    <button
                      onClick={() => {
                        setEditingCommentId(c.id);
                        setEditingCommentContent(c.content);
                      }}
                      className="text-white/40 hover:text-white text-sm shrink-0 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="flex gap-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            testid="comments-textbox"
            className="flex-1 bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 resize-none"
            placeholder="Write a comment..."
          />

      <button
        onClick={async () => {
          if (!newComment.trim()) return; // don't post empty comments
          try {
            const res = await fetch("/api/comments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                task_id: id,
                created_by: currentUser?.id ?? null,
                content: newComment
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to post comment");

                  setComments((prev) => [...prev, data]); // add the new comment to state
                  setNewComment(""); // clear textarea
                } catch (err) {
                  console.error("Error posting comment:", err);
                  setCommentsError(err.message);
            }
            }}
            className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-medium px-6 rounded-lg shadow-md transition-all duration-200 self-start"
          >
            Add Comment
          </button>
        </div>
      </section>

      {showEditModal && (
        <TaskForm
          taskId={id}
          projectId={project_id != null ? project_id : null}
          columnsForStatus={columnsForStatus}
          onSuccess={(updatedTask) => {
            if (updatedTask) {
              setTask(updatedTask);
            }
            setShowEditModal(false);
          }}
          onCancel={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
