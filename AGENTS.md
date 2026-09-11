# AGENTS

## Product

Elite Central Vacuum is a combined commerce and professional service platform for central vacuum products, repair, maintenance, installation, troubleshooting, and customer account management.

## Engineering

- Preserve existing behavior unless a verified defect requires change.
- Use strict TypeScript.
- Avoid unnecessary `any`.
- Avoid duplicated business logic.
- Prefer clear code over clever abstractions.
- Validate external data at boundaries.
- Do not execute unknown remote code.
- Do not expose secrets.

## Architecture

- Next.js App Router application with route groups for the public storefront, customer dashboard, technician portal, and admin portal.
- Redux Toolkit Query is the API integration layer under `redux/api/`; keep API contracts typed and validate external data at boundaries.
- Shared UI primitives live under `components/ui/`; customer dashboard list patterns live under `components/customer-portal/PortalUI.tsx`.
- Service work flows through service requests, quotations, schedules, invoices, and service orders; do not merge this with product order flows.

## Package Manager

- Use npm. The lockfile is `package-lock.json`.

## Frontend

- Preserve the Elite teal/white brand direction.
- Prefer semantic design tokens over repeated hardcoded values.
- Use shadcn-style primitives selectively, not blindly.
- Avoid generic AI-template aesthetics.
- Keep client boundaries small when practical.
- Use semantic HTML.
- Implement complete states: loading, empty, error, disabled, success.
- Use purposeful animation only.
- Respect reduced motion.
- Accessibility is a default requirement.

## Multi-Agent Skill Routing

- Use `task-observer` for substantive multi-step sessions to capture durable workflow observations; shared observer workspace: `C:\Users\zzaye\.agent-skill-observations`.
- Use `ui-ux-pro-max` for significant frontend architecture, product-wide design direction, UI/UX review, accessibility strategy, layout systems, typography, color, and interaction decisions.
- Use `design-taste-frontend` for frontend implementation, visual polishing, and making shipped UI feel less generic while preserving this app's brand direction.
- Do not use frontend-design skills for backend, database, API, infrastructure, or non-visual debugging work.
- Keep specific Awesome Design Skills project-local and add them only when the application's chosen visual language requires them.
- Use progressive disclosure: load only the skill body and references relevant to the active task.

## Data / Backend

- Treat the current app as primarily mock-driven UI.
- Do not invent backend behavior inside page components.
- Define typed contracts before wiring API calls.
- Separate UI state from future resource state.

## Git

- Inspect `git status` first.
- Do not overwrite unrelated local work.
- Keep changes focused.
- Avoid destructive mass refactors without a verified reason.

## Verification

Use the repo's actual scripts:

- `npm run lint`
- `npm run build`
- `npm run dev`

Current testing status:

- no automated test script is defined in `package.json`

## Deployment

- No deployment adapter is configured in this repository. Treat `npm run build` as the production build verification step until a deployment target is documented.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Use Graphify automatically for architecture questions, dependency tracing, cross-module features, impact analysis, unfamiliar code areas, major refactoring, and relationship mapping across frontend/backend/database code.
- Do not require Graphify for trivial isolated edits.
- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure.
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files.
- After modifying code files in this session, run `py -3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current.
