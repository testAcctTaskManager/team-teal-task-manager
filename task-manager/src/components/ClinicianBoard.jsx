import { useEffect, useState } from "react"; 
import Kanban from "../components/Kanban"; 

//made by borrowing code from Home.jsx
export default function ClinicianBoard() {

    const [columns, setColumns] = useState([]);

    async function loadClinitianBoard() {
        try {
            const [colRes, taskRes] = await Promise.all([
                //fetching the columns used in project 1 for now
                fetch(`/api/columns?project_id=1`),
                //fetching tasks by reporter 1 for now 
                fetch(`/api/tasks?reporter_id=1`)
            ]);

            //Borrowed from Home.jsx
            const cols = await colRes.json().catch(() => null);
            if (!Array.isArray(cols) || cols.error) {
                console.error("API error loading columns", cols);
                setColumns([]);
                return;
            }

            const taskList = await taskRes.json().catch(() => null);
            if (!Array.isArray(taskList) || taskList.error) {
                console.error("API error loading tasks", taskList);
                setColumns([]);
                return;
            }

            const columnsWithTasks = cols.map((col) => {
                const colTasks = taskList
                .filter((t) => Number(t.column_id) === Number(col.id))
                .sort(
                    (a, b) => (Number(a.position) || 0) - (Number(b.position) || 0),
                );
                return {
                ...col,
                title: col.name,
                tasks: colTasks,
                };
            });
            
            setColumns(columnsWithTasks);
    
        } catch (err) {
            console.error("Fetch error", err);
            setColumns([]);
        }
    }

    useEffect(() => {
        loadClinitianBoard();
    }, []);

    return (
        <Kanban
            columns={columns}
            setColumns={() => {}}
        />
    );

}
