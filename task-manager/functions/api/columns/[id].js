import { makeCrudHandlers  } from "../helpers";

const columnHandlers = makeCrudHandlers({
    table: "Columns",
    primaryKey: "id",
    allowedColumns: ["project_id", "name", "key", "position"],
    dbEnVar: "cf_db",
    orderBy: "position ASC",
});

export const onRequestGet = columnHandlers.item; 
export const onRequestPut = columnHandlers.item; 
export const onRequestPatch = columnHandlers.item; 
export const onRequestDelete = columnHandlers.item; 
export const onRequestOptions = columnHandlers.item;