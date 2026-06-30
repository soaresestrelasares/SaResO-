# Agent Guide

This repository is a minimal fullstack starter. Keep changes focused, portable,
and free of placeholder product assumptions.

## Starter Shape

- The running application intentionally has no demo business domain.
- `server/schema.ts` intentionally starts without product tables.
- `docs/openapi.yaml` documents only the infrastructure health endpoint.
- `examples/` contains disposable reference code. It is never runtime code.

## First 10 Minutes

For a new project or unfamiliar workspace:

1. Run `pnpm install`.
2. Run `pnpm run init:git` if the project has no Git history.
3. Run `pnpm dev`, wait for `[fullstack-starter] API ready on :PORT`, and
   verify `GET /api/health` directly with `curl` or equivalent.
4. Run `pnpm build`. Do not use browser tools to confirm the rendered starter
   page unless browser verification is explicitly approved under the policy
   below.
5. Read `src/routes/index.tsx`, `server/app.ts`, and only the examples relevant
   to the requested workflow.
6. Before coding, write down the first user-visible outcome and decide whether
   it actually needs server data, persistence, authentication, or an external
   service.

Default to the least infrastructure that completes the requested workflow. Ask
the user only about decisions that materially change product scope; otherwise,
follow the existing patterns and keep moving.

A request to build the first product workflow is permission to replace the
starter page, add the required real layers, and delete `examples/`. Do not keep
starter UI or example code for compatibility.

## Stack

- Vite, React, and TypeScript
- Tailwind CSS
- TanStack Router with file-based routes
- TanStack Query for server-state fetching, caching, and mutations
- shadcn/ui components built on Radix UI
- Express API server running on Node.js
- Drizzle ORM over `mysql2`
- Drizzle Kit for versioned database migrations
- MySQL-compatible database through `process.env.DATABASE_URL`
- pnpm

## Project Conventions

- Put route-level pages in `src/routes/`.
- Put reusable application components in `src/components/`.
- Treat `src/components/ui/` as editable shadcn/ui primitives. Prefer composing
  these components before adding another UI library.
- Put shared hooks in `src/hooks/` and general utilities in `src/lib/`.
- When the product needs browser API helpers, create `src/lib/api.ts` and keep
  response types in `src/lib/api-types.ts`.
- Use TanStack Query for server state. Keep query keys close to the feature that
  owns them unless they are shared across routes.
- Put server-only API and database code in `server/`.
- Put Express route handlers in `server/routes/`.
- Create `server/validation.ts` when request schemas need to be shared.
- Put shared Express middleware in `server/middleware/`.
- Put Drizzle table definitions in `server/schema.ts`.
- Use the `@/` alias for imports from `src/`.
- Keep global styles and design tokens in `src/styles.css`.
- Do not edit `src/routeTree.gen.ts`; TanStack Router generates it.
- Never import server files from `src/`.
- Never expose database credentials or `DATABASE_URL` to browser code.
- Do not assume a fixed development API port. `pnpm dev` coordinates the port
  used by Express and the Vite proxy; use its startup banner when calling the
  API directly.

## 0-1 Development Workflow

Build the first real feature as one thin vertical slice instead of creating
every possible layer up front:

1. Define one concrete happy path that a user can complete end to end.
2. Decide the minimum layers required using the guide below.
3. If the feature has an API, define its request, response, validation, and
   failure behavior before wiring the UI.
4. If the feature needs persistence, define product tables in
   `server/schema.ts`, generate, review, and apply the migration, then implement
   server-side queries.
5. Implement and register the Express route in `server/app.ts`.
6. Add frontend response types, API helpers, and TanStack Query ownership only
   when the UI consumes server state.
7. Build the route-level UI with loading, empty, error, and success states that
   are appropriate for the workflow.
8. Verify the API directly with `curl` or equivalent before debugging it
   through the UI. Follow the browser verification policy below before using
   browser automation.
9. Update the OpenAPI contract and any workflow documentation.
10. Remove disposable examples, temporary scaffolding, unused dependencies, and
    abandoned code before finishing.

Do not build a generic platform before the first workflow works. Prefer a small
complete path over broad incomplete architecture.

## Layer Decision Guide

| Product need                         | Minimum implementation surface                                       |
| ------------------------------------ | -------------------------------------------------------------------- |
| Static page or local interaction     | `src/routes/` and reusable `src/components/` as needed               |
| Server behavior without persistence  | Validation, `server/routes/`, `server/app.ts`, OpenAPI, client layer |
| Persistent product data              | Above plus `server/schema.ts`, `server/db.ts`, generated migration   |
| Users, private data, teams, or roles | Explicit auth decision, then follow `docs/auth-and-permissions.md`   |
| External service or background work  | Explicit user decision before adding dependencies or infrastructure  |

Skip every layer that the requested workflow does not need.

## Disposable Examples

Before implementing the first real product workflow:

1. Read only the relevant files under `examples/` to understand local patterns.
2. Recreate the pattern in the real `src/`, `server/`, and `docs/` locations
   using product-specific names and contracts.
3. Add validation, authorization, error handling, and tests required by the
   actual workflow.
4. Delete the entire `examples/` directory before finishing the first product
   workflow.

Never import from `examples/`, ship example endpoints or tables, or preserve
example names in product code.

## Git Workflow

- Generated projects should have a baseline commit before product work begins.
  Run `pnpm run init:git` if the project has no git history yet.
- The baseline script no-ops inside an existing parent repository, initializes a
  root repo otherwise, and commits `chore: create project from starter`.
- After completing a 0-1 implementation or another cohesive requested change,
  run the relevant checks and create a scoped commit.
- Do not commit secrets, `.env*`, `node_modules`, `dist`, local caches, or
  generated build artifacts.

## Routing And Deployment

- Keep hash history unless the deployment target is known to support SPA rewrite
  rules.
- TanStack Router auto code splitting is enabled. Preserve a visible initial and
  route-level loading state; the starter marks it with `data-app-loading`.
- Keep Vite's `base: "./"` setting so production assets work when the site is
  served from either a domain root or a subdirectory.
- The production build serves `dist/client` through the Express server compiled
  to `dist/server`.
- Keep `/api/*` routes ahead of the SPA fallback so unknown API routes return
  JSON 404 responses instead of frontend HTML.
- The included `Dockerfile` is the production container path. Keep
  `docs/deployment.md` aligned when changing build output, runtime ports, or
  required server-side environment variables.

## Database

Do not add a database table until the product needs persistence. The platform
injects `DATABASE_URL` for server-side commands and app runtime when the cloud
database is ready.

- Treat `server/schema.ts` as the only schema source of truth.
- For schema changes, edit `server/schema.ts`, run `pnpm db:generate`, review
  the generated SQL, and commit the migration under `drizzle/`.
- Apply committed migrations with `pnpm db:migrate` after the platform injects
  `DATABASE_URL`.
- Use `pnpm db:push` only for disposable prototype databases where migration
  history is not required.
- Use `execute_sql` only for inspection or explicitly requested one-off
  operations. Do not hand-write schema changes when Drizzle Kit supports them.
- Use normal app server code for runtime CRUD. Do not call `execute_sql` from
  app code.
- Use Drizzle ORM for app runtime queries. `mysql2` is the driver underneath
  Drizzle.
- Do not hardcode database hosts, users, passwords, or connection strings in
  source files, config files, docs, or `.env` files.
- Do not ask the user for database credentials when the platform database is the
  intended target.

## API Contracts

`docs/openapi.yaml` starts with the infrastructure health endpoint only. When
adding a product API, update the OpenAPI contract, frontend API helpers, response
types, Express routes, validation, and any non-trivial API flow notes together.

## Authentication And Authorization

Do not add authentication until the product needs users, private data, teams, or
role-gated operations. When it is needed, prefer the plan in
`docs/auth-and-permissions.md`.

Keep auth tables and business tables conceptually separate so future agents can
reason about ownership and migrations.

## Scope

- Do not add authentication, analytics, payments, email, webhooks, scheduled
  work, or external services without an explicit user decision.
- Avoid adding dependencies when the existing stack or browser APIs are
  sufficient.
- Preserve responsive behavior and keyboard accessibility when changing UI.

## Browser Verification

Browser automation is opt-in because it is slower and consumes additional
credits.

- Do not automatically use browser tools, Playwright, screenshots, or UI
  automation, including after UI changes.
- Default to code inspection, type checks, lint, builds, direct API checks, and
  focused non-browser tests.
- If browser verification is materially necessary, explain what it would
  validate and ask the user for approval before running it.
- An explicit browser-verification request in the current user prompt counts as
  approval.
- After approval, do not judge the initial `browser_open` snapshot. First route
  chunks may finish after DOM ready; wait up to 5 seconds for
  `[data-app-loading]` to disappear, then capture or inspect the rendered page.
- If `[data-app-loading]` remains after the wait, inspect the console and network
  before clearing caches, restarting services, or changing routing code.
- If approval is not requested or granted, finish with the available checks and
  state that browser verification was not run.

## Commands

```bash
pnpm install
pnpm run init:git
pnpm dev
pnpm typecheck
pnpm lint
pnpm exec prettier --check .
pnpm build
pnpm start
pnpm preview
pnpm db:generate
pnpm db:migrate
pnpm db:push
docker build -t fullstack-starter .
```

## Before Finishing

For most code changes, run:

```bash
pnpm typecheck
pnpm lint
pnpm exec prettier --check .
pnpm build
```

A 0-1 implementation is complete only when:

- The requested user path works end to end with product-specific names and
  behavior.
- Required loading, empty, error, and success states are handled.
- Product APIs are validated, directly tested, and reflected in
  `docs/openapi.yaml`.
- Required schema changes have a reviewed, committed migration.
- No unnecessary auth, database, external service, dependency, or abstraction
  was added.
- The first real product workflow removed the entire `examples/` directory.
- Relevant documentation is current and the Git diff contains no generated
  build output or secrets.

For UI changes, inspect responsive behavior and accessibility in code. Browser
verification at desktop or mobile widths requires user approval under the
browser verification policy above. If the change affects routing or deployment,
verify the production build from a subdirectory path and the Docker image
runtime.
