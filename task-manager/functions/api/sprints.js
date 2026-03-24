import { makeCrudHandlers } from "./helpers.js";

// Generic CRUD handlers
const sprintHandlers = makeCrudHandlers({
  table: "sprints",
  primaryKey: "id",
  allowedColumns: [
    "project_id",
    "name",
    "start_date",
    "end_date",
    "created_by",
    "status"
  ],
  dbEnvVar: "cf_db",
  orderBy: "id ASC",
});

// Routes
export const onRequestGet = sprintHandlers.collection;
export const onRequestOptions = sprintHandlers.collection;

export async function onRequestPost(context) {
  const { request, data } = context;
  const body = await request.json().catch(() => ({}));
  const callerId = Number(data?.user?.id);

  if (!Number.isFinite(callerId)) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  body.created_by = callerId;

  const normalizedRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: JSON.stringify(body),
  });

  return sprintHandlers.collection({ ...context, request: normalizedRequest });
}
