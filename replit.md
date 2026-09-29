# Crop Advisor

Crop Advisor turns soil and weather readings plus plant photos into practical, saved crop and disease guidance.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required secret: `GEMINI_API_KEY` — Gemini API access for recommendations and disease scans
- App Storage env vars are provisioned automatically for persisted leaf images

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/crop-advisor/src/App.tsx` — responsive product UI and route-level flows
- `artifacts/crop-advisor/src/index.css` — field-book visual system and responsive styling
- `artifacts/api-server/src/routes/` — advisory, scanner, dashboard, export, and object-serving APIs
- `artifacts/api-server/src/lib/gemini.ts` — structured Gemini recommendation and diagnosis calls
- `lib/api-spec/openapi.yaml` — source of truth for generated API hooks and validation schemas
- `lib/db/src/schema/` — PostgreSQL tables for device users, advisories, and scans

## Architecture decisions

- Device-scoped history keeps the first version useful without requiring account onboarding.
- The frontend uses generated OpenAPI hooks for every persisted flow; no core action is client-only.
- Leaf photos are written to App Storage, while diagnosis JSON and the storage path remain in PostgreSQL.
- Gemini responses are requested as JSON and validated against generated response schemas before returning to the client.
- The API retries transient Gemini 429/503 responses and falls back to the current flash model.

## Product

- Landing page with clear paths into crop advisory, disease scanning, and field history.
- Crop advisory form for N/P/K, pH, temperature, humidity, rainfall, region, soil type, and crop category.
- Leaf photo scanner with drag-and-drop, previews, AI diagnosis, treatment, and prevention guidance.
- Dashboard with saved counts, latest notes, activity history, and printable advisory export.

## User preferences

No additional preferences recorded.

## Gotchas

- Run API and web services through their managed workflows so `PORT` and `BASE_PATH` are present.
- Run API codegen after changing `lib/api-spec/openapi.yaml`.
- Frontend build scripts require workflow-provided `PORT`; use the artifact workflow for runtime verification.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
