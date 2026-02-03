import KanbanColumn from "./KanbanColumn";
import './kanban.css'
import { DragDropContext } from "@hello-pangea/dnd";
import { useState } from "react";
/**
 * Kanban
 *
 * Kanban board component that displays KanbanColumn components
 * - Displays 5 columns: To do, Blocked, In progress, In review, Complete
 * - Columns can be scrolled through independently
 * - Tasks can be clicked to display full details
 *
 * TODO: Get tasks from database
 */

function Kanban() {
    // sample tasks for testing
    const sampleTask1 = {
        id: 1,
        title: "Sample 1",
        description: "Sample desc 1",
        sprint_id: 1,
        reporter_id: 101,
        assignee_id: 202,
        start_date: "2026-02-01",
        due_date: "2026-02-07",
    };

    const sampleTask2 = {
        id: 2,
        title: "Sample 2",
        description: "Sample desc 2",
        sprint_id: 1,
        reporter_id: 101,
        assignee_id: 203,
        start_date: "2026-02-03",
        due_date: "2026-02-10",
    };

    const sampleTask3 = {
        id: 3,
        title: "Sample 3",
        description: "Sample desc 3",
        sprint_id: 1,
        reporter_id: 102,
        assignee_id: 202,
        start_date: "2026-02-05",
        due_date: "2026-02-12",
    };

    const sampleTask4 = {
        id: 4,
        title: "Sample 4",
        description: "Sample desc 4",
        sprint_id: 1,
        reporter_id: 102,
        assignee_id: 204,
        start_date: "2026-02-08",
        due_date: "2026-02-14",
    };


    const [columns, setColumns] = useState([
        { title: "To do", tasks: [sampleTask1, sampleTask2] },
        { title: "Blocked", tasks: [sampleTask4] },
        { title: "In Progress", tasks: [sampleTask3] },
        { title: "In Review", tasks: [] },
        { title: "Complete", tasks: [] }
    ]);

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