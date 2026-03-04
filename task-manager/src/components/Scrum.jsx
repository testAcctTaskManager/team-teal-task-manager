import Board from "./Board";

function Scrum({ columns = [], setColumns = () => {} }) {
    return (
        <Board
            columns={columns}
            setColumns={setColumns}
            boardTitle="Scrum Board"
            emptyColumnsText="No Columns"
        />
    )
}

export default Scrum;