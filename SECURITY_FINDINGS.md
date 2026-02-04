# Security Findings – Recent Work (Skip Setup & Related)

## Summary

Review of the “skip setup” and related changes found several issues that could weaken security in development or production. Findings and fixes are below.

## Critical / High

### 1. Unauthenticated `POST /api/v1/settings/initialize`

- **Issue**: Any client can call this and set `initialized = true` with no auth.
- **Impact**: Can force the app into “post-setup” mode (everyone must log in). On a fresh install, an attacker could call it before the real admin finishes setup. Does not grant admin by itself, but changes app behavior.
- **Fix**: Add a strict rate limit (e.g. 10/hour per IP) so it can still be used from the setup UI but is harder to abuse. Kept unauthenticated so “Skip setup” works from the setup page.

### 2. Unauthenticated `GET /api/v1/settings/main` leaks API key when `!initialized`

- **Issue**: When the app is not initialized, all `/settings/*` routes are reachable without auth. `GET /settings/main` returns full `settings.main` including `apiKey` when `!req.user`.
- **Impact**: Anyone who can hit the API while the app is not initialized (e.g. same network, fresh install) can read the main API key.
- **Fix**: When the request is unauthenticated (`!req.user`), respond with `omit(settings.main, 'apiKey')` so the key is never returned to unauthenticated callers.

### 3. `?skipSetup=true` and `NEXT_PUBLIC_SKIP_SETUP` bypass login redirect

- **Issue**:
  - `?skipSetup=true` is honored in `_app.tsx` and in `UserContext`, so anyone can skip the “redirect to login” logic.
  - `NEXT_PUBLIC_SKIP_SETUP=true` does the same on the client.
- **Impact**: In production, users could browse without being forced to log in, see broken or partial UI and errors, and get a weaker “must log in” guarantee.
- **Fix**: Only allow these bypasses when **not** in production: e.g. `NODE_ENV !== 'production'` or an explicit “dev mode” flag. In production, ignore the query param and the public env var.

## Medium / Low

### 4. No rate limit on `POST /settings/initialize`

- **Issue**: Initialize can be called indefinitely.
- **Impact**: Abuse (e.g. forcing “initialized” on/off) or small DoS if the handler were heavier.
- **Fix**: Rate limit this route (see #1).

### 5. Sensitive data in browser console

- **Issue**: `console.error('Failed to initialize settings', e)` in the Setup component can log full errors to the browser console.
- **Impact**: Stack traces or internal details may be visible to the user (or an attacker with access to the console).
- **Recommendation**: In production, avoid logging full errors to the client; use a generic message and log details only server-side.

### 6. `POST /settings/main` accepts arbitrary `req.body` when `!initialized`

- **Issue**: When the app is not initialized, `POST /settings/main` merges `req.body` into `settings.main` with no allowlist.
- **Impact**: Attacker could set `apiKey`, `applicationUrl`, Redis config, etc., if they can reach the API before initialization.
- **Context**: This is the existing “setup mode” design; the main reduction of risk comes from not leaking the current apiKey (see #2) and from locking down who can trigger or stay in “not initialized” (see #1 and #3).
- **Recommendation**: Longer-term, consider an allowlist of keys that can be set during setup and/or a dedicated “setup” schema for this endpoint.

## Implemented Fixes (in code)

1. **Initialize rate limit**: `POST /settings/initialize` is rate-limited (e.g. 10 requests per hour per IP).
2. **No apiKey when unauthenticated**: `GET /settings/main` uses `omit(settings.main, 'apiKey')` when `!req.user`.
3. **Bypass only in non-production**:
   - Server: `skipSetup` is true only if `SKIP_SETUP === 'true'` or (`NODE_ENV !== 'production'` and `ctx.query.skipSetup === 'true'`).
   - Client: Skip-login bypass uses `NEXT_PUBLIC_SKIP_SETUP === 'true'` or the same non-production + `?skipSetup=true` rule.

## Operational Recommendations

- **Production**: Do not set `SKIP_SETUP` or `NEXT_PUBLIC_SKIP_SETUP`. Rely on “Skip setup” only from the setup UI, and do not use the query-parameter bypass.
- **Staging/Dev**: Use `SKIP_SETUP` / `NEXT_PUBLIC_SKIP_SETUP` or `?skipSetup=true` only when `NODE_ENV !== 'production'` (or equivalent).
- **Setup**: Complete setup or use “Skip setup” from the official setup page so that initialization happens in a controlled, rate-limited way.
