# SKILLSWAP — Development Status

> This file tracks daily progress. Newest sections go at the TOP. Never delete old sections — they become history.

---

## Current Sprint: 1 (Email Verification, Password Reset, CI)

## Last Updated: July 16, 2026

---

## Sprint 0 — Auth Skeleton & Config (July 16, 2026)

### Status: SPRINT 0 COMPLETE — Enums, Models, config, exception handler, CORS, and auth skeleton all done. Sprint 1 (email verification, password reset, CI) is next.

### Config & Foundation (completed this session):

- `config/skillswap.php` — all six SkillSwap config values centralized, env-driven with
  defaults
- `ConfigServiceProvider` — boot-time validation refuses to start in non-local
  environments if any required env var is missing (matches SKILLSWAP.md's "app refuses
  to boot" rule)
- `DomainValidationException` — custom exception carrying machine-readable error codes
  and HTTP status, thrown by Services for business rule violations
- `App\Exceptions\Handler` (overwritten) — catches `DomainValidationException`,
  `ValidationException`, `ModelNotFoundException`, `NotFoundHttpException`,
  `AuthenticationException`, `AuthorizationException`, and a catch-all; all rendered
  through `ApiResponseTrait`'s standard error envelope; stack traces never exposed in
  any environment
- `ApiResponseTrait` — success/error JSON envelope methods used by all Controllers and
  the exception handler, matching SKILLSWAP.md's exact shape
- `config/cors.php` (overwritten) — locked to `FRONTEND_URL`, supports credentials for
  Sanctum
- `config/auth.php` — added `api` guard with `sanctum` driver (was missing — defaults
  only had web/session)
- `bootstrap/app.php` — added api route file registration (was missing —
  `routes/api.php` wasn't loaded)
- `config/sanctum.php` — not published (Sanctum in Laravel 13 has no publishable
  config); defaults handle stateless Bearer token auth correctly

### Auth Skeleton (completed this session):

- `UserRepository` — `findByEmail`, `findById`, `create` (data access only, no business
  logic)
- `AuthService` — `register` (duplicate email check → `EMAIL_ALREADY_EXISTS`), `login`
  (credential validation → `INVALID_CREDENTIALS`), `logout` (revoke current token),
  `refresh` (rotate token), `me` (return authenticated user); all business rules
  enforced here
- `RegisterUserRequest` — name/email/password/optional location validation
- `LoginUserRequest` — email/password validation
- `AuthController` — `register` (201), `login` (200), `logout` (204), `refresh` (200),
  `me` (200); no business logic, calls `AuthService`, returns via `ApiResponseTrait`
- `routes/api.php` — public: register, login; protected (`auth:sanctum`): logout,
  refresh, me; all under `api/v1/auth`

### Auth skeleton verified:

`php artisan route:list -v` confirmed all 5 auth routes registered with correct
middleware — register/login use `api` middleware only, logout/refresh/me use `api` +
`auth:sanctum`.

### Notes:

- Sanctum uses stateless Bearer tokens (Authorization header) — no SPA/cookie-based
  auth, consistent with Next.js as a separate frontend
- No email verification or password reset yet — those are Sprint 1
- No rate limiting middleware applied yet — rate limits defined in SKILLSWAP.md,
  implementation is Sprint 1 work
- `ApiResponseTrait` error response includes `timestamp` using
  `now()->toIso8601String()`, matching the spec's format exactly

### Folder Tree:

```
skillswap/
├── client/
│   ├── .env.local.example
│   └── nextjs/                    ← Next.js 16 app (scaffolded, no custom code yet)
├── server/
│   ├── .env.example
│   └── laravel/                   ← Laravel 13 app
│       └── app/
│           ├── Enums/
│           │   ├── UserRole.php
│           │   ├── SkillCategory.php
│           │   ├── ProficiencyLevel.php
│           │   ├── SkillRequestStatus.php
│           │   ├── NotificationType.php
│           │   └── MessageType.php
│           ├── Models/
│           │   ├── User.php               (replaces Laravel default)
│           │   ├── Skill.php
│           │   ├── UserSkill.php
│           │   ├── SkillRequest.php
│           │   ├── Conversation.php
│           │   ├── Message.php
│           │   ├── Review.php
│           │   ├── Notification.php
│           │   └── AuditLog.php
│           ├── Http/
│           │   ├── Controllers/
│           │   │   └── AuthController.php
│           │   └── Requests/
│           │       ├── RegisterUserRequest.php
│           │       └── LoginUserRequest.php
│           ├── Services/
│           │   └── AuthService.php
│           ├── Repositories/
│           │   └── UserRepository.php
│           ├── Exceptions/
│           │   └── DomainValidationException.php
│           ├── Traits/
│           │   └── ApiResponseTrait.php
│           └── Providers/
│               └── ConfigServiceProvider.php
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.server
│   └── Dockerfile.client
├── docs/
│   ├── SKILLSWAP.md
│   ├── STATUS.md
│   └── DECISIONS.md
└── .gitignore
```

(`config/skillswap.php`, `config/cors.php`, `config/auth.php`, `bootstrap/app.php`, and
`routes/api.php` all updated in place this session — not shown as new tree entries
since they pre-existed as Laravel scaffold files.)

---

## Sprint 0 — Enums & Models (July 13, 2026)

### Status: COMPLETE — All 6 enums and all 9 models written, reviewed, committed.

### Workflow change this session:

Started using DeepSeek for implementation, with Claude reviewing every file against
SKILLSWAP.md's Architecture Rules before approval. One file at a time, plan-then-code,
no bundling. This worked well — several real gaps were caught in review rather than
discovered later as bugs (see below and DECISIONS.md).

### Enums Created (`app/Enums/`):

- `UserRole` — `USER`, `ADMIN`
- `SkillCategory` — all ten categories from the schema
- `ProficiencyLevel` — `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`
- `SkillRequestStatus` — all six states matching the state machine diagram
- `NotificationType` — all eight event types, including `MESSAGE_RECEIVED`
- `MessageType` — `TEXT`, `IMAGE`, `FILE`

All string-backed, `declare(strict_types=1)` adopted as a standing convention starting
with the second enum onward.

### Models Created (`app/Models/`):

- `User` (replacing Laravel's default scaffold) — UUID PK via `HasUuids`, `SoftDeletes`,
  `$fillable` allow-list (switched from an initial `$guarded` deny-list — see
  DECISIONS.md), `role` cast to `UserRole`, password auto-hashed via Laravel's
  `'password' => 'hashed'` cast, `Notifiable` deliberately omitted (see DECISIONS.md)
- `Skill` — UUID PK, `$fillable` allow-list even though Admin-only (defense in depth),
  `category` cast to `SkillCategory`, no `SoftDeletes`
- `UserSkill` — pivot model, `belongsTo` to both `User` and `Skill`, `proficiency_level`
  cast to enum, both intent booleans cast natively
- `SkillRequest` — five `belongsTo` relationships (`learner`, `teacher`, `skill`,
  `cancelledBy`, `completedBy`), `$fillable` limited to creation-time fields only;
  state-machine-owned fields (`status`, `cancellation_reason`, `cancelled_by`,
  `completed_by`, `completed_at`) are deliberately excluded from `$fillable` and will
  be set via direct property assignment + `save()` in `SkillRequestService` — never
  `update()`/`fill()` (see DECISIONS.md)
- `Conversation` — `userOne`/`userTwo` `belongsTo` (explicit FKs), `hasMany` to
  `Message`; the lexicographically-smaller-UUID ordering rule is confirmed to live in
  `ConversationService`, not the model — model has no enforcement of it by design
- `Message` — `const UPDATED_AT = null` (no `updated_at` column exists — messages are
  immutable); `is_read` excluded from `$fillable`, same direct-assignment pattern as
  `SkillRequest`; content-or-attachment validation confirmed to belong in
  `MessageService` before insert, not left to the DB `CHECK` constraint alone
- `Review` — `reviewer`/`reviewee` `belongsTo` (explicit FKs), `is_hidden` excluded from
  `$fillable` (Admin-only), rating-range validation confirmed to belong in
  `ReviewService` before insert
- `Notification` — `data` cast to `array` (jsonb), `is_read` excluded from `$fillable`;
  class name deliberately kept as `Notification` despite sharing a name with Laravel's
  built-in `Illuminate\Notifications\Notification` — documented with an explicit
  docblock warning rather than renamed (see DECISIONS.md)
- `AuditLog` — nullable `user_id` for system/scheduled-job-triggered entries, `metadata`
  cast to `array`; kept a `$fillable` allow-list even though only internal Services will
  ever create these rows, for consistency and self-documentation at no real cost

### Bugs/Gaps Caught During Review (fixed before approval, not after):

- Initial `User` model used `$guarded` (deny-list) instead of `$fillable` (allow-list) —
  caught because a deny-list fails open (a new sensitive column added later is
  mass-assignable by default unless someone remembers to guard it); switched to
  `$fillable` across every subsequent model for the same reason
- `SkillRequest`/`Message`/`Review` all needed explicit confirmation of how their
  Service-owned-only fields (cancellation fields, `is_read`, `is_hidden`) actually get
  written, given they're deliberately excluded from `$fillable` — resolved with a
  consistent direct-assignment-then-`save()` pattern across all three, rather than each
  Service inventing its own approach
- `Notification` model name collision with Laravel's core notification class — assessed
  and accepted as harmless given the project's earlier decision to skip `Notifiable`
  entirely, documented in place rather than worked around with a rename

### Notes:

- The "one file at a time, plan before code, explicit review" workflow with DeepSeek is
  working well and will continue for the rest of the project.

### Folder Tree:

```
skillswap/
├── client/
│   ├── .env.local.example
│   └── nextjs/                    ← Next.js 16 app (scaffolded, no custom code yet)
├── server/
│   ├── .env.example
│   └── laravel/                   ← Laravel 13 app
│       └── app/
│           ├── Enums/
│           │   ├── UserRole.php
│           │   ├── SkillCategory.php
│           │   ├── ProficiencyLevel.php
│           │   ├── SkillRequestStatus.php
│           │   ├── NotificationType.php
│           │   └── MessageType.php
│           └── Models/
│               ├── User.php               (replaces Laravel default)
│               ├── Skill.php
│               ├── UserSkill.php
│               ├── SkillRequest.php
│               ├── Conversation.php
│               ├── Message.php
│               ├── Review.php
│               ├── Notification.php
│               └── AuditLog.php
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.server
│   └── Dockerfile.client
├── docs/
│   ├── SKILLSWAP.md
│   ├── STATUS.md
│   └── DECISIONS.md
└── .gitignore
```

---

## Sprint 0 — Foundation (July 11–13, 2026)

### Status: SCHEMA COMPLETE — Auth skeleton, CI, and boot-time config validation still pending

### Repo & Tooling:

- Monorepo scaffolded at `E:\skillswap` with `client/`, `server/`, `docker/`, `docs/` structure
- Git initialized, remote connected to `github.com/SabinPant/skillswap`, pushed to `main`
- Root `.gitignore` in place — excludes `.env`, `node_modules`, `vendor`, OS junk; verified real `.env` never entered git history
- Folder naming decided as `client`/`server` (not `frontend`/`backend`) — renamed across repo tree, Docker service names, Dockerfiles, and deployment references

### Backend Scaffold:

- Laravel scaffolded into `server/laravel` via a throwaway Composer Docker container (no local PHP/Composer installed on the host machine by design)
- Actual installed version: **Laravel 13** (composer resolved this instead of the originally planned Laravel 11 — newer stable existed at scaffold time; nothing in the design is version-specific, so accepted rather than pinned back)
- `laravel/sanctum` and `laravel/reverb` installed via Composer
- Auto-generated SQLite database file removed (Laravel's install-time default; project uses Postgres)
- `server/laravel/.env` fully reconfigured to match Docker services: Postgres (`DB_HOST=postgres`), Redis (`REDIS_HOST=redis`, driving `SESSION_DRIVER`/`CACHE_STORE`/`QUEUE_CONNECTION`), Mailhog (`MAIL_HOST=mailhog`), Reverb (`BROADCAST_CONNECTION=reverb`), Cloudinary/Resend placeholders, and the SkillSwap app-config block (`SKILL_REQUEST_EXPIRY_HOURS`, etc.)
- Removed Laravel's default Vite-frontend assumptions (`VITE_APP_NAME`, and later the installer-added `VITE_REVERB_*` lines) — irrelevant since the frontend is a fully separate Next.js app, not a Laravel-bundled Vite build
- `php artisan reverb:install` run inside the container — published `broadcasting.php` config and `channels.php` routes, confirmed the Reverb broadcasting driver

### Frontend Scaffold:

- Next.js scaffolded into `client/nextjs` via a throwaway Node Docker container (`--typescript --tailwind --app --no-src-dir --import-alias "@/*"`)
- Actual installed version: **Next.js 16** (same version-drift situation as Laravel — accepted rather than pinned back)
- Removed auto-generated `AGENTS.md`/`CLAUDE.md` agent-context files (not needed, redundant with direct collaboration)
- `client/nextjs/.env.local` configured for API base URL + Reverb connection

### Docker Infrastructure:

- `docker-compose.yml` — six services: `postgres` (15), `redis` (7-alpine), `mailhog`, `server`, `reverb`, `client`
- `Dockerfile.server` (PHP-FPM, originally 8.3 — see DECISIONS.md) and `Dockerfile.client` (Node 20-alpine) written and building cleanly
- `.dockerignore` added to both `client/nextjs` and `server/laravel` after the first `client` build failed trying to copy 425MB of `node_modules` into the build context
- Docker Desktop's WSL2 disk image relocated from `C:` to `E:\DockerData` to keep the whole project (code + Docker storage) off the constrained system drive
- Full stack verified running end-to-end: Laravel responding `200 OK` on `:8000` (real page title "SkillSwap," confirming `.env` took effect), Next.js default page on `:3000`, Mailhog UI on `:8025`, Reverb running after fixing the missing-package crash (see DECISIONS.md)

### Database Schema — Complete:

All nine SkillSwap tables migrated successfully against real Postgres, in order, with all foreign keys and both raw `CHECK` constraints applying cleanly:

- `users` (replacing Laravel's default) — UUID PK, `role`, `location`/`latitude`/`longitude`, `avatar_public_id`, `is_suspended`, soft deletes
- `skills` — global taxonomy, Admin-managed
- `user_skills` — pivot with `can_teach`/`wants_to_learn`, `CHECK` constraint enforcing at least one is true
- `skill_requests` — the state-machine table, `learner_id`/`teacher_id`/`cancelled_by`/`completed_by` all referencing `users`
- `conversations` — one-to-one chat, `initiating_skill_request_id` uses `nullOnDelete()` since it's context only, not a lifecycle dependency
- `messages` — `CHECK` constraint enforcing content-or-attachment, no `updated_at` (messages are immutable)
- `reviews` — `reviewer_id`/`reviewee_id`, `CHECK` constraint enforcing rating 1–5, unique per reviewer per request
- `notifications` — `jsonb` data column (Postgres-native, not generic `json`)
- `audit_logs` — nullable `user_id` for system/scheduled-job-triggered entries

### Bugs Fixed:

- `composer create-project laravel/laravel laravel "^11.0"` blocked by Composer's security-advisory checker (all 11.x releases had disclosed CVEs at scaffold time) — resolved by dropping the version constraint entirely, which resolved to Laravel 13
- Client Docker build failed (`invalid file request node_modules/.bin/baseline-browser-mapping`) — caused by missing `.dockerignore`, was uploading the entire local `node_modules` into the build context; fixed by adding `.dockerignore` to both `client/nextjs` and `server/laravel`
- `server`/`reverb` image build failed — `composer.lock` required PHP 8.4.1+ (Symfony 8.x dependency floor) but `Dockerfile.server` specified `php:8.3-fpm` — see DECISIONS.md
- `reverb` container built and started but immediately exited — `laravel/reverb` package was never actually installed via Composer, so `php artisan reverb:start` had no command to run; fixed by `composer require laravel/reverb` and rebuilding
- `php artisan reverb:install` failed with `NonInteractiveValidationException` on first attempt — `docker compose exec` without `-it` doesn't allocate a real terminal, so the installer's interactive prompt had nowhere to send output; fixed by re-running with `docker compose exec -it`
- Three migration files (`skill_requests`, and others copy-pasted from the same pattern) hit `ParseError: syntax error, unexpected end of file` — missing trailing `;` after the anonymous migration class's closing `}` (the whole `return new class extends Migration {...}` is a `return` expression, so it needs the semicolon like any other statement)

### Files Created:

- `docker/docker-compose.yml`, `docker/Dockerfile.server`, `docker/Dockerfile.client`
- `server/.env.example`, `client/.env.local.example`
- `server/laravel/database/migrations/0001_01_01_000000_create_users_table.php` (replaced)
- `server/laravel/database/migrations/2024_01_01_000001_create_skills_table.php`
- `server/laravel/database/migrations/2024_01_01_000002_create_user_skills_table.php`
- `server/laravel/database/migrations/2024_01_01_000003_create_skill_requests_table.php`
- `server/laravel/database/migrations/2024_01_01_000004_create_conversations_table.php`
- `server/laravel/database/migrations/2024_01_01_000005_create_messages_table.php`
- `server/laravel/database/migrations/2024_01_01_000006_create_reviews_table.php`
- `server/laravel/database/migrations/2024_01_01_000007_create_notifications_table.php`
- `server/laravel/database/migrations/2024_01_01_000008_create_audit_logs_table.php`

### Notes:

- No application code written yet beyond migrations — no Controllers, Services, Repositories, Models, or Enums exist beyond Laravel's bare default scaffold. That's genuinely Sprint 0's remaining work, alongside the Sanctum auth skeleton, CORS lockdown, global exception handler, and `config/skillswap.php` boot-time validation.
- CI (`.github/workflows/ci.yml`) intentionally deferred to Sprint 1, once `RegisterTest`/`LoginTest` exist to actually run.
- Reverb is running on placeholder (hand-typed, not cryptographically random) `REVERB_APP_ID`/`KEY`/`SECRET` values — fine for localhost-only dev, flagged to fix properly before any real deployment.
- Repository/Service layer will use concrete classes injected via constructor, no Repository interfaces — see DECISIONS.md.

### Folder Tree:

```
skillswap/
├── client/
│   ├── .env.local.example
│   └── nextjs/                    ← Next.js 16 app (scaffolded, no custom code yet)
├── server/
│   ├── .env.example
│   └── laravel/                   ← Laravel 13 app
│       └── database/
│           └── migrations/        ← 9 SkillSwap tables + Laravel defaults (cache, jobs)
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.server
│   └── Dockerfile.client
├── docs/
│   ├── SKILLSWAP.md
│   ├── STATUS.md
│   └── DECISIONS.md
└── .gitignore
```

---
