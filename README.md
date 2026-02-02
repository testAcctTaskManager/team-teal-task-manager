# Team Teal Task Manager

## Using CloudFlare Pages

GitHub has been integrated with CloudFlare pages. If you make a draft pull request for your branch, you'll see the build result for CloudFlare pages with every push (i.e. git push -u origin branch-name) and are able to see the URL for accessing the preview build for your branch. Please note we are limited to 500 builds a month, so try to not spam pushes (local commits are fine).

## Using the D1 SQL Database

The settings automatically use the test-db test database for non-main deployments, and the prod-db production database for the main branch deployments.

I've added example database files under the `migrations` folder. The SQL files are run in order of their starting numbers (i.e. 001, 002, etc.). Under functions/api, I've added helpers.js to try to make it easier to make CRUD endpoints for tables. I've added `functions/api/customers.js` for the example API customers endpoint and `functions/api/customers/[id].js` for the example API customers/:id endpoint. I've also added Customers.jsx as a component to demonstrate how to use the APIs.

For adding a new table, you'll need to add the schema to the migrations folder.
Then you'll want to add the API endpoints. Lastly, you'll want to interact with
those API endpoints in the component.

## Testing changes locally

To run a local copy of the DB and test your changes on a local host:

1. Navigate to `task-manager` directory. (Directory with `package.json`)

2. Migrate the database locally (creates a local D1 SQLite DB)

    ``` npm run predev ```

3. Build the frontend

    ``` npm run build ```

3. Start the local development server. This runs Cloudflare Pages + API server locally.

    ``` npm run dev ```

    Note: ``` npm run dev:vite ``` only runs the front end, no API.

4. Should see output telling you which port the local server is on:

    ```[wrangler:info] Ready on http://localhost:8788```

5. API URLs can be viewed using this local host. For example, this URL should
   let you view all tasks in the DB, if the port being used is 8788:

    ```http://localhost:8788/api/tasks```  


## Reseeding the DB

To set DB back to only what is in the seed:

1. Navigate to `.wrangler/state/v3/d1/miniflare-D1DatabaseObject`

2. Delete the .sqlite file

3. Re-run local migration
    ``` npm run predev ```
