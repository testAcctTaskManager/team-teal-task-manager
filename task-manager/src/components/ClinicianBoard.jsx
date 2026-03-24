import { useEffect, useState, useMemo, useContext } from "react";
import Board from "../components/Board";
import { UsersContext } from "../contexts/UsersContext.jsx";

export default function ClinicianBoard({ selectedAssignee, selectedReporter, selectedStatus, reloadKey }) {

    const { currentUser } = useContext(UsersContext);
    const [columns, setColumns] = useState([]);

    async function loadClinicianBoard() {
        if (!currentUser) return;
        try {
            const [colRes, taskRes] = await Promise.all([
                fetch(`/api/columns`),
                fetch(`/api/tasks?created_by=${currentUser.id}`)
            ]);

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

            // tasks with no column id are in the backlog
            const backlogTasks = taskList.filter((t) => !t.column_id);

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

            // add (to start) backlog column for tasks not yet in any column
            if (backlogTasks.length > 0) {
                columnsWithTasks.unshift({
                    id: "backlog",
                    name: "Backlog",
                    title: "Backlog",
                    tasks: backlogTasks,
                });
            }

            // only show columns that have tasks belonging to current user
            setColumns(columnsWithTasks.filter((col) => col.tasks.length > 0));

        } catch (err) {
            console.error("Fetch error", err);
            setColumns([]);
        }
    }

    useEffect(() => {
        loadClinicianBoard();
    }, [currentUser, reloadKey]);

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
