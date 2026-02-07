# Security Vulnerability Remediation – GitHub Dependabot & CodeQL Alerts

This document addresses security vulnerabilities identified in the project:

- **Dependencies:** Dependabot alerts (from `yarn.lock`)
- **Code:** CodeQL static analysis findings

**Deferred packages:** See [Deferred / Accepted Exceptions](#deferred--accepted-exceptions) for dependencies that cannot be updated yet and why.

---

## CodeQL Findings (Static Analysis)

| ID    | Issue                                           | Severity | Location                                                                   | Status / Notes                                                                                                                        |
| ----- | ----------------------------------------------- | -------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 14–19 | Server-side request forgery (SSRF)              | Critical | externalapi.ts, imageproxy.ts, discord.ts, lunasea.ts, gotify.ts, slack.ts | Uses `isSafeUrl()`; CodeQL may flag URL construction. See [SSRF section](#ssrf-findings) below.                                       |
| 12–13 | DOM text reinterpreted as HTML                  | High     | SettingsTabs/index.tsx:89, 92                                              | `route.text`/`route.content` from props; `e.target.value` for navigation. React escapes by default. See [XSS section](#xss-findings). |
| 10–11 | Password hash insufficient computational effort | High     | auth.ts:32, apiKeys.ts:63                                                  | SHA-256 used for API key hashing. See [Hash section](#hash-findings).                                                                 |
| 9     | Incomplete URL substring sanitization           | High     | music.ts:26                                                                | MusicBrainz `relation.url?.resource` filtered by `includes()`/regex. See [URL section](#url-findings).                                |
| 8     | Workflow missing permissions                    | Medium   | release.yml:101                                                            | Workflow runs with default permissions. See [Workflow section](#workflow-findings).                                                   |

### SSRF Findings (#14–19)

**Context:** All affected code uses `isSafeUrl()` from `@server/utils/validation` before making requests. The function blocks:

- Non-http/https protocols
- localhost, 127.x, ::1, 0.0.0.0
- Private IP ranges (10.x, 172.16–31.x, 192.168.x, 169.254.x)

**CodeQL concern:** Flow from user/config input → URL construction → request. In practice:

- **Notification agents:** URLs come from admin-configured webhook/instance URLs.
- **externalapi.ts:** `endpoint` combined with `baseUrl`; both from config.
- **imageproxy.ts:** `path` from request; validated against `isSafeUrl(fullUrl)`.

**Recommendation:** Keep `isSafeUrl()`; consider strengthening with:

- DNS rebinding checks
- Blocking of cloud metadata IPs (169.254.169.254, etc.)
- Optional allowlist for imageproxy

### XSS Findings (#12–13)

**Context:** `SettingsTabs` uses `route.text` and `route.content` (from `settingsRoutes` prop) and `e.target.value` in `router.push()`.

**Risk:** `route.text`/`route.content` are from parent components; `e.target.value` is from the select’s options (values = `route.route`). React escapes `{children}` as text, not HTML.

**Recommendation:** Likely low risk if `settingsRoutes` is from trusted config. If any route data can be user-controlled, ensure it is sanitized before use.

### Hash Findings (#10–11)

**Context:**

- **apiKeys.ts:63** – SHA-256 for API key storage (lookup hash).
- **auth.ts:32** – SHA-256 for API key validation.

**CodeQL concern:** SHA-256 is fast; not suitable for user-chosen passwords. For random API keys, SHA-256 is often used for performance (per-request lookups).

**Recommendation:** For API keys, SHA-256 is a common choice. If higher assurance is needed, consider bcrypt/PBKDF2 for new keys (with migration path). User passwords must use bcrypt/argon2 (already handled elsewhere).

### URL Findings (#9)

**Context:** `music.ts` uses `relation.url?.resource` from MusicBrainz. Filtering uses `includes('upload.wikimedia.org')` and a regex for file extensions.

**CodeQL concern:** Substring checks can be bypassed (e.g. `evil.com/upload.wikimedia.org`).

**Recommendation:** Validate full URL with `isSafeUrl()` or parse and check hostname before use.

### Workflow Findings (#1–8)

**Context:** All `.github/workflows/*.yml` files lack explicit `permissions:` blocks. CodeQL flags this as a supply-chain risk (workflows run with default broad permissions).

**Affected files:** ci.yml (lines 13, 32, 69), release.yml (lines 10, 101), cypress.yml (13), support.yml (9), preview.yml (10)

**Fix:** Add least-privilege `permissions:` to each workflow. See [Workflow permissions](#workflow-permissions-fix) below.

---

## Summary

| #   | Package                                           | Severity       | Status      | Action                                             |
| --- | ------------------------------------------------- | -------------- | ----------- | -------------------------------------------------- |
| 1   | ip                                                | High           | ⚠️ No patch | Resolution → socks 2.7.3+                          |
| 2   | tough-cookie                                      | Moderate       | ⚠️ Complex  | Requires 4.1.3+; depends on upstream               |
| 3   | lodash.pick                                       | High (Dev)     | ⚠️ No patch | Dev-only; babel-plugin-react-intl-auto             |
| 4   | qs                                                | High           | ✅ Fixed    | Resolution → 6.14.1                                |
| 5   | tar                                               | High           | ⚠️ Partial  | Resolution → 6.2.2; 7.5.3 for full fix             |
| 6   | multer                                            | High           | ⚠️ Blocked  | express-openapi-validator needs 2.x support        |
| 7   | tar (hardlink)                                    | High           | Same as #5  |                                                    |
| 8   | tar (symlink)                                     | High           | Same as #5  |                                                    |
| 9   | semver                                            | High           | ✅ Fixed    | Upgrade to 7.5.2+                                  |
| 10  | cross-spawn                                       | High           | ✅ Fixed    | Resolution → 7.0.5                                 |
| 11  | path-to-regexp                                    | High           | ✅ Fixed    | Resolution → 6.3.0                                 |
| 12  | multer (memory)                                   | High           | Same as #6  |                                                    |
| 13  | multer (crafted)                                  | High           | Same as #6  |                                                    |
| 14  | multer (malformed)                                | High           | Same as #6  |                                                    |
| 15  | lodash (_.unset/_.omit)                           | Moderate (Dev) | ⚠️ Check    | Direct dep 4.17.23 (patched); may be transitive    |
| 16  | tar (folder count DoS)                            | Moderate       | Same as #5  |                                                    |
| 17  | @cypress/request SSRF                             | Moderate (Dev) | ⚠️ Deferred | Dev-only; Cypress E2E tests                        |
| 18  | request SSRF                                      | Moderate       | ⚠️ Deferred | plex-api; deprecated package, no fix               |
| 19  | @babel/helpers RegExp                             | –              | ⚠️ Deferred | Dev-only; babel transpilation                      |
| 20  | nodemailer (interpretation, ReDoS, addressparser) | Moderate/Low   | ✅ Fixable  | Resolution → 7.0.12; email-templates uses 6.8.0    |
| 21  | xml2js prototype pollution                        | Moderate       | ✅ Fixable  | Resolution → 0.5.0; plex-api uses 0.4.x            |
| 22  | js-yaml prototype pollution                       | Moderate (Dev) | ✅ Fixable  | Resolution → 4.1.1; eslint, json-schema-ref-parser |
| 23  | on-headers header manipulation                    | Low            | ✅ Fixable  | Resolution → 1.1.0; express-session uses 1.0.2     |
| 24  | diff (jsdiff) DoS                                 | Low            | ⚠️ Deferred | parsePatch/applyPatch; check usage                 |
| 25  | tmp symlink                                       | Low (Dev)      | ⚠️ Deferred | Dev-only                                           |
| 26  | brace-expansion ReDoS                             | Low            | ⚠️ Deferred | Transitive; check usage                            |

---

## Detailed Findings

### 1. ip – SSRF improper categorization (CVE-2024-29415)

**Severity:** High  
**Package:** `ip@2.0.0`  
**Dependency chain:** `make-fetch-happen` → `socks-proxy-agent` → `socks` → `ip`

**Issue:** `isPublic()` misclassifies certain IPs, enabling SSRF bypass.

**Fix:** No direct patch for `ip`. The `socks` package 2.7.3+ addresses this. Resolution added to force `socks@2.7.3` or higher.

---

### 2. tough-cookie – Prototype Pollution (CVE-2023-26136)

**Severity:** Moderate  
**Packages:** `tough-cookie@2.5.0`, `5.1.2`, `6.0.0`  
**Dependency chain:** cypress, plex-api, musicbrainz-api, jsdom

**Issue:** Prototype pollution when `rejectPublicSuffixes=false`.

**Fix:** Upgrade to 4.1.3+. Requires major version bumps for consumers (plex-api, cypress use 2.x). Monitor upstream for compatibility.

---

### 3. lodash.pick – Prototype Pollution (CVE-2020-8203)

**Severity:** High (Development)  
**Package:** `lodash.pick@4.4.0`  
**Dependency chain:** `babel-plugin-react-intl-auto`

**Issue:** No patched version for standalone `lodash.pick`. Main `lodash` 4.17.19+ is patched.

**Mitigation:** Dev-only; not in production runtime. Low exposure. Consider replacing with main `lodash` if possible.

---

### 4. qs – arrayLimit bypass DoS (CVE-2025-15284)

**Severity:** High  
**Packages:** `qs@6.11.0` (express), `6.5.3` (cypress, plex-api)  
**Fix version:** 6.14.1+

**Issue:** Bracket notation bypasses `arrayLimit`, enabling memory exhaustion DoS.

**Fix:** ✅ Added resolution `"qs": "6.14.1"`.

---

### 5, 7, 8. tar – Path traversal, hardlink, symlink CVEs

**Severity:** High  
**Packages:** `tar@6.1.13`, `6.2.1`  
**Dependency chain:** cacache, sqlite3, node-gyp, semantic-release, bcrypt

**Issues:**

- CVE-2026-23745: Arbitrary file overwrite / symlink poisoning
- Hardlink path traversal
- Race condition (macOS APFS)

**Fix:** Full fix in `tar@7.5.3`. Resolutions may cause incompatibilities with semantic-release and npm tooling. Consider `tar@6.2.2` for 6.x fixes if available, or test `7.5.3` carefully.

---

### 6, 12, 13. multer – DoS vulnerabilities

**Severity:** High  
**Package:** `multer@1.4.5-lts.1`  
**Dependency chain:** `express-openapi-validator`

**Issues:**

- Unhandled exception DoS
- Memory leak from unclosed streams
- Maliciously crafted request DoS

**Fix:** Requires `multer@2.0.2+`. `express-openapi-validator` currently depends on multer 1.x. Track: https://github.com/cdimascio/express-openapi-validator/issues

---

### 9. semver – ReDoS (CVE-2022-25883)

**Severity:** High  
**Package:** `semver@7.3.8` (direct dependency)  
**Fix version:** 7.5.2+

**Issue:** ReDoS via malicious version range strings.

**Fix:** ✅ Upgrade `semver` in package.json to `7.5.2` or higher.

---

### 10. cross-spawn – ReDoS (CVE-2024-21538)

**Severity:** High  
**Packages:** `cross-spawn@6.0.5`, `7.0.3`  
**Fix versions:** 6.0.6, 7.0.5

**Issue:** ReDoS from improper input sanitization.

**Fix:** ✅ Added resolution `"cross-spawn": "7.0.5"`.

---

### 11. path-to-regexp – ReDoS / backtracking

**Severity:** High  
**Packages:** `path-to-regexp@0.1.7` (express), `6.2.1` (express-openapi-validator)  
**Fix versions:** 0.1.10+ (0.1.x), 6.3.0+ (6.x)

**Issue:** Backtracking regex patterns enable ReDoS.

**Fix:** ✅ Added resolutions for both version ranges.

---

## Implemented Fixes (package.json)

### Direct dependency upgrade

- `semver`: `7.3.8` → `7.5.2` (or latest 7.x)

### Resolutions added

```json
"qs": "6.14.1",
"cross-spawn": "7.0.5",
"express/path-to-regexp": "0.1.12",
"express-openapi-validator/path-to-regexp": "6.3.0",
"socks": "2.7.4",
"nodemailer": "7.0.12",
"xml2js": "0.5.0",
"js-yaml": "4.1.1",
"on-headers": "1.1.0"
```

### Optional (test before applying)

- `tar`: `7.5.3` – may break semantic-release / npm; run full CI
- `tough-cookie`: `4.1.3` – may break plex-api, cypress, jsdom

---

## After Applying Changes

1. Run `yarn install` to regenerate `yarn.lock`
2. Run `yarn build` to verify build
3. Run `yarn test` for unit tests
4. Run `yarn cypress:build` if using Cypress
5. Test core flows (auth, requests, Plex sync)

### CodeQL Exceptions / Intentional Accept-Risk

| Finding         | Reason                                                                           |
| --------------- | -------------------------------------------------------------------------------- |
| SSRF (#14–19)   | `isSafeUrl()` in place; URLs from admin config. Risk accepted pending hardening. |
| XSS (#12–13)    | React escapes by default; `settingsRoutes` from trusted config. Low risk.        |
| Hash (#10–11)   | SHA-256 for API keys is a common pattern; upgrade to bcrypt is optional.         |
| URL (#9)        | Data from MusicBrainz API. Mitigation: add `isSafeUrl()` before use.             |
| Workflow (#1–8) | Add `permissions:` blocks to restrict workflow scope. See fix below.             |

### Workflow Permissions Fix

Add `permissions:` to each workflow. Minimum required:

- **ci.yml** (test, build_and_push, discord): `contents: read` for checkout; `packages: write` for push
- **release.yml**: `contents: read, write` (semantic-release tags); `packages: write`
- **cypress.yml**: `contents: read`
- **support.yml**: `issues: write` (comment, close, lock)
- **preview.yml**: `contents: read`; `packages: write`

### Csslint Warnings (Codacy)

| ID      | Issue                       | Location                  | Notes                                                                                            |
| ------- | --------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------ |
| 271–273 | Expected RBRACE             | globals.css:210, 299, 395 | Csslint may misparse Tailwind `@layer`/`@apply` nesting. Verify structure; often false positive. |
| 274     | Properties not alphabetical | globals.css:459           | Style-only; reorder properties if desired.                                                       |

---

## Deferred / Accepted Exceptions

The following dependencies **cannot be updated yet** due to upstream constraints. These are documented exceptions when dismissing Dependabot alerts or reviewing security reports.

| Package              | Severity       | Reason for Deferral                                                                                                                                                         | Re-evaluate when                                       |
| -------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **multer**           | High           | `express-openapi-validator` does not support multer 2.x. No compatible fix available.                                                                                       | express-openapi-validator adds multer 2.x support      |
| **tar**              | High           | Upgrading to 7.5.3 may break semantic-release, node-gyp, npm tooling. 6.x has no patch. Includes: hardlink/symlink path traversal, race condition (APFS), folder count DoS. | tar 6.x patch released, or CI confirmed with 7.5.3     |
| **tough-cookie**     | Moderate       | Fix requires 4.1.3+; plex-api, cypress, jsdom depend on 2.x/5.x/6.x. Breaking change.                                                                                       | plex-api, cypress, or jsdom adopt tough-cookie 4.x     |
| **ip**               | High           | No patch available. Mitigated by socks 2.7.4 resolution.                                                                                                                    | Maintainers release ip 2.0.2+                          |
| **lodash.pick**      | High (Dev)     | No patched standalone. Dev-only; not in production runtime.                                                                                                                 | babel-plugin-react-intl-auto switches to main lodash   |
| **lodash**           | Moderate (Dev) | `_.unset`/`_.omit` prototype pollution. Direct dep is 4.17.23 (patched); alert may be from transitive.                                                                      | Verify all lodash instances resolve to 4.17.23+        |
| **@cypress/request** | Moderate (Dev) | SSRF in request. Dev-only (Cypress E2E tests); not in production runtime.                                                                                                   | Cypress updates request dependency                     |
| **request**          | Moderate       | SSRF. From plex-api; deprecated package, no upstream fix.                                                                                                                   | plex-api migrates off request                          |
| **@babel/helpers**   | –              | RegExp complexity in transpiled code. Dev-only.                                                                                                                             | Babel upstream fix                                     |
| **diff** (jsdiff)    | Low            | DoS in parsePatch/applyPatch.                                                                                                                                               | Check if used on untrusted input; upgrade if available |
| **tmp**              | Low (Dev)      | Symlink arbitrary write. Dev-only.                                                                                                                                          | Dev tooling upgrade                                    |
| **brace-expansion**  | Low            | ReDoS. Transitive dependency.                                                                                                                                               | Upgrade parent package                                 |

### Fixable with Resolutions (add to package.json)

| Package        | Resolution               | Reason                                                                                                                                                                                                                     |
| -------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **nodemailer** | `"nodemailer": "7.0.12"` | email-templates uses 6.8.0; fixes interpretation, ReDoS, addressparser                                                                                                                                                     |
| **xml2js**     | `"xml2js": "0.5.0"`      | plex-api uses 0.4.x; fixes prototype pollution                                                                                                                                                                             |
| **js-yaml**    | `"js-yaml": "4.1.1"`     | eslint, json-schema-ref-parser use 4.1.0/3.14.1; fixes merge pollution. Note: extract-react-intl-messages expects 3.x; 4.1.1 may cause compat issues—if so, use `"extract-react-intl-messages/js-yaml": "3.14.2"` instead. |
| **on-headers** | `"on-headers": "1.1.0"`  | express-session uses 1.0.2; fixes header manipulation                                                                                                                                                                      |

**When dismissing Dependabot alerts for these packages:** reference this section and choose "Tolerate" or "Won't fix" with a note pointing to `SECURITY_REMEDIATION.md`.

---

## Ongoing Monitoring

- Re-check GitHub Security / Dependabot after upstream releases
- Track `express-openapi-validator` for multer 2.x support
- Re-evaluate `ip` and `tough-cookie` when maintainers publish fixes
