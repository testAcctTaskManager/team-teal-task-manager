import { useEffect, useState } from "react";
import Board from "./Board";

function Sprints({ sprints = [] }) {
    const [sprintColumns, setSprintColumns] = useState(sprints);

    useEffect(() => {
        setSprintColumns(sprints);
    }, [sprints]);

    return (
        <Board
            columns={sprintColumns}
            setColumns={setSprintColumns}
            boardTitle="Sprints"
            emptyColumnsText="No Sprints"
            layout="vertical"
            fullWidthColumns={true}
        />
    );
}

export default Sprints;