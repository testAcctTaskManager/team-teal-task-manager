import { useEffect, useState } from "react";
import Board from "./Board";

function Backlog({ backlog = [], onAddToSprint = null }) {
    const [backlogColumns, setBacklogColumns] = useState(backlog);

    useEffect(() => {
        setBacklogColumns(backlog);
    }, [backlog]);

    return (
        <Board
            columns={backlogColumns}
            setColumns={setBacklogColumns}
            boardTitle="Backlog"
            emptyColumnsText="No Backlog Sections"
            layout="vertical"
            fullWidthColumns={true}
            onAddToSprint={onAddToSprint}
        />
    );
}

export default Backlog;