# Contributing

PlacementPilot AI accepts focused contributions across the FastAPI backend, AI workflows, and frontend.

## Setup
- Backend: create a virtual environment, install `backend/requirements.txt`, and configure environment variables locally.
- Frontend: `cd frontend && npm ci && npm run build`.
- Do not commit API keys or student/private data.

## Contribution guidance
For AI workflow changes, keep deterministic validation around tool inputs/outputs and document fallback behavior. For API changes, validate request schemas, authorization, error responses, and database side effects.

## Pull request checklist
- [ ] Change is scoped and reproducible.
- [ ] Failure and fallback paths were considered.
- [ ] Sensitive data is not logged.
- [ ] Tests/build checks pass.
- [ ] README/docs are updated when the public contract changes.
