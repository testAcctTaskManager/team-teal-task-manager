import KanbanColumn from "./KanbanColumn";
import { DragDropContext } from "@hello-pangea/dnd";
/**
 * Kanban
 *
 * Kanban board component that displays KanbanColumn components
 * - Displays columns and tasks
 * - Columns can be scrolled through independently
 * - Tasks can be clicked to display full details
 */

function Kanban({ columns = [], setColumns = () => {} }) {
  // When the dragging ends
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    // Capture original column and position
    const originalPositions = {};
    const originalColumnIds = {};
    columns.forEach((column) => {
      (column.tasks || []).forEach((task) => {
        if (task && task.id !== undefined) {
          originalPositions[task.id] = Number(task.position) || 0;
          originalColumnIds[task.id] = column.id;
        }
      });
    });

    const newColumns = columns.map((col) => ({
      ...col,
      tasks: [...col.tasks],
    }));
    const [movedTask] = newColumns[Number(source.droppableId)].tasks.splice(
      source.index,
      1,
    );
    newColumns[Number(destination.droppableId)].tasks.splice(
      destination.index,
      0,
      movedTask,
    );
    setColumns(newColumns);

    // Update task position and column changes in the database
    (async () => {
      try {
        const updates = [];

        newColumns.forEach((column) => {
          column.tasks.forEach((task, idx) => {
            const updatesBody = {};

            // Get original values for task
            const originalPosition = originalPositions[task.id] ?? 0;
            const originalColumn = originalColumnIds[task.id];

            // If the task changed positions, add position update to the updates body
            if (originalPosition !== idx) updatesBody.position = idx;

            // If the task changed columns, add column_id update to the updates body
            if (originalColumn !== column.id) updatesBody.column_id = column.id;

            // Push update body changes to the tasks API
            if (Object.keys(updatesBody).length > 0) {
              updates.push(
                fetch(`/api/tasks/${task.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(updatesBody),
                }),
              );
            }
          });
        });

        if (updates.length > 0) await Promise.all(updates);
      } catch (err) {
        console.error("Error saving task positions", err);
      }
    })();
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <section className="flex flex-col rounded-lg w-full max-w-screen-2xl mx-auto min-h-[500px] bg-slate-800/30 shadow-xl">
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white text-center px-5 py-3 rounded-t-lg shadow-md">
          <h2 className="text-xl font-semibold m-0">Kanban Board</h2>
        </div>
        <div className="grid grid-flow-col auto-cols-[minmax(14rem,1fr)] gap-4 border border-white/10 border-t-0 rounded-b-lg px-4 py-6 overflow-x-auto bg-gradient-to-b from-slate-900/20 to-slate-900/40">
          {columns.length > 0 ? (
            <>
              {columns.map((column, colIndex) => (
                <KanbanColumn
                  key={colIndex}
                  colIndex={colIndex}
                  title={column.title}
                  tasks={column.tasks}
                />
              ))}
            </>
          ) : (
            <p className="text-white/40 text-center w-full">No Columns</p>
          )}
        </div>
      </section>
    </DragDropContext>
  );
}

export default Kanban;
