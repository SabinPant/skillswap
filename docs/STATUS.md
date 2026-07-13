# SKILLSWAP — Development Status

> This file tracks daily progress. Newest sections go at the TOP. Never delete old sections — they become history.

---

## Current Sprint: 0 (Foundation — Repo, Docker, Full Schema)

## Last Updated: July 13, 2026

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
