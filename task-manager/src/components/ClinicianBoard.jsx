import { useEffect, useState, useMemo } from "react";
import Board from "../components/Board";

//made by borrowing code from Home.jsx
export default function ClinicianBoard({ selectedAssignee, selectedReporter, selectedStatus }) {

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
                const mStatus =
                    selectedStatus === "all" ||
                    Number(t.column_id) === Number(selectedStatus);
                return mAssignee && mReporter && mStatus;
            }),
        }));
    }, [columns, selectedAssignee, selectedReporter, selectedStatus]);

    return (
        <Board
            columns={filteredColumns}
            setColumns={() => {}}
            boardTitle="Kanban Board"
            emptyColumnsText="No Columns"
        />
    );

}
