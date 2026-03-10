import { useEffect, useState } from "react";
import Board from "./Board";

function Sprints({ 
    columns = [], 
    sprintStatus = [],
    sprints = [],
    setSprintColumns = () => {}, 
    setSprintStatus = () => {}, 
    setSprintId = () => {},
    boardTitle = "Sprint"}) {

        const [buttonText, setButtonText] = useState("Not started");
        const [buttonDisabled, setButtonDisabled] = useState(false);

        const handleSprintSelection = (e) => {
            setSprintId(e.target.value);
        };

        const handleSprintState = (e) => {
            switch(sprintStatus) {
                case 'not_started':
                    setButtonText("In progress");
                    setSprintStatus('in_progress');
                    break;
                case 'in_progress':
                    setButtonText("Complete");
                    setButtonDisabled(true);
                    setSprintStatus('complete');
                    break;
            }
        };

    return (
        <>
            <select 
                id="sprint-selection"
                onChange={handleSprintSelection}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 cursor-pointer"
            >
                {sprints.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-800">
                  {s.name}
                </option>
              ))}
            </select>
            <button onClick={handleSprintState} disabled={buttonDisabled}>{buttonText}</button>
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