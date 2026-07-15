# SKILLSWAP — Technical Decisions

> Any time we deviate from SKILLSWAP.md or make a judgement call, log it here.
> Newest entries go at the TOP.

---

## Sprint 0 — Enums & Models (July 13, 2026)

### Decision: `$fillable` allow-list on every Model, even Admin-only or internal-only ones

**Instead of:** Using `$guarded` (deny-list) on models, or skipping mass-assignment
protection entirely on models that only ever receive input from trusted internal code
(`Skill`, `AuditLog`).

**Because:** The `User` model's first draft used `$guarded`, listing sensitive fields
to protect. Caught in review: a deny-list fails open — if a new sensitive column gets
added to a migration later and nobody remembers to add it to `$guarded`, it's
mass-assignable by default with no warning. `$fillable` fails closed — a forgotten
column simply isn't writable until someone deliberately adds it. Applied consistently
across every model afterward, including `Skill` and `AuditLog`, which are never
touched by direct user input at all — for those, the allow-list costs nothing and
documents intent for anyone reading the model cold, even though the stricter threat
model isn't technically required there.

**Date:** July 13, 2026

---

### Decision: State-machine-owned model fields are set via direct property assignment

- `save()`, never `update()`/`fill()`/`forceFill()`

**Instead of:** Making fields like `SkillRequest.cancellation_reason`,
`SkillRequest.cancelled_by`/`completed_by`, `Message.is_read`, and `Review.is_hidden`
fillable so Services can write them through normal Eloquent mass-assignment methods.

**Because:** These fields are deliberately excluded from `$fillable` since they must
never be settable from raw user input (only a Service's validated state-transition
logic should ever change them). But Services still legitimately need to write them.
The resolved pattern: Services set these fields with direct property assignment
(`$model->field = $value;`) and call `->save()` — this bypasses Laravel's
mass-assignment guard entirely (which only applies to `fill()`/`create()`/`update()`),
so the `$fillable` allow-list stays meaningful as a boundary against user input while
Services retain full write access to fields they legitimately own. Chosen over
`forceFill()` because it's more explicit line-by-line about which field is changing
and why, matching SKILLSWAP.md's general preference for explicitness over bundled
convenience (same spirit as the "One Atomic Write" rule).

**Date:** July 13, 2026

---

### Decision: No `Notifiable` trait on the `User` model

**Instead of:** Using Laravel's built-in notification system (`Notifiable` trait +
database/mail notification channels), which is Laravel's default and what the
scaffolded `User` model originally included.

**Because:** SKILLSWAP.md already defines a custom `notifications` table with its own
schema (`jsonb` data, `NotificationType` enum, `is_read` flag) and a dedicated
`NotificationService` responsible for creation, real-time broadcast via Reverb, and
cache invalidation. Laravel's built-in database notifications would create a
conflicting/duplicate table shape (polymorphic `notifiable`, `data` as text, `read_at`
instead of `is_read`) and route logic through the framework's Channel system rather
than through our own Service/Repository layer — violating the "all business logic
lives in Services" rule and introducing side effects (`NotificationSent` events firing
from a trait) outside our own architecture.

**Date:** July 13, 2026

---

### Decision: Keep the `App\Models\Notification` class name despite colliding with

Laravel's built-in `Illuminate\Notifications\Notification`

**Instead of:** Renaming the model to something unambiguous (e.g. `AppNotification`) to
avoid sharing a class name with Laravel's own base notification class.

**Because:** The two classes live in different namespaces and, given the decision
above to skip `Notifiable` and Laravel's notification system entirely, the built-in
`Illuminate\Notifications\Notification` is never imported anywhere in this codebase —
the collision is real in principle but has no actual code path where it could cause a
bug. Renaming would also break the consistent "class name matches table name,
singularized" convention followed by every other model, which is more likely to
confuse someone reading the codebase cold than a collision that can't occur in
practice. Mitigated instead with an explicit docblock on the model itself, warning
future readers (human or AI) not to "fix" the shared name without this context.

**Date:** July 13, 2026

---

## Sprint 0 — Foundation (July 13, 2026)

### Decision: No Repository interfaces — Services depend on concrete Repository classes

**Instead of:** Defining a `*RepositoryInterface` for every Repository (`UserRepositoryInterface` → `UserRepository`, etc.) and binding them in a Service Provider, so Services depend on the abstraction rather than the concrete class.

**Because:** The textbook case for Repository interfaces is dependency inversion — swappable implementations and clean mocking in tests. Neither applies here in practice. Postgres is a permanent decision baked throughout the schema (UUID types, `jsonb`, raw `CHECK` constraints) — there is no realistic future where the database gets swapped. And `SKILLSWAP.md`'s own Testing Requirements already commit to running integration tests against a real Postgres test database (`RefreshDatabase`/Testcontainers), not mocked repositories — so the "cleaner mocking" benefit was never going to be used either. Adding interfaces now would be ceremony without a payoff, and the honest test for whether skipping something now is safe — "is it hard to add later?" — comes back no: turning a concrete class into an interface + implementation later is a small, mechanical change, not a rewrite. The layer boundary itself (Service never runs raw Eloquent, Repository never contains rule logic) is being kept strict regardless — that's the part that actually earns testability and maintainability, not the interface.

**Date:** July 13, 2026

---

### Decision: PHP 8.3 → 8.4 in `Dockerfile.server`

**Instead of:** Building the `server`/`reverb` images on `php:8.3-fpm`, as originally written in `SKILLSWAP.md`'s tech stack table.

**Because:** The Composer scaffold resolved to Laravel 13 instead of the originally planned Laravel 11 (newer stable existed at scaffold time — see the Laravel/Next.js version-drift note below). Laravel 13's `composer.lock` pulled in Symfony 8.x components, which require PHP 8.4.1+. Building against `php:8.3-fpm` failed outright at `composer install` inside the Docker image with an unsatisfiable dependency error. Bumping the base image to `php:8.4-fpm` was the only real fix — downgrading Symfony/Laravel to force PHP 8.3 compatibility would mean fighting the framework's own current requirements for no real benefit. `SKILLSWAP.md`'s tech stack table has been corrected to say PHP 8.4 to match reality.

**Date:** July 13, 2026

---

### Decision: Accept Laravel 13 and Next.js 16 instead of pinning back to 11 / 15

**Instead of:** Forcing `composer create-project` and `create-next-app` to install the exact versions originally written in `SKILLSWAP.md` (Laravel 11, Next.js 15).

**Because:** Both tools resolved to newer stable major versions by default at scaffold time, and nothing in SkillSwap's actual design is tied to version-specific behavior — Sanctum, Reverb, Eloquent, Form Requests, the App Router, Tailwind, and TypeScript all work the same way across these version jumps. Fighting the package managers to pin back to older majors (especially Laravel 11, which had unresolved security advisories on every 11.x release at scaffold time) would have meant taking on known CVEs or wrestling dependency constraints for a version number that doesn't matter to the project. `SKILLSWAP.md`'s tech stack table has been updated to Laravel 13 / Next.js 16 to match what's actually installed.

**Date:** July 13, 2026

---

### Decision: Chat conversations gate on skill request **creation** (sent), not **acceptance**

**Instead of:** Requiring a `SkillRequest` to reach `accepted` status before the two users' `Conversation` unlocks.

**Because:** Acceptance-gating was considered but rejected in favor of the simpler trigger already written into `SKILLSWAP.md` (Business Rule 11 / Design Decision D12): a single `SkillRequestCreated` event auto-creates the conversation, rather than needing `SkillRequestService::accept()` to also know about conversations — one fewer place state can drift out of sync. It's also a better product outcome: a teacher can ask a clarifying question before deciding to accept or reject, instead of being forced to decide blind from a one-shot message field alone. This was a genuine judgment call made during the messaging design discussion, not a fix — logged here since it's exactly the kind of decision this file exists to capture, even though the doc itself already reflects the outcome.

**Date:** July 13, 2026

---
