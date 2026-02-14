import TaskCard from "./TaskCard";
import { Droppable } from "@hello-pangea/dnd";

/**
 * KanbanColumn
 *
 * KanbanColumn component that is is reusable for all status columns.
 *
 * - Column displays its title at the top.
 * - Column renders all tasks passed into it.
 * - Column renders an empty state when no tasks exist.
 * - Component is reusable for all status columns.
 * - Styling visually distinguishes each column.
 *
 * Props:
 * - title: column title
 * - status: status value e.g. To Do, Blocked, In Progress, In Review, Complete
 * - tasks: list of tasks
 *
 *
 *
 * TODO: Change CSS upon status update
 * TODO: Create KanbanColumn tests
 *
 */
export default function KanbanColumn({ title, tasks = [], colIndex }) {
  return (
    <Droppable droppableId={String(colIndex)}>
      {(provided) => (
        <section className="flex flex-col rounded-lg flex-1 min-w-56 max-w-80 h-auto min-h-96 bg-white/5 shadow-lg">
          <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white text-left px-5 py-3 rounded-t-lg font-medium shadow-sm">
            {title}
          </div>
          <div
            className="flex-1 flex flex-col items-center min-h-80 overflow-y-auto scrollbar-none border border-white/10 border-t-0 rounded-b-lg p-2 bg-gradient-to-b from-transparent to-black/10"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.length > 0 ? (
              <>
                {tasks.map((task, index) => (
                  <TaskCard key={task.id} task={task} index={index} />
                ))}
                {provided.placeholder}
              </>
            ) : (
              <p className="text-white/40 text-sm mt-4">No Tasks</p>
            )}
            {tasks.length === 0 && provided.placeholder}
          </div>
        </section>
      )}
    </Droppable>
  );
}
