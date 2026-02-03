import { useNavigate } from "react-router-dom";
import "./taskcard.css";
import { formatDate, isDateOverdue } from "../utils/dateHelpers.js";
import { Draggable } from "@hello-pangea/dnd";


/**
 * TaskCard
 *
 * Presentational component for displaying a single task inside a board column.
 * - Does not make any API calls.
 * - Expects a populated `task` object to be passed in as a prop.
 * - The parent column / list is responsible for loading tasks from the backend
 *   and passing the correct data into this component.
 */
export default function TaskCard({ task, index }) {
  const navigate = useNavigate();

  if (!task || task.id == null) {
    return null;
  }

  const {
    id,
    title,
    description,
    sprint_id,
    reporter_id,
    assignee_id,
    start_date,
    due_date,
  } = task;

  const isOverdue = isDateOverdue(due_date);

  return (
    <Draggable draggableId={String(id)} index={index}> 
      {(provided) => (
    <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      className="task-card"
      onClick={() => navigate(`/task/${id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/task/${id}`);
        }
      }}
    >
      <div className="task-card__header">
        <h3 className="task-card__title">{title}</h3>
      </div>

      {description && (
        <p className="task-card__description">
          {description.length > 120
            ? `${description.slice(0, 117)}...`
            : description}
        </p>
      )}

      <dl className="task-card__meta">
        <div>
          <dt>ID</dt>
          <dd>{id}</dd>
        </div>
        {sprint_id != null && (
          <div>
            <dt>Sprint</dt>
            <dd>{sprint_id}</dd>
          </div>
        )}
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
        <div>
          <dt>Start</dt>
          <dd>{formatDate(start_date)}</dd>
        </div>
        <div>
          <dt>Due</dt>
          <dd className={isOverdue ? "task-card__due task-card__overdue" : "task-card__due"}>
            {formatDate(due_date)}
          </dd>
        </div>
      </dl>
    </div>
    )}
    </Draggable>
  );
}
