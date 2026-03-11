import { useEffect, useState } from "react";
import Board from "./Board";

/*
* Sprints
*
* Sprint component that displays the tasks in the currently selected sprint.
* Selection box allows the user to select from sprints in the project.
* Completion button toggles between not started, in progress, and completed.
* Completion button updates the project status in the database.
*/
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

        // Set selected currently sprint id.
        const handleSprintSelection = (e) => {
            setSprintId(e.target.value);
        };

        // Change the buttons text and disabled status to match current sprint status.
        const updateButton = () => {
            switch(sprintStatus) {
                case 'not_started':
                    setButtonText("Not started");
                    setButtonDisabled(false);
                    break;
                case 'in_progress':
                    setButtonText("In progress");
                    setButtonDisabled(false);
                    break;
                case 'complete':
                    setButtonText("Completed");
                    setButtonDisabled(true);
                    break;
            }
        }

        // On click for button to update the database sprint status and button state. 
        const handleSprintState = (e) => {
            switch(sprintStatus) {
                case 'not_started':
                    setSprintStatus('in_progress');
                    updateButton();
                    break;
                case 'in_progress':
                    setSprintStatus('complete');
                    updateButton();
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