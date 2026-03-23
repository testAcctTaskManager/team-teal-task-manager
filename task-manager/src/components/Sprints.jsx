import Board from "./Board";

/*
* Sprints
*
* Sprint component that displays the tasks in the currently selected sprint.
* Completion button moves the sprint through not_started → in_progress → complete.
* When no sprint exists, a "Create New Sprint" button is shown instead.
*/
function Sprints({
    columns = [],
    sprintStatus = null,
    sprintName = null,
    setSprintColumns = () => {},
    setSprintStatus = () => {},
    updateSprintStatus = () => {},
    createSprint = () => {},
    boardTitle = "Sprint"}) {

    const statusLabels = {
        not_started: "Not Started",
        in_progress: "In Progress",
        complete: "Complete",
    };

    const handleSprintState = () => {
        if (!sprintName) {
            createSprint();
            return;
        }
        switch(sprintStatus) {
            case 'not_started':
                updateSprintStatus('in_progress');
                setSprintStatus('in_progress');
                break;
            case 'in_progress':
                updateSprintStatus('complete');
                setSprintStatus('complete');
                break;
        }
    };

    const buttonText = !sprintName
        ? "Create New Sprint"
        : sprintStatus === 'not_started'
        ? "Start Sprint"
        : "Complete Sprint";

    return (
        <>
            <div className="flex items-center gap-3 mb-2">
                {sprintName && (
                    <span className="text-white font-semibold text-sm">{sprintName}</span>
                )}
                {sprintName && sprintStatus && (
                    <span className="text-white/60 text-xs">
                        {statusLabels[sprintStatus] ?? sprintStatus}
                    </span>
                )}
                <button onClick={handleSprintState}>{buttonText}</button>
            </div>
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
