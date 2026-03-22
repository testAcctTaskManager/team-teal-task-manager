# Team Teal Task Manager

## Architecture

### Front End: CloudFlare Pages

This GitHub project uses Vite React and is integrated with CloudFlare Pages. If you make a draft pull request (PR) for your branch, you'll see the build result for CloudFlare pages with every push (i.e. git push -u origin branch-name) and are able to see the URL for accessing the preview build for your branch, as the CloudFlare bot automatically adds those details to your PR.

You can also see the build link on the branch by clicking the green checkmark icon (if successful) or red x icon (if any check failed), and then clicking on Details next to CloudFlare Pages. This means that a draft PR is not required to see the CloudFlare build URL, but instead can be accessed via your branch itself on GitHub.

Please note we are limited to 500 builds a month, so try to not push hundreds of changes while testing (local commits are fine). You can test locally as well using your localhost by running `npm run dev`.

### Back End: CloudFlare D1 SQL Database

The settings automatically use the test-db test database for non-main deployments, and the prod-db production database for the main branch deployments.

Database SQL files are run under the `migrations` folder, using a GitHub Actions workflow. The SQL files are run in order of their starting numbers (i.e. 001, 002, etc.), with previously run files not running even if changes are made. Changes must be made with new file number names.

Under functions/api, there are also helper functions in helpers.js to make it easier to create CRUD endpoints for tables. There are also example files, `functions/api/customers.js` for the example API customers endpoint and `functions/api/customers/[id].js` for the example API customers/:id endpoint. The sample Customers.jsx component demonstrates component use of those APIs.

For adding a new table, add the schema to the migrations folder, following the sequential order discussed above. Next, add the API endpoints. Lastly, interact with those API endpoints in the component.

## GitHub Actions (Workflows)

Workflows must succeed in order to merge a PR into the main branch. The workflows enabled for the project are detailed below. For workflows to run, their YAML files must be added under the `.github/workflows/` folder.

### Linter

The `.github/workflows/lint.yml` workflow runs ESLint, which is a JavaScript and TypeScript linter.

### D1 Migrations

The `.github/workflows/d1-migrations.yml` workflow runs the SQL files in the `task-manager/migrations/` folder sequentially. It only applies files that have not previously been applied (it does not check for changes), so to make a change, add it as a new SQL file with the filename starting with number greater than the current greatest number.

If it is a test branch (non main branch), a job runs the migrations on the test database, using GitHub secrets for the CloudFlare test database API token and CloudFlare account ID. If it is a main branch, a job runs the migrations on the prod database, using GitHub secrets for the CloudFlare prod database API token and the CloudFlare account ID.

For adding a new table, you'll need to add the schema to the migrations folder.
Then you'll want to add the API endpoints. Lastly, you'll want to interact with
those API endpoints in the component.

## Authentication Setup

The app uses Google OAuth for authentication. To run locally, you need a `.dev.vars` file in the `task-manager/` directory with the required secrets.

1. Copy the example file to .dev.vars:

    ```cp .dev.vars.example .dev.vars```

2. Fill in `GOOGLE_CLIENT_SECRET` -- it should be on the Slack, or ask Kayla.

3. The other values in the example file can be used as-is for local development.

For deployed environments, these values are set as Cloudflare Pages secrets.

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


## Creating an Admin User

New users default to the `developer` role. To promote a user to `admin`, update their role directly in the database.

**Locally:**

```bash
npx wrangler d1 execute cf_db --local --command "UPDATE Users SET role = 'admin' WHERE email = 'your@email.com';"
```

**On the test or prod database:**

```bash
# Test DB
npx wrangler d1 execute cf_db --command "UPDATE Users SET role = 'admin' WHERE email = 'your@email.com';"

# Prod DB (use the prod database name/binding if different)
npx wrangler d1 execute cf_db --env production --command "UPDATE Users SET role = 'admin' WHERE email = 'your@email.com';"
```

The user must have already logged in at least once before running this command (so their account exists in the DB). After updating, they will have access to the User Management page and can assign roles to other users from there.

## Reseeding the DB

To set DB back to only what is in the seed:

1. Navigate to `.wrangler/state/v3/d1/miniflare-D1DatabaseObject`

2. Delete the .sqlite file

3. Re-run local migration
    ``` npm run predev ```
