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

Use the repo’s actual scripts:

- `npm run lint`
- `npm run build`
- `npm run dev`

Current testing status:

- no automated test script is defined in `package.json`
