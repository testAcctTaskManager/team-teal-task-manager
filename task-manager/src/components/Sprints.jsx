import { useEffect, useState } from "react";
import Board from "./Board";

function Sprints({ columns = [], setSprintColumns = () => {}, boardTitle = "Sprint"}) {
    return (
        <Board
            columns={columns}
            setColumns={setSprintColumns}
            boardTitle={boardTitle}
            emptyColumnsText="No Sprints"
            layout="vertical"
            fullWidthColumns={true}
        />
    );
}

export default Sprints;