import { useEffect, useState } from "react";
import Board from "./Board";

function Sprints({ 
    columns = [], 
    sprints = [],
    setSprintColumns = () => {}, 
    setSprints = () => {}, 
    setSprintId = () => {},
    boardTitle = "Sprint"}) {
        console.log("sprints: ");
        console.log(sprints);
    return (
        <>
            <select 
                onChange={setSprintId}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 cursor-pointer"
            >
                {sprints.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-800">
                  {s.name}
                </option>
              ))}
            </select>
            <button onClick={setSprints}>Start sprint</button>
            <Board
                columns={columns}
                setColumns={setSprintColumns}
                boardTitle={boardTitle}
                emptyColumnsText="No Sprints"
                layout="vertical"
                fullWidthColumns={true}
            />
        </>
    );
}

export default Sprints;