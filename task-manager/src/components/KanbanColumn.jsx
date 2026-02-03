import TaskCard from './TaskCard'
import './KanbanColumn.css'
import { Droppable } from "@hello-pangea/dnd";

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
        <section className="kanban-column" ref={provided.innerRef} {...provided.droppableProps}>
          <div className='title'>
            {title}
          </div>
          <div className='body'>
            {tasks.length > 0 ? (
              <>
                {tasks.map((task, index) => (               
                  <TaskCard key={task.id} task={task} index={index} />  
                ))}
              </>
            ) : (
              <p>No Tasks</p>
            )}
          </div>
          {provided.placeholder}                        
        </section>
      )}
    </Droppable>
  )
}
