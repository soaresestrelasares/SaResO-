# Disposable Examples

These files show the repository's preferred fullstack patterns without adding a
placeholder product to the running application.

They are not imported or compiled into the application and server builds.

Agent workflow:

1. Read only the examples relevant to the first real product workflow.
2. Recreate the pattern with product-specific names in `src/`, `server/`, and
   `docs/`. Do not import from `examples/`.
3. Generate and review a Drizzle migration if the workflow needs persistence.
4. Delete the entire `examples/` directory before finishing the first real
   product workflow.

The examples are intentionally small and incomplete. Real implementations must
still include authorization, validation, error states, API contracts, and tests
appropriate to the product.
