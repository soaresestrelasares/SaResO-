# Auth And Permissions Plan

This starter does not install authentication by default. Add it only after the
product needs named users, private data, team membership, or billing-sensitive
actions.

Recommended stack:

- Better Auth for authentication and sessions
- Better Auth Drizzle adapter with `provider: "mysql"`
- Better Auth organization plugin when the app needs workspaces, teams, roles,
  invitations, or member management
- Server-side authorization checks in Express middleware before route handlers

## Suggested Files

```text
server/auth/
  auth.ts              # Better Auth server config
  client.ts            # Browser auth client wrapper
  permissions.ts       # Role and permission definitions
  require-user.ts      # Express middleware for session lookup
  require-permission.ts # Express middleware for route-level authorization
server/routes/auth.ts  # Mount Better Auth handler under /api/auth/*
```

## Integration Outline

1. Install runtime dependencies after the product decision:

   ```bash
   pnpm add better-auth @better-auth/drizzle-adapter
   ```

2. Configure Better Auth with the existing Drizzle connection from `server/db.ts`.
   Use the MySQL provider for the Drizzle adapter.

3. Generate the Better Auth schema with its CLI, incorporate the reviewed table
   definitions into the project Drizzle schema, then run `pnpm db:generate` and
   review the migration before applying it with `pnpm db:migrate`.

4. Mount Better Auth under `/api/auth/*` and keep all session cookie handling on
   the server.

5. Add route guards that derive `userId`, `organizationId`, role, and permission
   scope from the session. Do not accept those values from request bodies.

6. Keep business tables owned by the app schema. Reference Better Auth users or
   organizations by id when needed.

## Permission Model

Start with resource-action permissions instead of broad role checks:

```ts
const permissions = {
  resource: ["create", "read", "update", "delete"],
  member: ["invite", "read", "remove"],
  billing: ["read", "manage"],
} as const;
```

Roles should be thin bundles over permissions:

```text
owner  -> all permissions
admin  -> resource.*, member.*
member -> resource.create/read/update
viewer -> resource.read
```

Document the product's route-to-permission mapping when protected routes are
introduced. Route handlers should receive an already-authorized context.

## Data Scoping Rules

- Every user-owned business table should include an owner column such as
  `user_id`, `organization_id`, or both.
- Never trust a client-supplied owner id for access control.
- Read scope from the session and active organization.
- Add compound indexes for common scoped queries, for example
  `(organization_id, created_at)` or `(user_id, created_at)`.
- Return 403 for authenticated users without permission, and 401 for requests
  without a valid session.

## Agent Notes

- Update `docs/openapi.yaml` before or alongside protected route changes.
- Replace this document's example permissions with product-specific resources.
- Add auth only if the product requires it; otherwise keep public demo flows
  simple.
- Keep auth tables and business tables conceptually separate in the Drizzle
  schema so agents can reason about ownership and migrations independently.
