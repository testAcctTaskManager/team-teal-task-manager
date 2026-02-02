import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { formatDate, isDateOverdue } from "../utils/dateHelpers.js";
import "./taskdetail.css";

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


  const {
    title,
    description,
    project_id,
    sprint_id,
    reporter_id,
    assignee_id,
    created_by,
    modified_by,
    start_date,
    due_date,
    created_at,
    updated_at,
  } = task || { id };

  const isOverdue = isDateOverdue(due_date);

  return (
    <div className="task-detail-page">

      {loading && <p>Loading task details…</p>}
      {error && <p>{error}</p>}

      <h1>{title || `Task ${id}`}</h1>

      {description && <p>{description}</p>}

      <section className="task-detail-section">
        <h2>Summary</h2>
        <dl>
          {/* TODO: These will be filled in with the actual project name and sprint name, when those tables are available*/}
          {project_id != null && (
            <div>
              <dt>Project</dt>
              <dd>{project_id}</dd>
            </div>
          )}
          {sprint_id != null && (
            <div>
              <dt>Sprint</dt>
              <dd>{sprint_id}</dd>
            </div>
          )}

          {/* TODO: Fill these in with the usernames, when those tables are available*/}
          {assignee_id != null && (
            <div>
              <dt>Assignee</dt>
              <dd>{assignee_id}</dd>
            </div>
          )}
          {reporter_id != null && (
            <div>
              <dt>Reporter</dt>
              <dd>{reporter_id}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="task-detail-section">
        <h2>Dates</h2>
        <dl>
          <div>
            <dt>Start</dt>
            <dd>{formatDate(start_date)}</dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd className={isOverdue ? "task-detail__due task-detail__overdue" : "task-detail__due"}>
              {formatDate(due_date)}
            </dd>
          </div>
          {created_at && (
            <div>
              <dt>Created</dt>
              <dd>{formatDate(created_at)}</dd>
            </div>
          )}
          {updated_at && (
            <div>
              <dt>Updated</dt>
              <dd>{formatDate(updated_at)}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="task-detail-section">
        <dl>
          {created_by != null && (
            <div>
              <dt>Created by</dt>
              <dd>{created_by}</dd>
            </div>
          )}
          {modified_by != null && (
            <div>
              <dt>Last modified by</dt>
              <dd>{modified_by}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="task-detail-section">
          <h2>Comments</h2>
          {commentsError && <p>{commentsError}</p>}
          {commentsLoading && <p>Loading comments…</p>}
          {comments.length === 0 && !commentsLoading && <p>No comments yet.</p>}

          <ul className="comments-list">
            {comments.map((c) => (
              <li key={c.id}>
                <p>{c.content}</p>
                <small>
                  {c.created_by} {formatDate(c.created_at)}
                </small>
              </li>
            ))}
          </ul>

          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="comments-textbox"
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
                created_by: 1,     // TODO: replace this with current user when we add user data
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
        >
          Add Comment
        </button>
      </section>
    </div>
  );
}
