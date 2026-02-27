import Board from "./Board";
import { useMemo } from "react";

function Scrum({ columns = [], setColumns = () => {} }) {
    const scrumColumns = useMemo(() => {
        // todo: should probably check for capital B Backlog, but worried that
        // might break things if we send columns with backlogs but assume they
        // don't exist
        const hasBacklog = columns.some(
            (column) => (column.title || "").trim().toLowerCase() === "backlog",
        );

        if (!hasBacklog) {
            throw new Error("Scrum board requires exactly one 'Backlog' column.");
        }

        return columns;
    }, [columns]);

    return (
        <Board
            columns={scrumColumns}
            setColumns={setColumns}
            boardTitle="Scrum Board"
            emptyColumnsText="No Columns"
        />
    )
}

export default Scrum;