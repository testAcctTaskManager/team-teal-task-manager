import { useEffect, useState } from "react";
import Board from "./Board";

function Backlog({ backlog = [] }) {
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
        />
    );
}

export default Backlog;