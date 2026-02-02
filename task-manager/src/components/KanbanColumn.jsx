import TaskCard from './TaskCard'
import './KanbanColumn.css'

// Component is reusable for all status columns.
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
 * TODO: Add drag and drop capabilities
 * 
 * TODO: Change CSS upon status update
 * TODO: Create KanbanColumn tests
 *
 */
export default function KanbanColumn( {title, tasks=[]} ) {
    return (
        <section className={`kanban-column`}>
            {/* Display title at the top */}
            <div className='title'>
                {title}
            </div>

            {/* Render all tasks */}
            {/* Render an empty state when no tasks exist */}
            <div className='body'>
                {tasks.length > 0 ? (
                    <>
                        {tasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                        ))}
                    </>
                    
                ) : (
                    <p>No Tasks</p>
                )}
            </div>
        </section>
    )
}
