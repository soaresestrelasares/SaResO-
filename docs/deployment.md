# Deployment

This template ships with a production Dockerfile for the combined Vite client
and Express API server.

## Build Locally

```bash
docker build -t fullstack-starter .
docker run --rm -p 3000:3000 fullstack-starter
```

Open `http://127.0.0.1:3000`.

The container serves:

- the Vite production build from `dist/client`
- the Express API under `/api/*`
- browser-route fallback for React pages

Unknown API routes return JSON 404 responses instead of the frontend HTML
fallback.

## Runtime Environment

```text
PORT=3000
NODE_ENV=production
```

`DATABASE_URL` is optional until the product needs persistence. When used, it is
server-only: do not bake it into the image or expose it to the browser build.
Pass it as a runtime secret or environment variable from the deployment
platform.

If a release includes committed database migrations, apply them before starting
the release:

```bash
pnpm db:migrate
```

Run migrations from a checkout with development dependencies installed. The
production runtime image intentionally contains only the compiled application
and production dependencies; it does not run schema changes during startup.

In Verdent cloud, run `pnpm db:migrate` as a server-side command only after the
product has migrations and the database is ready. The platform injects
`DATABASE_URL`.

## Dev Publish

In the builtin templates repository, pushes to `main` publish to the dev CDN
prefix through `.github/workflows/build-and-publish.yml`:

```text
S3_PREFIX=dev-builtin-templates
CDN_BASE_URL=https://cdn.verdent.ai/dev-builtin-templates
```

Production publish is a manual workflow dispatch on `main` with explicit
confirmation.
