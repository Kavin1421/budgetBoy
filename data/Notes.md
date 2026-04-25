# BudgetBoy Deep Project Notes

Date: 2026-04-25

## Priority Recommendations

### Critical

1. Harden public write APIs against abuse (`/api/v1/analyze`, `/api/v1/user`, `/api/v1/share`)
   - Add route-level rate limiting (IP + route bucket).
   - Add lightweight anti-bot checks for anonymous POST routes.
   - Add request quotas/logging to protect DB and AI cost.

2. Fix telecom catalog uniqueness and upsert keying
   - Current risk: global `planId` collisions across providers can overwrite data.
   - Make index compound unique: `(provider, planId)`.
   - Upsert by provider + planId and run a cleanup migration.

3. Make share links safer by default
   - Add `expiresAt` and TTL index to shared scenarios.
   - Add revoke/disable support for existing share links.
   - Add view telemetry (`viewCount`, `lastViewedAt`) for auditability.

4. Add security headers baseline
   - Add middleware headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.

### High

1. Privacy guardrails for AI suggestions
   - Add explicit AI opt-in in wizard.
   - Redact member names before sending payload context to AI.
   - Add retention and privacy copy where data is saved/shared.

2. Remove startup DB sync from runtime boot path
   - Move telecom sync to scheduled job/CLI/CI pipeline.
   - Keep app startup lightweight and predictable.

3. Add automated tests for core optimizer and API contracts
   - Unit tests for optimizer scoring/fit/verdict logic.
   - Integration tests for `/api/v1/*` envelopes and error codes.
   - Contract checks against OpenAPI spec.

4. Strengthen DB-level constraints
   - Mirror key Zod constraints (enums/ranges) in Mongoose schemas.
   - Add schema version field for safe future migrations.

### Medium

1. Improve observability beyond logs
   - Add request latency/error metrics per route.
   - Add tracing around DB + optimizer + AI calls.

2. Unify terminology across UI
   - Pick one term: `Scenario` (recommended) instead of mixed `Playlist/Scenario`.

3. Simplify persistence strategy
   - Remove duplicate local storage writes and keep one source of truth in Zustand persisted state.
   - Add versioned migration guards for persisted state.

4. OpenAPI lifecycle improvements
   - Add CI check to ensure runtime responses match documented schemas.

### Nice-to-have

1. Recommendation quality loop
   - Track whether users accept “switch” recommendations and tune weights.

2. Share management UX
   - Add share link dashboard: list, revoke, expiry presets, copy/open stats.

3. Dashboard render optimization
   - Memoize heavy derived values and lazy-render non-critical sections.

---

## Quick Wins (1-2 Days)

- Add API rate limiting for write routes.
- Add share link expiry defaults (7 or 30 days).
- Fix telecom index/upsert key (`provider + planId`).
- Add security middleware headers.
- Standardize UI wording to `Scenario`.
- Remove duplicate persistence write path.

## Strategic Plan (2-4 Weeks)

1. Reliability and security hardening
   - API policy layer (limits, anti-abuse, auth-ready design).
   - Security headers + threat model pass.

2. Quality and release confidence
   - Unit/integration/contract test suite in CI.
   - Regression checks for optimizer and dashboard.

3. Data and sync architecture
   - Move telecom catalog ingestion off request/startup path.
   - Add freshness monitoring and rollback strategy.

4. Privacy and trust
   - Consent + redaction + retention controls for AI and shared links.

---

## Suggested Next Implementation Order

1. API rate limiting + share expiry
2. Telecom compound index + migration
3. Security middleware headers
4. Optimizer tests + API contract tests
5. Terminology + persistence cleanup

