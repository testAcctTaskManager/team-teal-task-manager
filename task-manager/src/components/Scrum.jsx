import Board from "./Board";

function Scrum({ columns = [], setColumns = () => {} }) {
    return (
        <Board
            columns={columns}
            setColumns={setColumns}
            boardTitle="Scrum Board"
            emptyColumnsText="No Columns"
            layout="horizontal"
            fullWidthColumns={false}
        />
    )
}

export default Scrum;