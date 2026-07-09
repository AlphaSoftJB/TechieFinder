# TechieFinder Web

React 19 + Vite + TypeScript + Tailwind CSS 4 admin/customer web app for TechieFinder.

## Development

```bash
npm install
npm run dev
```

Runs on http://localhost:3000. The dev server proxies `/api` to
`http://localhost:8080` (see `vite.config.ts`), so make sure the backend
(`../backend`) is running on 8080 first — no extra configuration needed.

## Build

```bash
npm run build
```

Type-checks with `tsc -b` and produces a static build in `dist/`.

## Configuration

Set `VITE_API_URL` at build time (see `.env.example`) to point a deployed
build at a backend host other than the relative `/api` default — useful when
the frontend and backend aren't served from behind the same reverse proxy.

## What's here

- `src/contexts/AuthContext.tsx` — JWT session stored in `localStorage`,
  mirrors the mobile app's `AuthContext`
- `src/lib/api.ts` — axios client with a bearer-token interceptor and a
  401 handler that logs the user out
- `src/pages/` — Home, Login, Register, Search (category + geo-radius),
  TechnicianProfile (booking form), Dashboard (role-routed to
  UserDashboard or TechnicianDashboard), Conversation (messaging)

## Docker

`Dockerfile` builds the static site with Node and serves it with nginx,
which also proxies `/api/*` to a `backend` host on the same Docker network
(see `nginx.conf` and the repo root's `docker-compose.yml`).
