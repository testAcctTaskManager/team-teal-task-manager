// Notes:
// - These helpers still require you to pass safe whereClause strings that use ? placeholders for values.
//   Do NOT build whereClause by concatenating untrusted user input (validate identifiers instead).
// - Prefer supplying an allowedTables array (e.g. from env or hard-coded) when using table-name abstraction.
// - Column names are validated against a strict regex; values are parameterized to avoid injection.
// - For complex schemas, explicit per-table handlers remain more maintainable; these helpers are useful
//   when you have many similar tables and can centrally control allowed tables/columns.

/**
 * Build CORS headers for a request if the `Origin` is allowed.
 * Returns `null` when the origin is not allowed or a headers object otherwise.
 * @param {object} env - Worker environment (may include ALLOWED_ORIGINS, ALLOW_CREDENTIALS)
 * @param {Request} req - Incoming Request object
 * @param {string} [methods] - Allowed HTTP methods (default: "GET,POST,OPTIONS")
 * @returns {Record<string,string>|null}
 */
export function buildCorsHeaders(env, req, methods = "GET,POST,OPTIONS") {
  const origin = req.headers.get("Origin");
  if (!origin) return { "Content-Type": "application/json" };
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowCredentials = env.ALLOW_CREDENTIALS === "true";
  const serverOrigin = new URL(req.url).origin;

  if (allowed.length === 0) {
    if (origin !== serverOrigin) return null;
  } else {
    if (!allowed.includes(origin)) return null;
  }

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (allowCredentials) headers["Access-Control-Allow-Credentials"] = "true";
  return headers;
}

/**
 * Execute a query and return an array of rows.
 * Normalizes driver responses (some return { results: [...] }).
 * @param {object} db - D1/database binding
 * @param {string} sql - SQL statement
 * @param {Array} params - parameter values for placeholders
 * @returns {Promise<Array<object>>}
 */
export async function queryAll(db, sql, params = []) {
  const res = await db
    .prepare(sql)
    .bind(...params)
    .all();
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.results)) return res.results;
  return [];
}

/**
 * Execute a query and return a single row or null.
 * @param {object} db
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<object|null>}
 */
export async function queryOne(db, sql, params = []) {
  const row = await db
    .prepare(sql)
    .bind(...params)
    .first();
  return row === undefined ? null : row;
}

/**
 * Execute a non-select statement and return the driver's run result.
 * @param {object} db
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<object>} run info
 */
export async function execute(db, sql, params = []) {
  return db
    .prepare(sql)
    .bind(...params)
    .run();
}

/**
 * Safely parse request JSON. Returns `{}` on parse errors or non-JSON content.
 * @param {Request} req
 * @returns {Promise<object>}
 */
export async function parseJson(req) {
  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.toLowerCase().includes("application/json")) return {};
    return await req.json().catch(() => ({}));
  } catch {
    return {};
  }
}

/**
 * Validate a SQL identifier (table or column name).
 * Only ASCII letters, digits and underscore are allowed and it must not start with a digit.
 * @param {string} name
 * @returns {string}
 */
export function validateIdentifier(name) {
  if (typeof name !== "string" || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid identifier: ${String(name)}`);
  }
  return name;
}

/**
 * Validate table name and optionally check it exists in an allow-list.
 * @param {string} table
 * @param {Array<string>} allowedTables
 * @returns {string}
 */
export function validateTable(table, allowedTables = []) {
  validateIdentifier(table);
  if (
    Array.isArray(allowedTables) &&
    allowedTables.length > 0 &&
    !allowedTables.includes(table)
  ) {
    throw new Error(`Table not allowed: ${table}`);
  }
  return table;
}

/**
 * Validate an array of column names. Returns the same array when valid, or [] when empty.
 * @param {Array<string>} cols
 * @returns {Array<string>}
 */
export function validateColumnNames(cols) {
  if (!Array.isArray(cols) || cols.length === 0) return [];
  cols.forEach((c) => validateIdentifier(c));
  return cols;
}

/**
 * Select multiple rows from a table.
 * The `whereClause` must use `?` placeholders for parameters supplied in `params`.
 * @param {object} db - D1/database binding
 * @param {string} table - table name (validated)
 * @param {{whereClause?: string, params?: Array}} [options]
 * @param {Array<string>} allowedTables - optional allow-list of table names
 * @returns {Promise<Array<object>>} array of rows (may be empty)
 */
export async function selectAllFrom(
  db,
  table,
  { whereClause = "", params = [] } = {},
  allowedTables = [],
) {
  validateTable(table, allowedTables);
  const sql = `SELECT * FROM ${table}${whereClause ? " WHERE " + whereClause : ""}`;
  return queryAll(db, sql, params);
}

/**
 * Select a single row from a table.
 * Returns the row object or `null` if not found.
 * @param {object} db
 * @param {string} table
 * @param {{whereClause?: string, params?: Array}} [options]
 * @param {Array<string>} allowedTables
 * @returns {Promise<object|null>}
 */
export async function selectOneFrom(
  db,
  table,
  { whereClause = "", params = [] } = {},
  allowedTables = [],
) {
  validateTable(table, allowedTables);
  const sql = `SELECT * FROM ${table}${whereClause ? " WHERE " + whereClause : ""}`;
  return queryOne(db, sql, params);
}

/**
 * Insert a row into a table with validated column names and parameterized values.
 * Returns the run result.
 * @param {object} db
 * @param {string} table
 * @param {Array<string>} columns
 * @param {Array} values
 * @param {Array<string>} allowedTables
 * @returns {Promise<object>} run info
 */
export async function insertInto(
  db,
  table,
  columns = [],
  values = [],
  allowedTables = [],
) {
  validateTable(table, allowedTables);
  validateColumnNames(columns);
  if (columns.length !== values.length)
    throw new Error("Columns and values length mismatch");
  const colList = columns.join(", ");
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT INTO ${table} (${colList}) VALUES (${placeholders})`;
  return execute(db, sql, values);
}

/**
 * Update columns on a table using a parameterized WHERE clause.
 * `updatesObj` keys are validated as column names.
 * @param {object} db
 * @param {string} table
 * @param {object} updatesObj - mapping column -> new value
 * @param {string} whereClause - optional WHERE clause (use `?` placeholders)
 * @param {Array} whereParams - params for the WHERE clause
 * @param {Array<string>} allowedTables
 * @returns {Promise<object>} run info
 */
export async function updateTable(
  db,
  table,
  updatesObj = {},
  whereClause = "",
  whereParams = [],
  allowedTables = [],
) {
  validateTable(table, allowedTables);
  if(!whereClause) throw new Error("Missing WHERE clause for update");
  const cols = Object.keys(updatesObj);
  if (cols.length === 0) throw new Error("Nothing to update");
  validateColumnNames(cols);
  const assignments = cols.map((c) => `${c} = ?`).join(", ");
  const params = cols.map((c) => updatesObj[c]).concat(whereParams);
  const sql = `UPDATE ${table} SET ${assignments}${whereClause ? " WHERE " + whereClause : ""}`;
  return execute(db, sql, params);
}

/**
 * Delete rows from a table using a parameterized WHERE clause.
 * @param {object} db
 * @param {string} table
 * @param {{whereClause?: string, params?: Array}} [options]
 * @param {Array<string>} allowedTables
 * @returns {Promise<object>} run info
 */
export async function deleteFrom(
  db,
  table,
  { whereClause = "", params = [] } = {},
  allowedTables = [],
) {
  validateTable(table, allowedTables);
  if(!whereClause) throw new Error("Missing WHERE clause for delete");
  const sql = `DELETE FROM ${table}${whereClause ? " WHERE " + whereClause : ""}`;
  return execute(db, sql, params);
}

/**
 * Create generic CRUD handlers for a table.
 * Options:
 * - `table` (string, required): table name
 * - `primaryKey` (string): primary key column name (default: 'id')
 * - `allowedTables` (Array<string>): optional allowlist of table names
 * - `allowedColumns` (Array<string>): columns to accept for inserts/updates
 * - `dbEnvVar` (string): env key for DB binding (default: 'cf_db')
 * - `orderBy` (string): ORDER BY clause for collection GET
 *
 * Returns an object `{ collection, item }` where `collection` handles
 * GET/POST/OPTIONS for the collection and `item` handles GET/PUT/PATCH/DELETE/OPTIONS
 * for a single resource identified by `:id` (or `params[primaryKey]`).
 *
 * @param {object} options
 * @returns {{collection: function, item: function}}
 */
export function makeCrudHandlers(options = {}) {
  const {
    table,
    primaryKey = "id",
    allowedTables = [],
    allowedColumns = [],
    dbEnvVar = "cf_db",
    orderBy = "",
  } = options;

  if (!table) throw new Error("makeCrudHandlers requires a table name");
  validateTable(table, allowedTables);
  validateIdentifier(primaryKey);
  if (allowedColumns && allowedColumns.length)
    validateColumnNames(allowedColumns);

  // Collection handler: GET (list), POST (create), OPTIONS
  async function collection(context) {
    const { request, env } = context;
    const db = env[dbEnvVar];
    const CORS = buildCorsHeaders(env, request, "GET,POST,OPTIONS");
    if (request.headers.get("Origin") && !CORS) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      if (!db)
        return new Response(JSON.stringify({ error: "Database not found" }), {
          status: 500,
          headers: CORS,
        });
      if (request.method === "OPTIONS")
        return new Response(null, { status: 204, headers: CORS });

      if (request.method === "GET") {
        const whereClause = "";
        const params = [];
        const order = orderBy ? ` ORDER BY ${orderBy}` : "";
        const sql = `SELECT * FROM ${table}${whereClause}${order}`;
        const rows = await queryAll(db, sql, params);
        return new Response(JSON.stringify(rows || []), { headers: CORS });
      }

      if (request.method === "POST") {
        const body = await parseJson(request);
        // Choose columns from allowedColumns if provided (but only those present in body), otherwise from body keys
        const payloadCols =
          allowedColumns && allowedColumns.length
            ? allowedColumns.filter((c) => body[c] !== undefined)
            : Object.keys(body || {}).filter((k) => body[k] !== undefined);
        validateColumnNames(payloadCols);
        const values = payloadCols.map((c) => body[c]);
        if (payloadCols.length === 0) {
          return new Response(JSON.stringify({ error: "Nothing to create" }), {
            status: 400,
            headers: CORS,
          });
        }

        await insertInto(db, table, payloadCols, values, allowedTables);
        const created = await queryOne(
          db,
          `SELECT * FROM ${table} WHERE ${primaryKey} = last_insert_rowid()`,
        );
        return new Response(JSON.stringify(created || {}), {
          status: 201,
          headers: CORS,
        });
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: CORS,
      });
    } catch (err) {
      console.error(
        `/api/${table} collection error:`,
        err && err.stack ? err.stack : err,
      );
      return new Response(
        JSON.stringify({ error: String(err || "Internal error") }),
        { status: 500, headers: CORS || { "Content-Type": "application/json" } },
      );
    }
  }

  // Item handler: GET, PUT/PATCH, DELETE, OPTIONS
  async function item(context) {
    const { request, env, params } = context;
    const id = params && (params.id || params[primaryKey]);
    const db = env[dbEnvVar];
    const CORS = buildCorsHeaders(env, request, "GET,PUT,PATCH,DELETE,OPTIONS");
    if (request.headers.get("Origin") && !CORS) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      if (!db)
        return new Response(JSON.stringify({ error: "Database not found" }), {
          status: 500,
          headers: CORS,
        });
      if (request.method === "OPTIONS")
        return new Response(null, { status: 204, headers: CORS });
      if (!id)
        return new Response(JSON.stringify({ error: "Missing id" }), {
          status: 400,
          headers: CORS,
        });

      if (request.method === "GET") {
        const row = await selectOneFrom(
          db,
          table,
          { whereClause: `${primaryKey} = ?`, params: [id] },
          allowedTables,
        );
        if (!row)
          return new Response(JSON.stringify({}), {
            status: 404,
            headers: CORS,
          });
        return new Response(JSON.stringify(row), { headers: CORS });
      }

      if (request.method === "PUT" || request.method === "PATCH") {
        const body = await parseJson(request);
        // prepare updates using allowedColumns (if provided) or any keys in body
        const updates = {};
        const candidates =
          allowedColumns && allowedColumns.length
            ? allowedColumns
            : Object.keys(body || {});
        candidates.forEach((col) => {
          if (body[col] !== undefined) updates[col] = body[col];
        });
        const cols = Object.keys(updates);
        if (cols.length === 0) {
          return new Response(JSON.stringify({ error: "Nothing to update" }), {
            status: 400,
            headers: CORS,
          });
        }

        await updateTable(
          db,
          table,
          updates,
          `${primaryKey} = ?`,
          [id],
          allowedTables,
        );
        const updated = await selectOneFrom(
          db,
          table,
          { whereClause: `${primaryKey} = ?`, params: [id] },
          allowedTables,
        );
        return new Response(JSON.stringify(updated || {}), { headers: CORS });
      }

      if (request.method === "DELETE") {
        await deleteFrom(
          db,
          table,
          { whereClause: `${primaryKey} = ?`, params: [id] },
          allowedTables,
        );
        return new Response(null, { status: 204, headers: CORS });
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: CORS,
      });
    } catch (err) {
      console.error(
        `/api/${table}/${id} error:`,
        err && err.stack ? err.stack : err,
      );
      return new Response(
        JSON.stringify({ error: String(err || "Internal error") }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  return { collection, item };
}
