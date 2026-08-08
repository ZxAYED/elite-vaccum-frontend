# Security Audit

Date: 2026-08-07

## Summary

- No remote-code-execution block is present in the current `next.config.ts`.
- No committed Git history for `lib/utils.ts` or `next.config.ts` contains the reported `AUTH_API_KEY` -> Base64 decode -> remote fetch -> `eval()` pattern.
- Repository-wide source search found no uses of `AUTH_API_KEY`, `node-fetch`, `eval(`, `new Function`, `child_process`, `exec(`, `spawn(`, `preinstall`, `postinstall`, or `prepare` outside normal lockfile metadata.
- `.env` exists but is empty.

## Verified Findings

### `next.config.ts`

- Current file contains only a normal `images.remotePatterns` entry for `primetechsupport.com`.
- `git log -p -- next.config.ts` shows only:
  - initial Next.js scaffold on 2026-02-17
  - a later image host addition on 2026-02-17

### `lib/utils.ts`

- The working tree had deleted `lib/utils.ts`, but `git log -p -- lib/utils.ts` shows the file was originally added as a standard `cn()` helper only.
- `components/ui/Button.tsx` imports `@/lib/utils`, so the deletion broke the build.
- I restored a safe minimal `lib/utils.ts`:
  - `clsx`
  - `tailwind-merge`
  - `cn(...inputs)`

### Package / config review

- `package.json` scripts are limited to `dev`, `build`, `start`, and `lint`.
- No custom install hooks are defined in `package.json`.
- Search hits for `napi-postinstall` appear only in `package-lock.json` as transitive dependency metadata, not as repository code.

## Git History Notes

- `lib/utils.ts` first appears in commit `b13afc4` (`update home page`) on 2026-02-17 as a normal helper.
- `next.config.ts` image configuration was also added in commit `b13afc4`.
- Both files were touched together in that commit, but only for ordinary frontend setup.
- No verified malicious commit was found in the local Git history available in this clone.

## Remaining Risk

- The repository was already dirty before this audit. Pre-existing local changes include `.env`, `.gitignore`, `next.config.ts`, `postcss.config.mjs`, deletion of `branch_structure.json`, and untracked `frotned.zip`.
- Because the reported malicious block is not present in committed history, the most likely explanation is that it existed in an uncommitted local state or an earlier copy outside this clone.

## Recommendation

- Treat any previously used `AUTH_API_KEY` value as untrusted and do not reuse it.
- Keep `lib/utils.ts` limited to local utility helpers.
- Keep `next.config.ts` limited to framework configuration only.
- Review the provenance of `frotned.zip` before using it.
