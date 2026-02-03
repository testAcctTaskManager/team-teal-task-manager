import KanbanColumn from "./KanbanColumn";
import './kanban.css'
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

    const onDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const newColumns = columns.map(col => ({ ...col, tasks: [...col.tasks] }));
        const [movedTask] = newColumns[Number(source.droppableId)].tasks.splice(source.index, 1);
        newColumns[Number(destination.droppableId)].tasks.splice(destination.index, 0, movedTask);
        setColumns(newColumns);
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <section className="kanban">
                <div className='title'>
                    <h2>Kanban Board</h2>
                </div>
                <div className='body'>
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
                        <p>No Columns</p>
                    )}
                </div>
            </section>
        </DragDropContext>
    )
}

export default Kanban