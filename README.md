# Team Teal Task Manager

## Table of Contents

- [Project Overview](#project-overview)
- [Team Members](#team-members)
- [Steps to Migrate This Project to Your Own Infrastructure](#steps-to-migrate-this-project-to-your-own-infrastructure)
- [Architecture](#architecture)
    - [Front End: CloudFlare Pages](#front-end-cloudflare-pages)
    - [Back End: CloudFlare D1 SQL Database](#back-end-cloudflare-d1-sql-database)
- [GitHub Actions (Workflows)](#github-actions-workflows)
    - [Linter](#linter)
    - [Tests](#tests)
    - [D1 Migrations](#d1-migrations)
- [Testing Changes Locally](#testing-changes-locally)
    - [Local Authentication Setup](#local-authentication-setup)
    - [Building the Webapp Locally](#building-the-webapp-locally)
    - [Local Initial Admin Setup](#local-initial-admin-setup)
    - [Reseeding the DB](#reseeding-the-db)
- [Auth and Admin Setup](#auth-and-admin-setup)
    - [Initial Admin Setup for Test Database](#initial-admin-setup-for-test-database)
    - [Initial Admin Setup for Production Database](#initial-admin-setup-for-production-database)
    - [Managing Users after Initial Admin Is Created](#managing-users-after-initial-admin-is-created)
- [Thank You](#thank-you)

## Project Overview

This is a Task Manager app for the final project for CSB430, created as a minimal viable project (MVP) for a Task Manager used for managing projects related to VR Phobia treatment.

Features include:
- Projects creation (each Project has a dedicated Kanban/Scrum) 
- Kanban boards
- Scrum capabilities (backlog and sprints)
- Clinician Dashboard for clinicians to create new requests and see the status of their created requests
- User Management features (admins only)

The production (main branch) webapp is accessible via https://team-teal-task-manager.pages.dev/, for as long as the infrastructure is up as part of this class. Instructions below include how to set up the project as your own repo, access development branch builds (preview builds), and build locally.

## Team Members

- Alex Coover
- Aune Mitchell
- Henry Staiff
- Jay Arends
- Joel Yang
- Kayla Rieck
- Sandra Gran
- Skye Hobbs
- Tinisha Davis

## Steps to Migrate This Project to Your Own Infrastructure

If you want to set up this project for your own uses in your own account, you'll need to fork the repo, set up your infrastructure, and add necessary secrets and values specific to the infrastructure. Please follow the steps outlined in `FORK_REPO_SETUP.md` to setup the project in GitHub, Cloudflare, and the Google Console (for OAuth).

## Architecture

### Front End: CloudFlare Pages

This GitHub project uses Vite React and is integrated with CloudFlare Pages. If you make a draft pull request (PR) for your branch, you'll see the build result for CloudFlare pages with every push (i.e. git push -u origin branch-name) and are able to see the URL for accessing the preview build for your branch, as the CloudFlare bot automatically adds those details to your PR.

You can also see the build link on the branch by clicking the green checkmark icon (if successful) or red x icon (if any check failed), and then clicking on Details next to CloudFlare Pages. This means that a draft PR is not required to see the CloudFlare build URL, but instead can be accessed via your branch itself on GitHub.

Please note that the free CloudFlare Pages plan is limited to 500 builds a month, so try to not push hundreds of changes while testing (local commits are fine). This guide includes instructions on local development setup.

### Back End: CloudFlare D1 SQL Database

The settings automatically use the test-db test database for non-main deployments, and the prod-db production database for the main branch deployments.

Database SQL files are run under the `migrations` folder, using a GitHub Actions workflow. The SQL files are run in order of their starting numbers (i.e. 001, 002, etc.), with previously run files not running even if changes are made. Changes must be made with new file number names.

Under functions/api, there are also helper functions in helpers.js to make it easier to create CRUD endpoints for tables. 

For adding a new table, add the schema to the migrations folder, following the sequential order discussed above. Next, add the API endpoints. Lastly, interact with those API endpoints in the component.

## GitHub Actions (Workflows)

Workflows must succeed in order to merge a PR into the main branch. The workflows enabled for the project are detailed below. For workflows to run, their YAML files must be added under the `.github/workflows/` folder.

### Linter

The `.github/workflows/lint.yml` workflow runs ESLint, which is a JavaScript and TypeScript linter, and will fail upon any linting errors.

### Tests

The `.github/workflows/tests.yml` workflow runs component and integration tests. All tests must pass or the workflow will fail. Additionally, all components must have at least 75% coverage through Vitest component tests or the workflow will fail. Tests are run on every push and PR, so you can see the results of each test, including coverage reports.

### D1 Migrations

The `.github/workflows/d1-migrations.yml` workflow runs the SQL files in the `task-manager/migrations/` folder sequentially. It only applies files that have not previously been applied (it does not check for changes), so to make a change, add it as a new SQL file with the filename starting with number greater than the current greatest number.

If it is a test branch (non main branch), a job runs the migrations on the test database, using GitHub secrets for the CloudFlare test database API token and CloudFlare account ID. If it is a main branch, a job runs the migrations on the prod database, using GitHub secrets for the CloudFlare prod database API token and the CloudFlare account ID.

For adding a new table, you'll need to add the schema to the migrations folder.
Then you'll want to add the API endpoints. Lastly, you'll want to interact with
those API endpoints in the component.

## Testing Changes Locally

### Local Authentication Setup

The app uses Google OAuth for authentication. To run locally, you need a `.dev.vars` file in the `task-manager/` directory with the required secrets.

1. Copy the example file to .dev.vars:

    ```cp .dev.vars.example .dev.vars```

2. Fill in the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` with the values that the person who created the OAuth Client in Google should have saved

3. The other values in the example file can be used as-is for local development.

For deployed environments, these values are set as Cloudflare Pages secrets.

### Building the Webapp Locally

To run a local copy of the DB and test your changes on a local host:

1. Navigate to `task-manager` directory. (Directory with `package.json`)

    ``` cd task-manager ```

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

### Local Initial Admin Setup

1. Apply migrations and seed baseline data:
	- `npm run cf:migrate:local`
	- `npm run cf:seed:local`
2. Copy `seed/admins.example.sql` to `seed/admins.local.sql` and replace emails and display names.
3. Apply admin users to local D1:
	- `npx wrangler d1 execute test-db --local --file=seed/admins.local.sql`
4. Start dev server:
	- `npm run dev`

### Reseeding the DB

To set DB back to only what is in the seed:

1. Navigate to `.wrangler/state/v3/d1/miniflare-D1DatabaseObject`

2. Delete the .sqlite file

3. Re-run local migration
    ``` npm run predev ```

## Auth and Admin Setup

This app uses Google OAuth, but access is allowlist-based: a user must already exist in the `Users` table and be active (`is_active = 1`) to complete login.

For adding the initial admins, someone with write access rights to the Cloudflare D1 database must follow these steps. Once there is an admin, that admin can add additional users and other admins.

### Initial Admin Setup for Test Database

1. Make sure test DB migrations are applied:
	- `npm run cf:migrate:test`
2. Optionally seed baseline test data:
	- `npm run cf:seed:test`
3. Copy `seed/admins.example.sql` to `seed/admins.test.sql` and replace emails and display names.
4. Apply admin users to remote test D1:
	- `npx wrangler d1 execute test-db --file=seed/admins.test.sql --remote`

### Initial Admin Setup for Production Database

1. Apply production migrations:
	- `npm run cf:migrate:prod`
2. Copy `seed/admins.example.sql` to `seed/admins.prod.sql` and replace emails and display names.
3. Apply admin users to production D1:
	- `npx wrangler d1 execute prod-db --env production --file=seed/admins.prod.sql --remote`

Use caution when applying production admin seed files. Keep production admin SQL files private, reviewed, and out of source control.

### Managing Users after Initial Admin Is Created

- Admins can add users from the User Management page.
- Admins can update user roles and active/inactive status.
- Deactivated users can no longer authenticate with existing or new sessions.

# Thank You

Thank you to everyone in Team Teal for contributing to the project and for our Professor for your support!
