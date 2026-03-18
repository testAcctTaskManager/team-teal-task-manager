import { useEffect, useState, useMemo } from "react"; 
import Kanban from "../components/Kanban"; 

//made by borrowing code from Home.jsx
export default function ClinicianBoard({ selectedAssignee, selectedReporter }) {

    const [columns, setColumns] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);


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

    /* Custom data loader for task filtering - added to fetch user/project lists */
    async function loadFilterMetadata() {
        try {
            const [uRes, pRes] = await Promise.all([
                fetch("/api/users"),
                fetch("/api/projects"),
            ]);
            const uData = await uRes.json();
            const pData = await pRes.json();
            if (Array.isArray(uData)) setUsers(uData);
            if (Array.isArray(pData)) setProjects(pData);
        } catch (e) {
            console.error("Filter metadata error", e);
        }
    };

    useEffect(() => {
        loadClinitianBoard();
        // Task filtering trigger
        loadFilterMetadata();
    }, []);

    /* Task filtering engine - this calculate a 'view' without changing columns state */
    const filteredColumns = useMemo(() => {
       return columns.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => {
                const mAssignee = 
                    selectedAssignee === "all" ||
                    Number(t.assignee_id) === Number(selectedAssignee);
                const mReporter =
                    selectedReporter === "all" ||
                    Number(t.reporter_id) === Number(selectedReporter);
                return mAssignee && mReporter;
            }),
        })); 
    }, [columns, selectedAssignee, selectedReporter]);

    return (
        <Kanban
            columns={filteredColumns}
            setColumns={() => {}}
        />
    );

}
