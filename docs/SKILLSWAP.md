# SKILLSWAP — Peer-to-Peer Skill Exchange Platform

> | Laravel + Next.js Portfolio Project | Agile Scrum (2-Week Sprints)
> Goal: Build production-quality software — secure, scalable, maintainable.
> Not just a project to add to a CV — a platform that works like a real product.

---

## NOTE ON THIS DOCUMENT

This spec was rebuilt from an initial rough project brief. A few ambiguities and gaps in
that brief were resolved during the rewrite — they are called out explicitly wherever they
matter so nothing gets silently reinterpreted later. See **"Design Decisions & Clarified
Gaps"** near the end for the full list.

---

## WHAT IS SKILLSWAP?

SKILLSWAP is a peer-to-peer marketplace where people trade **skills instead of money**. A
user lists the skills they can **teach** and the skills they want to **learn**. Other users
browse or search by skill, find someone who teaches it, and send a **skill request** to book
a learning session. Sending a request unlocks a private **chat** between the two users, where
they coordinate everything — confirming details, agreeing a time, sharing a video call link or
address, swapping files. The teacher accepts or rejects the request, the session happens (in
person or via an externally-shared video call link — SKILLSWAP does not host video itself in
the MVP), and afterwards both sides can rate and review each other.

No payment processing, no escrow, no commission — the "currency" is reciprocity and
reputation, enforced socially through ratings and profile history rather than through money.

**Core loop:**

```
User lists skills (TEACH / LEARN)
        ↓
Another user searches/browses by skill
        ↓
Finds a teacher → sends a Skill Request (with proposed date/time + message)
        ↓
Chat unlocks between the two users (persists regardless of what happens next)
        ↓
Teacher Accepts or Rejects — either way, they can keep chatting
        ↓
   (Accepted) → Coordinate session details in chat → Session happens externally
        ↓
Either party marks it Completed
        ↓
Both users may leave a 1–5 star rating + comment for each other
        ↓
Profile reputation (average rating, total sessions taught/learned) updates
```

---

## THE ACTORS

Unlike a marketplace with structurally different account types, SKILLSWAP has **one account
type** (`User`) that can act in different **roles** depending on context. This is a
deliberate simplification: forcing people to register separately as "a teacher" or "a
learner" would be artificial, since most users do both (e.g. someone teaches Spanish and
wants to learn guitar on the same profile).

| Concept     | What It Actually Is                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User**    | The only account/table. Registers once, has one login, one profile.                                                                                                            |
| **Teacher** | A _role_, not an account type — a User is "the teacher" on any `SkillRequest` where they are the one offering the skill (`teacher_id`).                                        |
| **Learner** | A _role_, not an account type — a User is "the learner" on any `SkillRequest` where they are the one requesting the skill (`learner_id`).                                      |
| **Admin**   | A separate privilege level (`role = admin` on the `users` table), seeded in the database. Manages the global skill taxonomy, moderates reviews, and suspends abusive accounts. |

A single `UserSkill` row captures **both** "I can teach X" and "I want to learn X" as
independent booleans (`can_teach`, `wants_to_learn`) against the same `(user, skill)` pair,
so a user can simultaneously teach and want-to-learn the same skill at different proficiency
framings if that ever makes sense, without duplicate rows.

**What every User can do:**

- Register, verify email, log in, manage their profile (bio, location, avatar)
- Add/remove skills they can teach and skills they want to learn
- Search/browse other users by skill, category, and location
- Send a skill request to any teacher (except themselves)
- Accept, reject, complete, or cancel requests where they are a participant
- Rate and review the other participant after a request is marked `completed`
- Receive notifications for request lifecycle events

**What every User cannot do:**

- Send a skill request for a skill they themselves listed under "can teach" targeting
  themselves as teacher (`CANNOT_REQUEST_OWN_SKILL`)
- Review a request they were not a participant in, or review before it is `completed`
- Review the same request twice as the same reviewer
- See another user's private data (email, password hash, raw location coordinates) —
  only public profile fields are exposed via `GET /users/{id}`
- Post as Admin without `role = admin` on their row

### Admin

Seeded in the database at first migration (`AdminUserSeeder`). Admin does not "join" through
any public flow.

**What Admin can do:**

- Manage the global skill taxonomy (create/update/delete entries in `skills`)
- Suspend/unsuspend user accounts (soft action — see Architecture Rules)
- View and moderate flagged reviews (remove a review's visible comment; the numeric rating
  history is retained for audit purposes even if hidden from public view)
- View platform-wide stats (users, requests, completion rate, average rating) on a simple
  admin dashboard

**Registration flow (all Users — the only flow that exists):**

```
Visits /register
Fills in: Full name, Email, Password, (optional) Location
Submits form
        ↓
Account created — email_verified_at = null
Verification email sent (token expires 24h, stored in Redis, single-use)
        ↓
Cannot log in until verified? See Design Decision D1 below — MVP allows login
immediately but blocks skill-request-sending and skill-request-accepting until
email is verified, to reduce first-session drop-off while still gating the
actions that actually matter for trust.
        ↓
Clicks verification link → email_verified_at set → token deleted from Redis
        ↓
Redirected to profile setup:
Step 1: Bio + Location (optional, can skip)
Step 2: Avatar upload (optional, can skip)
Step 3: Add at least one skill (can teach or want to learn) — optional but
        strongly prompted; skipping is allowed, dashboard nudges completion
        ↓
Dashboard — full access (subject to email verification gate above)
```

---

## TECH STACK

| Layer                       | Technology                                                                   |
| --------------------------- | ---------------------------------------------------------------------------- |
| Server API                  | Laravel 13 (PHP 8.3) — REST API                                              |
| Client                      | Next.js 16 (App Router) + TypeScript                                         |
| Styling                     | Tailwind CSS v4                                                              |
| Database                    | PostgreSQL 15+                                                               |
| ORM                         | Laravel Eloquent                                                             |
| Auth                        | Laravel Sanctum (stateless API tokens, not raw JWT — see Design Decision D2) |
| Validation                  | Laravel Form Requests                                                        |
| Cache / Rate Limit / Tokens | Redis 7                                                                      |
| Real-time                   | Laravel Reverb (self-hosted WebSockets) — see Design Decision D3             |
| Email                       | Laravel Mail (Mailhog local, Resend production)                              |
| File Storage                | Cloudinary (avatar uploads — free tier, no AWS account needed)               |
| Queue                       | Laravel Queue (Redis driver) — for email sending & notification fan-out      |
| Logging                     | Laravel Log (Monolog)                                                        |
| Testing                     | PHPUnit + Pest (feature + unit), Testcontainers for integration DB           |
| Containerisation            | Docker + Docker Compose                                                      |
| Deployment                  | Client → Vercel, Server → Render/Fly.io, DB → managed Postgres (Render/Neon) |
| Version Control             | Git + GitHub                                                                 |

---

## FEATURES

### MVP (Sprints 0–9)

**Phase 1 — Foundation**

- Registration with email verification, login, logout, token refresh
- Password reset (forgot password → email → reset)
- Profile CRUD: name, bio, location, avatar upload
- Global exception handling, rate limiting, CORS locked down from Sprint 0

**Phase 2 — Skills Management**

- Global skill taxonomy (Admin-managed categories + skill entries)
- Users add/remove skills under "Can Teach" and "Wants to Learn," each with a
  proficiency level
- Search/browse users by skill name, category, and location — this is the actual
  discovery mechanism: a learner types a skill (and optionally filters by category/
  location), gets a list of matching teachers' public profiles, and picks one. There
  is no feed and no algorithmic suggestion in MVP — see "How Discovery Actually Works"
  below.

**Phase 3 — Skill Requests**

- Learner sends a request to a teacher for a specific skill, with a message and a
  proposed date/time
- Teacher accepts or rejects
- Either party can cancel an accepted-but-not-yet-completed request, with a required reason
- Either party can mark a request `completed` once the session has happened
- Automatic expiry of requests left `pending` too long (see Business Rules)

**Phase 4 — Messaging**

- Sending (or receiving) a skill request automatically unlocks a private one-to-one
  chat between the two users — this is the platform's real answer to "how do two
  matched people actually coordinate a session," replacing any need to exchange
  contact info and move to an outside app
- Text messages plus a single image or file attachment per message (via Cloudinary,
  same signed-upload pattern as avatars)
- Real-time delivery via Laravel Reverb — messages appear instantly, no refresh
- Read/unread tracking per message, unread counts per conversation
- A conversation, once unlocked, persists indefinitely regardless of what happens to
  the `SkillRequest` that unlocked it (rejected/expired/completed) — see Design
  Decision D12
- Explicitly NOT in MVP: typing indicators, message editing/deleting, in-app
  blocking/reporting (see Known Gaps) — chat is one-to-one only, permanently, not a
  "not yet" placeholder for group chat

**Phase 5 — Reviews & Ratings**

- After a request reaches `completed`, both participants may leave one review each
  (1–5 stars + optional comment) — capped at exactly one review per reviewer per request
- Public profile shows average rating and total completed sessions (as teacher and as
  learner, tracked separately)

**Phase 6 — Notifications**

- In-app notifications for: new skill request received, request accepted/rejected,
  request cancelled, session reminder (24h before proposed time, if still pending
  confirmation of completion), new review received, new chat message received
- Real-time delivery via WebSockets (Laravel Reverb) with an in-app bell/inbox;
  notifications also persisted so they survive refresh/offline periods

### How Discovery Actually Works (Search & Filter, Not a Feed)

SKILLSWAP is a marketplace, not a social feed — there is no stream of "posts" to scroll.
A learner finds a teacher one of two ways:

1. **Search bar** — type a skill name (e.g. "Java"), optionally filter by category,
   location/radius, and minimum proficiency level; results are matching teachers'
   public profiles (avatar, bio, rating, proficiency for that skill)
2. **Browse by skill** — `GET /skills/{id}` shows a skill's detail page with a list of
   everyone who teaches it, reached via category browsing instead of search

Algorithmic "suggested matches" (Phase 7, post-MVP) is the only feed-like element ever
planned, and even that is opt-in suggestions on the dashboard, not a scrollable stream.

### Future / Post-MVP (Phase 7+, not built in the 10-sprint plan)

- Smart matching algorithm: suggest teachers based on the user's "wants to learn" list,
  weighted by location proximity, rating, and mutual skill overlap (i.e. two users who can
  each teach what the other wants to learn get boosted — a genuine "swap")
- In-app scheduling with calendar sync (Google Calendar)
- In-app video call integration (e.g. Daily.co / Twilio)
- Skill "badges"/certifications endorsed by multiple reviewers
- Group sessions (one teacher, many learners)
- In-chat blocking/reporting, message editing/deleting

---

## REPOSITORY STRUCTURE

The exact file names below will shift as each domain gets built — what matters, and what
won't change, is the **pattern**: every domain (Auth, Users, Skills, Skill Requests,
Conversations, Reviews, Notifications, Admin) repeats the same five pieces — a Controller,
a Service, a Repository, a set of Form Requests, and an Eloquent Model. Adding a new domain
(like Conversations below) means adding one of each, not restructuring anything.

```
skillswap/
├── server/                            ← Laravel API
│   └── laravel/
│       ├── app/
│       │   ├── Http/
│       │   │   ├── Controllers/Api/V1/    ← one Controller per domain, plus Admin/ subfolder
│       │   │   ├── Middleware/            ← EnsureEmailIsVerified, EnsureUserIsAdmin, etc.
│       │   │   └── Requests/              ← one folder per domain, one Request class per action
│       │   ├── Models/                    ← one Eloquent model per table
│       │   ├── Enums/                     ← UserRole, SkillCategory, SkillRequestStatus, etc.
│       │   ├── Services/                  ← ALL business logic — one Service per domain
│       │   ├── Repositories/              ← ALL Eloquent queries — one per Model needing custom queries
│       │   ├── DTOs/                      ← data shapes crossing layer boundaries
│       │   ├── Exceptions/                ← DomainValidationException, NotFoundException, Handler
│       │   ├── Events/ + Listeners/       ← e.g. SkillRequestCreated → notification + conversation unlock
│       │   ├── Jobs/                      ← queued background work (emails, expiry/reminder jobs)
│       │   └── Traits/                    ← ApiResponseTrait
│       ├── config/                        ← app.php, database.php, sanctum.php, reverb.php, skillswap.php
│       ├── database/
│       │   ├── migrations/
│       │   ├── seeders/                   ← DatabaseSeeder, SkillSeeder, AdminUserSeeder
│       │   └── factories/
│       ├── routes/
│       │   ├── api.php                    ← includes routes/api_v1.php
│       │   └── channels.php               ← Reverb broadcast auth channels
│       ├── tests/
│       │   ├── Feature/                   ← one folder per domain, full HTTP round-trip
│       │   └── Unit/Services/             ← one test class per Service
│       ├── .env
│       ├── artisan
│       └── composer.json
│
├── client/                            ← Next.js 16 + TypeScript
│   └── nextjs/
│       ├── app/                           ← one route folder per domain (auth/, skills/,
│       │                                     requests/, conversations/, notifications/, admin/)
│       ├── components/                    ← ui/, forms/, and one folder per domain
│       ├── lib/                           ← api-client.ts, auth.ts, websocket.ts, utils.ts
│       ├── store/                         ← Zustand stores (auth, notifications, chat)
│       ├── types/                         ← one .ts file per domain's shape
│       ├── hooks/                         ← useAuth, useApi, useNotifications, useChat
│       ├── package.json
│       └── .env.local
│
├── docker/
│   ├── Dockerfile.server
│   ├── Dockerfile.client
│   └── docker-compose.yml
│
├── .github/
│   └── workflows/
│       └── ci.yml                         ← added Sprint 1, once real tests exist
│
├── docs/
│   ├── PLAN.md                            ← This document
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── CONTRIBUTING.md
│
├── .gitignore
├── .env.example
└── README.md
```

---

## ARCHITECTURE RULES — ALWAYS FOLLOW THESE

### Layer Separation (CRITICAL — Never Cross These)

| Layer            | Owns                                                                                          | Never Owns                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Controller**   | Receives HTTP requests, calls Service, returns JSON via `ApiResponseTrait`                    | Business logic, Eloquent queries, calculations                                   |
| **Service**      | ALL business logic — rules, validations, state transitions, orchestration across repositories | Direct Eloquent queries (use Repository), response formatting, HTTP status codes |
| **Repository**   | All Eloquent queries and database operations                                                  | Business logic, rule checks, validation                                          |
| **DTO**          | Validates and transforms data shapes crossing layer boundaries                                | Domain logic, Eloquent queries, calculations                                     |
| **Form Request** | HTTP-level request validation, authorization (`authorize()`)                                  | Business logic, database queries                                                 |

### Module Communication Rules

- ✅ Controllers call Services
- ✅ Services call Repositories for persistence
- ✅ Services call other Services only when necessary, never circularly
- ✅ Services fire Events; Listeners (queued) handle side effects like notifications
- ❌ Controllers never call Repositories directly
- ❌ Services never touch `$request` or return `Response` objects
- ❌ Repositories never contain business rule checks (e.g. "is this the user's own skill")
- ❌ No circular dependencies between services (`SkillRequestService` may call
  `NotificationService`, but `NotificationService` must never call back into
  `SkillRequestService`)

### Error Handling

- Services throw `DomainValidationException` (business rule violations → 400/409) or
  `NotFoundException` (→ 404); Form Requests throw Laravel's standard
  `ValidationException` (→ 422) automatically
- `App\Exceptions\Handler` catches ALL exceptions and returns the standard error shape
  below — no try/catch blocks in Controllers or Services except around genuinely
  infrastructural calls (e.g. Cloudinary upload, external mail send)
- NEVER expose stack traces, raw SQL, or password hashes in any error response,
  in any environment
- All validation errors return 422 with field-level messages
- All not-found errors return 404 naming the resource (`"Skill not found"`, not just
  `"Not found"`)

### Code Reuse Rules

| If you write this in more than one place            | Move it to                                                                                                        |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Response formatting (success/error envelope)        | `app/Traits/ApiResponseTrait.php`                                                                                 |
| Reusable query fragments                            | The relevant `app/Repositories/*.php`                                                                             |
| Token/session helpers                               | `app/Services/AuthService.php`                                                                                    |
| Notification creation + broadcast                   | `app/Services/NotificationService.php`                                                                            |
| File upload/validation (avatars)                    | `app/Services/FileUploadService.php`                                                                              |
| Email dispatch                                      | Dedicated `Jobs/Send*EmailJob.php`, queued                                                                        |
| Date/time/timezone helpers                          | `app/Helpers/DateHelper.php`                                                                                      |
| Validation rules                                    | The relevant `app/Http/Requests/*.php`                                                                            |
| "Who is allowed to see/act on this resource" checks | The owning Service, not the Controller and not the Form Request's `authorize()` beyond basic auth-presence checks |

### Additional Hard Rules

1. Controllers route, Services decide, Repositories query — never cross layer boundaries
2. No business logic in Controllers — throw exceptions up, never catch them there
3. Global exception handler catches everything — no scattered try/catch
4. Shared logic lives in `Services/` or `Helpers/` only — never duplicated across modules
5. All ratings stored as `tinyint` 1–5 — average computed on read (or cached, see below),
   never stored as a mutable running average that can drift from source rows
6. Every skill-request status change and every review creation writes to `audit_logs` —
   no silent state mutations
7. Avatar files: only the Cloudinary `public_id` is stored on the `users` row; the
   display URL (with resize/crop transformations) is generated via the Cloudinary SDK
   at read time — never a raw hand-built URL string stored in the database
8. Never hard-delete a `User` — `deletedAt` (soft delete) only; a suspended or deleted
   user's historical `SkillRequest` and `Review` rows are retained for the other
   participant's history, with the deleted user displayed as "Deleted User"
9. Flyway-equivalent discipline: all schema changes go through Laravel migrations,
   never manual DB edits, never `Schema::create` run ad hoc outside a migration file
10. Pagination is consistent: cursor-based for time-ordered feeds (`notifications`,
    `skill_requests` lists), page-based (`?page=`) for Admin list views
11. `ConfigService`-equivalent: `config/skillswap.php` centralizes every tunable value
    (see below); the app fails fast on boot if a required env var is missing
12. One atomic write per logical operation — see the NEBULA-style rule below

### Architecture Rule — One Atomic Write Per Logical Operation

> If an operation's intent is "replace old value with new value," implement it as ONE
> write, never as two sequential calls ("delete old" then "write new") on the same
> resource. Two calls on the same key/row = race-condition risk and the exact class of
> bug where the new value never lands because the delete fires after the write in a
> concurrent request.

```php
// ❌ WRONG — two operations on the same resource
Redis::del("email:verify:{$oldToken}");
Redis::setex("email:verify:{$newToken}", 86400, $userId);

// ✅ CORRECT — generate the new key, let the old one expire naturally via TTL,
// or if truly replacing the same key, do it as a single SET
Redis::setex("email:verify:{$token}", 86400, $userId);
```

```php
// ❌ WRONG — accepting a request as two writes
$skillRequest->update(['status' => 'accepted']);
NotificationService::create($teacherOldNotification)->delete(); // separate call, separate race

// ✅ CORRECT — one transaction, one state transition
DB::transaction(function () use ($skillRequest) {
    $skillRequest->update(['status' => SkillRequestStatus::ACCEPTED]);
    // notification creation dispatched via event listener after commit
});
```

---

## DATABASE SCHEMA

### Enums

```php
// app/Enums/UserRole.php
enum UserRole: string {
    case USER = 'user';
    case ADMIN = 'admin';
}

// app/Enums/SkillCategory.php
enum SkillCategory: string {
    case PROGRAMMING = 'programming';
    case DESIGN = 'design';
    case MUSIC = 'music';
    case LANGUAGES = 'languages';
    case FITNESS = 'fitness';
    case COOKING = 'cooking';
    case PHOTOGRAPHY = 'photography';
    case MARKETING = 'marketing';
    case BUSINESS = 'business';
    case OTHER = 'other';
}

// app/Enums/ProficiencyLevel.php
enum ProficiencyLevel: string {
    case BEGINNER = 'beginner';
    case INTERMEDIATE = 'intermediate';
    case ADVANCED = 'advanced';
    case EXPERT = 'expert';
}

// app/Enums/SkillRequestStatus.php
enum SkillRequestStatus: string {
    case PENDING = 'pending';
    case ACCEPTED = 'accepted';
    case REJECTED = 'rejected';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
    case EXPIRED = 'expired';   // auto-set by ExpireStaleSkillRequestsJob
}

// app/Enums/NotificationType.php
enum NotificationType: string {
    case REQUEST_RECEIVED = 'request_received';
    case REQUEST_ACCEPTED = 'request_accepted';
    case REQUEST_REJECTED = 'request_rejected';
    case REQUEST_CANCELLED = 'request_cancelled';
    case REQUEST_EXPIRED = 'request_expired';
    case SESSION_REMINDER = 'session_reminder';
    case REVIEW_RECEIVED = 'review_received';
    case MESSAGE_RECEIVED = 'message_received';
}

// app/Enums/MessageType.php
enum MessageType: string {
    case TEXT = 'text';
    case IMAGE = 'image';
    case FILE = 'file';
}
```

### Skill Request State Machine

```
                 ┌──────────┐
   created  ───▶ │ PENDING  │
                 └────┬─────┘
        teacher        │        no response within
        accepts        │        config('skillswap.request_expiry_hours')
        ┌──────────────┼───────────────────┐
        ▼              ▼                   ▼
  ┌───────────┐  ┌──────────┐        ┌──────────┐
  │ ACCEPTED  │  │ REJECTED │        │ EXPIRED  │
  └─────┬─────┘  └──────────┘        └──────────┘
        │  (terminal)                  (terminal)
        │
        ├── either party cancels (reason required) ──▶  ┌───────────┐
        │                                               │ CANCELLED │
        │                                               └───────────┘
        │                                                 (terminal)
        │
        └── either party marks completed ───────────▶  ┌───────────┐
                                                        │ COMPLETED │
                                                        └───────────┘
                                                          (terminal)
                                                     → unlocks reviews
```

Only `PENDING → {ACCEPTED, REJECTED, EXPIRED}` and `ACCEPTED → {CANCELLED, COMPLETED}` are
legal transitions. All terminal states are final — no request ever transitions out of
`REJECTED`, `EXPIRED`, `CANCELLED`, or `COMPLETED`. `SkillRequestService` enforces this with
an explicit allow-list, not just database constraints.

### Entities

```php
// users
Schema::create('users', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name');
    $table->string('email')->unique();
    $table->string('password');
    $table->string('role')->default('user');          // UserRole enum
    $table->string('location')->nullable();
    $table->decimal('latitude', 10, 7)->nullable();     // for distance search
    $table->decimal('longitude', 10, 7)->nullable();
    $table->text('bio')->nullable();
    $table->string('avatar_public_id')->nullable();      // Cloudinary public_id, not a raw URL
    $table->timestamp('email_verified_at')->nullable();
    $table->boolean('is_suspended')->default(false);
    $table->timestamp('suspended_at')->nullable();
    $table->rememberToken();
    $table->softDeletes();
    $table->timestamps();

    $table->index('email');
});

// skills (global taxonomy, Admin-managed)
Schema::create('skills', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name')->unique();
    $table->string('slug')->unique();
    $table->string('category');                         // SkillCategory enum
    $table->text('description')->nullable();
    $table->timestamps();

    $table->index('category');
});

// user_skills (a user's relationship to a skill — teach and/or learn)
Schema::create('user_skills', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('skill_id')->constrained()->cascadeOnDelete();
    $table->string('proficiency_level');                 // ProficiencyLevel enum
    $table->boolean('can_teach')->default(false);
    $table->boolean('wants_to_learn')->default(false);
    $table->timestamps();

    $table->unique(['user_id', 'skill_id']);
    $table->index(['skill_id', 'can_teach']);             // fast "who teaches X" lookup
    // CHECK (can_teach = true OR wants_to_learn = true) — at least one must be set
});

// skill_requests
Schema::create('skill_requests', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('learner_id')->constrained('users')->cascadeOnDelete();
    $table->foreignUuid('teacher_id')->constrained('users')->cascadeOnDelete();
    $table->foreignUuid('skill_id')->constrained()->cascadeOnDelete();
    $table->string('status')->default('pending');         // SkillRequestStatus enum
    $table->text('message')->nullable();                  // learner's initial message
    $table->timestamp('proposed_at')->nullable();          // proposed session date+time (UTC)
    $table->string('timezone')->nullable();                 // learner's timezone at creation, IANA name
    $table->text('cancellation_reason')->nullable();
    $table->foreignUuid('cancelled_by')->nullable()->constrained('users');
    $table->foreignUuid('completed_by')->nullable()->constrained('users');
    $table->timestamp('completed_at')->nullable();
    $table->timestamp('expires_at')->nullable();            // set on creation = now + config TTL
    $table->timestamps();

    $table->index(['learner_id', 'status']);
    $table->index(['teacher_id', 'status']);
    $table->index('expires_at');
});

// reviews
Schema::create('reviews', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('skill_request_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('reviewer_id')->constrained('users')->cascadeOnDelete();
    $table->foreignUuid('reviewee_id')->constrained('users')->cascadeOnDelete();
    $table->tinyInteger('rating');                          // 1-5, CHECK constraint
    $table->text('comment')->nullable();
    $table->boolean('is_hidden')->default(false);            // Admin moderation flag
    $table->timestamps();

    $table->unique(['skill_request_id', 'reviewer_id']);      // one review per reviewer per request
    $table->index(['reviewee_id', 'is_hidden']);
    // CHECK (rating BETWEEN 1 AND 5)
});

// conversations (one-to-one — see Design Decision D12)
Schema::create('conversations', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('user_one_id')->constrained('users')->cascadeOnDelete();
    $table->foreignUuid('user_two_id')->constrained('users')->cascadeOnDelete();
    $table->foreignUuid('initiating_skill_request_id')->nullable()
        ->constrained('skill_requests')->nullOnDelete();   // context only, not a lifecycle dependency
    $table->timestamp('last_message_at')->nullable();        // denormalized for fast inbox sorting
    $table->timestamps();

    // user_one_id is always the lexicographically-smaller UUID of the pair — enforced in
    // ConversationService, not the database — so the same two people can never end up
    // with two conversation rows regardless of who messaged first
    $table->unique(['user_one_id', 'user_two_id']);
    $table->index(['user_one_id', 'last_message_at']);
    $table->index(['user_two_id', 'last_message_at']);
});

// messages
Schema::create('messages', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('conversation_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('sender_id')->constrained('users')->cascadeOnDelete();
    $table->string('type')->default('text');                 // MessageType enum
    $table->text('content')->nullable();                      // text body, or a caption on an attachment
    $table->string('attachment_public_id')->nullable();        // Cloudinary public_id, not a raw URL
    $table->string('attachment_original_filename')->nullable();
    $table->string('attachment_mime_type')->nullable();
    $table->unsignedInteger('attachment_size_bytes')->nullable();
    $table->boolean('is_read')->default(false);
    $table->timestamp('created_at')->useCurrent();
    // no updated_at — messages are immutable once sent (no editing in MVP)

    $table->index(['conversation_id', 'created_at']);          // pagination
    $table->index(['conversation_id', 'is_read']);              // unread counts
    // CHECK (content IS NOT NULL OR attachment_public_id IS NOT NULL) — a message needs
    // either text or an attachment, never neither; enforced in MessageService
});

// notifications
Schema::create('notifications', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
    $table->string('type');                                  // NotificationType enum
    $table->string('title');
    $table->text('message');
    $table->jsonb('data')->nullable();                       // JSONB, not TEXT — e.g. {skill_request_id, skill_name}
    $table->boolean('is_read')->default(false);
    $table->timestamps();

    $table->index(['user_id', 'created_at']);
    $table->index(['user_id', 'is_read']);
});

// audit_logs
Schema::create('audit_logs', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('user_id')->nullable()->constrained();  // actor, nullable for system jobs
    $table->string('action');                                   // e.g. 'skill_request.accepted'
    $table->string('entity_type');                               // e.g. 'SkillRequest'
    $table->uuid('entity_id');
    $table->jsonb('metadata')->nullable();                        // before/after or context
    $table->timestamps();

    $table->index(['entity_type', 'entity_id']);
    $table->index('created_at');
});
```

### Relationships Summary

- `User` 1—N `UserSkill` (a user can list many skills)
- `Skill` 1—N `UserSkill` (a skill can be listed by many users)
- `User` 1—N `SkillRequest` as `learner`, `User` 1—N `SkillRequest` as `teacher`
- `Skill` 1—N `SkillRequest`
- `SkillRequest` 1—N `Review` (max 2 in practice: one per participant)
- `User` 1—N `Review` as `reviewer`, `User` 1—N `Review` as `reviewee`
- `User` 1—N `Notification`
- `User` 1—N `Conversation` as `user_one`, `User` 1—N `Conversation` as `user_two`
  (exactly one `Conversation` row per unique pair of users who have ever exchanged a
  `SkillRequest`)
- `Conversation` 1—N `Message`; `User` 1—N `Message` as `sender`
- Average rating is **derived**, not stored on `users`: computed from
  `reviews WHERE reviewee_id = ? AND is_hidden = false`, cached in Redis
  (`rating:avg:{userId}`, 1h TTL, invalidated on new review write) rather than kept as a
  mutable column that could drift.

---

## BUSINESS RULES (Enforced in Services, Not Just Controllers/Requests)

1. A user cannot send a skill request to themselves (`CANNOT_REQUEST_OWN_SKILL`) —
   checked in `SkillRequestService`, not only inferred from the UI hiding the button
2. A user cannot send a request for a skill the target user hasn't listed under
   "can teach" (`SKILL_NOT_TAUGHT_BY_USER`)
3. A `SkillRequest` can only move through the legal transitions in the state machine
   above; any other transition throws `DomainValidationException`
4. Only the `teacher_id` on a request may `accept` or `reject` it
5. Either `learner_id` or `teacher_id` may `cancel` an `accepted` request, or `complete` it
6. A review may only be created when the parent `SkillRequest.status = completed`, by one
   of its two participants, about the other participant, exactly once
   (`CANNOT_REVIEW_OWN_REQUEST` / `CANNOT_RATE_SELF` covers the reviewer==reviewee case,
   which cannot happen structurally but is defended anyway)
7. `PENDING` requests older than `config('skillswap.request_expiry_hours')` (default 72h)
   are moved to `EXPIRED` by a scheduled job, notifying both parties
8. Adding a `UserSkill` requires at least one of `can_teach` / `wants_to_learn` to be true
9. Suspended users (`is_suspended = true`) cannot log in, send requests, or accept
   requests, but their historical data remains visible to others they interacted with
10. Deleting (soft-delete) a user does not delete their past `SkillRequest`/`Review` rows;
    their name is rendered as "Deleted User" to other participants
11. A `Conversation` is created (idempotently — get-or-create, never duplicated) the
    first time a `SkillRequest` exists between two users, in either direction; once
    created, it persists indefinitely regardless of that request's later status
12. Only a `Conversation`'s two participants may read or send messages in it —
    enforced in `ConversationService`/`MessageService`, not just hidden in the UI
    (`NOT_A_PARTICIPANT`)
13. A `Message` must contain either `content` or exactly one attachment (or both) —
    never neither (`MESSAGE_EMPTY`)
14. Messages cannot be edited or deleted in MVP — permanent once sent, which keeps the
    moderation story simple (nothing to reconcile if a message is later disputed)
15. Chat is one-to-one only — a user can never be added to a conversation with
    more than one other participant (`CANNOT_CREATE_GROUP_CONVERSATION` — enforced by
    the schema's unique pair constraint, not just application logic)

---

## CONFIGURATION — `config/skillswap.php`

All tunables are centralized and env-driven; nothing below is hardcoded in a Service.

```php
return [
    'request_expiry_hours' => env('SKILL_REQUEST_EXPIRY_HOURS', 72),
    'session_reminder_hours_before' => env('SESSION_REMINDER_HOURS_BEFORE', 24),
    'max_active_requests_per_user' => env('MAX_ACTIVE_REQUESTS_PER_USER', 20),
    'avatar_max_size_kb' => env('AVATAR_MAX_SIZE_KB', 2048),
    'chat_attachment_max_size_kb' => env('CHAT_ATTACHMENT_MAX_SIZE_KB', 8192),
    'rating_cache_ttl_minutes' => env('RATING_CACHE_TTL_MINUTES', 60),
];
```

The app **refuses to boot** (via a `ConfigServiceProvider` boot-time check) if any
required env var referenced above is missing in a non-local environment.

---

## API ENDPOINTS — REST API (`/api/v1`)

### Auth — `/api/v1/auth`

| Method | Path                   | Description                    | Auth |
| ------ | ---------------------- | ------------------------------ | ---- |
| POST   | `/register`            | Register new user              | No   |
| POST   | `/login`               | Login, returns Sanctum token   | No   |
| POST   | `/logout`              | Revoke current token           | Yes  |
| POST   | `/refresh`             | Rotate/refresh token           | Yes  |
| GET    | `/me`                  | Get current authenticated user | Yes  |
| POST   | `/forgot-password`     | Send password reset email      | No   |
| POST   | `/reset-password`      | Reset password with token      | No   |
| POST   | `/verify-email`        | Verify email with token        | No   |
| POST   | `/resend-verification` | Resend verification email      | Yes  |

### Users — `/api/v1/users`

| Method | Path           | Description                                                  | Auth            |
| ------ | -------------- | ------------------------------------------------------------ | --------------- |
| GET    | `/`            | List/browse users (paginated, filterable)                    | Yes             |
| GET    | `/{id}`        | Get public profile (name, bio, location, skills, rating)     | Yes             |
| PUT    | `/{id}`        | Update own profile (must be self)                            | Yes             |
| POST   | `/{id}/avatar` | Upload/replace avatar                                        | Yes (self only) |
| GET    | `/{id}/skills` | Get a user's public skill list                               | Yes             |
| GET    | `/search`      | Search users by `skill`, `category`, `location`, `radius_km` | Yes             |

### Skills (global taxonomy) — `/api/v1/skills`

| Method | Path    | Description                                       | Auth  |
| ------ | ------- | ------------------------------------------------- | ----- |
| GET    | `/`     | List all skills (filter by `category`)            | Yes   |
| GET    | `/{id}` | Get skill details                                 | Yes   |
| POST   | `/`     | Create new skill in taxonomy                      | Admin |
| PUT    | `/{id}` | Update skill                                      | Admin |
| DELETE | `/{id}` | Delete skill (blocked if in use — see Known Gaps) | Admin |

### User Skills — `/api/v1/user-skills`

| Method | Path    | Description                                      | Auth             |
| ------ | ------- | ------------------------------------------------ | ---------------- |
| GET    | `/`     | Get current user's own skill list                | Yes              |
| POST   | `/`     | Add a skill to current user (teach and/or learn) | Yes              |
| PUT    | `/{id}` | Update proficiency / teach / learn flags         | Yes (owner only) |
| DELETE | `/{id}` | Remove a skill from current user                 | Yes (owner only) |

### Skill Requests — `/api/v1/skill-requests`

| Method | Path             | Description                                                     | Auth                   |
| ------ | ---------------- | --------------------------------------------------------------- | ---------------------- |
| GET    | `/`              | List current user's requests (`?role=learner\|teacher&status=`) | Yes                    |
| POST   | `/`              | Create a new skill request                                      | Yes, verified          |
| GET    | `/{id}`          | Get request details (participants only)                         | Yes                    |
| PUT    | `/{id}/accept`   | Teacher accepts                                                 | Yes (teacher only)     |
| PUT    | `/{id}/reject`   | Teacher rejects                                                 | Yes (teacher only)     |
| PUT    | `/{id}/complete` | Either participant marks completed                              | Yes (participant only) |
| PUT    | `/{id}/cancel`   | Either participant cancels (reason required)                    | Yes (participant only) |

### Conversations — `/api/v1/conversations`

A conversation is never created directly through this API — it's auto-unlocked (see
Business Rule 11) the first time a `SkillRequest` exists between two users. There is
deliberately no `POST /conversations` endpoint.

| Method | Path             | Description                                                                                                                                                                             | Auth                   |
| ------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| GET    | `/`              | List current user's conversations, sorted by `last_message_at` desc (cursor-paginated); each entry includes the other participant's public info, last message preview, and unread count | Yes                    |
| GET    | `/{id}`          | Get conversation details (participants only)                                                                                                                                            | Yes (participant only) |
| GET    | `/{id}/messages` | Get message history, cursor-paginated                                                                                                                                                   | Yes (participant only) |
| POST   | `/{id}/messages` | Send a message (text and/or one attachment)                                                                                                                                             | Yes (participant only) |
| PUT    | `/{id}/read`     | Mark all unread messages in this conversation as read                                                                                                                                   | Yes (participant only) |

### Reviews — `/api/v1/reviews`

| Method | Path                | Description                                        | Auth                   |
| ------ | ------------------- | -------------------------------------------------- | ---------------------- |
| POST   | `/{skillRequestId}` | Create a review for a completed request            | Yes (participant only) |
| GET    | `/user/{userId}`    | List public reviews received by a user (paginated) | Yes                    |

### Notifications — `/api/v1/notifications`

| Method | Path         | Description                                          | Auth             |
| ------ | ------------ | ---------------------------------------------------- | ---------------- |
| GET    | `/`          | List current user's notifications (cursor-paginated) | Yes              |
| PUT    | `/{id}/read` | Mark one as read                                     | Yes (owner only) |
| PUT    | `/read-all`  | Mark all as read                                     | Yes              |
| DELETE | `/{id}`      | Delete a notification                                | Yes (owner only) |

### Admin — `/api/v1/admin`

| Method | Path                    | Description                                     | Auth  |
| ------ | ----------------------- | ----------------------------------------------- | ----- |
| GET    | `/stats`                | Platform-wide summary stats                     | Admin |
| GET    | `/users`                | List all users (page-based, includes suspended) | Admin |
| PUT    | `/users/{id}/suspend`   | Suspend a user                                  | Admin |
| PUT    | `/users/{id}/unsuspend` | Unsuspend a user                                | Admin |
| GET    | `/reviews`              | List all reviews (includes hidden)              | Admin |
| PUT    | `/reviews/{id}/hide`    | Hide a review's comment                         | Admin |

### WebSocket Channels (Laravel Reverb)

| Channel                                 | Purpose                                            | Auth                                            |
| --------------------------------------- | -------------------------------------------------- | ----------------------------------------------- |
| `private-user.{userId}`                 | Real-time notification push to a specific user     | Yes (must be that user — `routes/channels.php`) |
| `private-conversation.{conversationId}` | Real-time message delivery within one conversation | Yes (must be one of its two participants)       |

---

## STANDARD RESPONSE ENVELOPE

**Success:**

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

**Error:**

```json
{
  "success": false,
  "message": "This skill request has already been accepted",
  "code": "REQUEST_ALREADY_ACCEPTED",
  "timestamp": "2026-07-11T09:30:00.000Z",
  "errors": []
}
```

### Error Codes

| Code                          | HTTP | When                                                     |
| ----------------------------- | ---- | -------------------------------------------------------- |
| `INVALID_CREDENTIALS`         | 401  | Wrong email or password                                  |
| `EMAIL_NOT_VERIFIED`          | 403  | Action requires a verified email                         |
| `ACCOUNT_SUSPENDED`           | 403  | Account is suspended                                     |
| `EMAIL_ALREADY_EXISTS`        | 409  | Email already registered                                 |
| `SKILL_ALREADY_ADDED`         | 409  | User already has this skill listed                       |
| `SKILL_NOT_TAUGHT_BY_USER`    | 400  | Requested teacher doesn't list this skill as "can teach" |
| `CANNOT_REQUEST_OWN_SKILL`    | 400  | User tries to request their own skill from themselves    |
| `INVALID_STATUS_TRANSITION`   | 409  | Illegal `SkillRequest` state change attempted            |
| `REQUEST_ALREADY_ACCEPTED`    | 409  | Request already accepted                                 |
| `REQUEST_ALREADY_REJECTED`    | 409  | Request already rejected                                 |
| `REQUEST_ALREADY_COMPLETED`   | 409  | Request already completed                                |
| `REQUEST_NOT_COMPLETED`       | 400  | Review attempted before request is `completed`           |
| `CANNOT_REVIEW_OWN_REQUEST`   | 403  | User is not a participant on this request                |
| `REVIEW_ALREADY_SUBMITTED`    | 409  | Reviewer already reviewed this request                   |
| `CANNOT_RATE_SELF`            | 400  | Structural defense — reviewer equals reviewee            |
| `NOT_A_PARTICIPANT`           | 403  | User is not one of a conversation's two participants     |
| `MESSAGE_EMPTY`               | 400  | A message has neither text content nor an attachment     |
| `ATTACHMENT_TOO_LARGE`        | 422  | Attachment exceeds `chat_attachment_max_size_kb`         |
| `ATTACHMENT_TYPE_NOT_ALLOWED` | 422  | Attachment MIME type isn't on the server-side allow-list |
| `INSUFFICIENT_PERMISSIONS`    | 403  | User not authorized for this action                      |
| `NOT_FOUND`                   | 404  | Resource not found                                       |
| `VALIDATION_ERROR`            | 422  | Form validation failed                                   |
| `RATE_LIMIT_EXCEEDED`         | 429  | Rate limit hit                                           |
| `INTERNAL_ERROR`              | 500  | Unexpected error                                         |

---

## RATE LIMITS

| Route                               | Limit        | Window     |
| ----------------------------------- | ------------ | ---------- |
| `POST /auth/login`                  | 5 attempts   | 15 minutes |
| `POST /auth/register`               | 3 requests   | 1 hour     |
| `POST /auth/forgot-password`        | 3 requests   | 1 hour     |
| `POST /auth/resend-verification`    | 3 requests   | 1 hour     |
| `POST /skill-requests`              | 10 requests  | 1 minute   |
| `POST /reviews/{id}`                | 10 requests  | 1 minute   |
| `POST /conversations/{id}/messages` | 30 requests  | 1 minute   |
| `POST /users/{id}/avatar`           | 5 requests   | 1 hour     |
| All other authenticated routes      | 100 requests | 1 minute   |

Rate limit hits return `429 RATE_LIMIT_EXCEEDED`, never `401` — never let an attacker
distinguish "blocked by rate limit" from "wrong credentials."

---

## REDIS KEY STRUCTURE

| Key Pattern                        | Purpose                                                    | TTL                    |
| ---------------------------------- | ---------------------------------------------------------- | ---------------------- |
| `token:blacklist:{jti}`            | Revoked/rotated Sanctum tokens (if using JTI tracking)     | 15 min                 |
| `email:verify:{token}`             | Email verification token → userId                          | 24 hours               |
| `email:reset:{token}`              | Password reset token → userId                              | 1 hour                 |
| `ratelimit:login:{ip}`             | Login rate limit counter                                   | 15 min                 |
| `ratelimit:register:{ip}`          | Registration rate limit counter                            | 1 hour                 |
| `ratelimit:skill-request:{userId}` | Skill request creation rate limit                          | 1 min                  |
| `rating:avg:{userId}`              | Cached average rating + count                              | 60 min (config-driven) |
| `notification:unread:{userId}`     | Cached unread notification count                           | 5 min                  |
| `conversation:unread:{userId}`     | Cached total unread message count across all conversations | 5 min                  |
| `user:online:{userId}`             | Presence flag for WebSocket status                         | 5 min                  |

---

## SECURITY RULES

1. Sanctum tokens over raw hand-rolled JWT — see Design Decision D2
2. BCrypt for password hashing only; SHA-256 for any high-frequency token comparison
   (e.g. verification/reset token lookups) to avoid BCrypt latency on every request
3. Rate limiting from Sprint 0, CORS locked to the known client origin(s) only
4. Global exception handler — no stack traces, SQL, or secrets ever leaked to clients
5. All file uploads (avatars) validated for MIME type and size server-side, never
   trusted from the client's reported `Content-Type`
6. Avatar uploads go straight to Cloudinary (via signed upload from the server, using
   an API secret that never reaches the client) — the app never proxies or stores
   raw image bytes itself
7. Chat attachments use the same signed-Cloudinary-upload pattern as avatars, with
   their own server-side MIME-type allow-list and size cap
   (`chat_attachment_max_size_kb`) — never trusted from the client's reported type
8. Every skill-request status change and review creation writes an `AuditLog` row
9. Admin routes protected by `EnsureUserIsAdmin` middleware, never inferred from a
   client-supplied flag
10. `EnsureAccountNotSuspended` middleware runs before any state-changing route
11. Email verification tokens and password reset tokens are single-use — deleted from
    Redis immediately after successful use, never left to be replayed

---

## TESTING REQUIREMENTS

### Unit Tests (Services)

- `AuthService` — register, login, logout, refresh, password reset
- `UserSkillService` — add, update, remove, duplicate-skill rejection
- `SkillRequestService` — create, accept, reject, cancel, complete, expiry job,
  every illegal-transition case
- `ReviewService` — create, duplicate-review rejection, pre-completion rejection,
  average rating computation
- `NotificationService` — create, mark read, mark all read, cache invalidation
- `ConversationService` — get-or-create idempotency, participant-pair ordering,
  unauthorized-access rejection
- `MessageService` — send text, send attachment, empty-message rejection, mark read,
  unread count

### Feature Tests (Controllers, full HTTP round-trip)

- Auth endpoints — register → verify → login → refresh → logout, forgot/reset password
- User endpoints — profile view/update, avatar upload, search by skill/location
- Skill endpoints — Admin CRUD, non-admin rejection
- Skill request endpoints — full lifecycle (create → accept → complete → review),
  and full rejection/cancellation/expiry branches
- Review endpoints — create, duplicate rejection, list by user
- Notification endpoints — list, mark read, real-time broadcast fired on request events
- Conversation/message endpoints — conversation auto-created on skill request creation,
  send/receive text and attachments, non-participant access rejected, real-time
  broadcast fired on new message, unread counts update correctly

All integration tests run against Testcontainers Postgres + Redis, never a mocked DB.

---

## DEPLOYMENT

### Local Development

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: skillswap
      POSTGRES_USER: skillswap
      POSTGRES_PASSWORD: skillswap_password
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  mailhog:
    image: mailhog/mailhog
    ports: ["1025:1025", "8025:8025"]

  reverb:
    build: ./server
    command: php artisan reverb:start
    ports: ["8080:8080"]
    depends_on: [postgres, redis]

  server:
    build: ./server
    ports: ["8000:8000"]
    environment:
      DB_CONNECTION: pgsql
      DB_HOST: postgres
      DB_DATABASE: skillswap
      DB_USERNAME: skillswap
      DB_PASSWORD: skillswap_password
      REDIS_HOST: redis
      MAIL_HOST: mailhog
      MAIL_PORT: 1025
      CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME}
      CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY}
      CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET}
    depends_on: [postgres, redis, mailhog]

  client:
    build: ./client
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000/api/v1
      NEXT_PUBLIC_REVERB_HOST: localhost
      NEXT_PUBLIC_REVERB_PORT: 8080
    depends_on: [server]
```

### Production

- Client → Vercel (env vars point to production API + Reverb host)
- Server → Render/Fly.io (Laravel + queue worker + scheduler as separate processes)
- Reverb → same host as the server or a small dedicated instance behind a WSS proxy
- Database → managed Postgres (Render Postgres or Neon), automated backups enabled
- File storage → Cloudinary (free tier covers avatar uploads comfortably; no AWS
  account required)
- Mail → Resend (simple API, generous free tier, no AWS account required)

---

## DEVELOPMENT RULES

1. Quality over quantity — one clean, tested feature beats ten broken ones
2. Controllers route, Services decide, Repositories query — never cross layers
3. No business logic in Controllers — throw exceptions up
4. Global exception handler — no try/catch in Controllers
5. Shared logic in `app/Services/` or `app/Helpers/` — never duplicated
6. Validation in Form Requests — never in Controllers
7. Auth, rate limiting, and CORS locked from Sprint 0
8. Client is UI only — no business logic, no rule checks, no rating math
9. Write tests for all critical flows before moving to the next sprint task
10. Commit after every completed task — small, frequent, descriptive commits
11. Soft-delete users — never hard delete
12. All migrations reversible — `down()` always defined
13. Env vars validated at boot — app refuses to start with missing required config
14. API versioned under `/api/v1/` from day one
15. State transitions on `SkillRequest` go through an explicit allow-list in
    `SkillRequestService`, never a bare `->update(['status' => $anything])`

---

## SPRINT ROADMAP — 10 Sprints (5 Months)

Extended from the original 8-sprint plan to give Messaging (Phase 4) its own two
sprints — real one-to-one chat with attachments and real-time delivery is genuinely
more work than a single sprint can absorb without squeezing quality elsewhere, and
"quality over quantity" is rule #1 for a reason.

### Phase 1 — Foundation (Sprints 0–1)

| Sprint | Weeks | Deliverable                                                                                                                                                                                           |
| ------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0      | 1–2   | Monorepo scaffold, Laravel + Next.js setup, Docker Compose, base migrations, Sanctum auth skeleton, CORS config, global exception handler, `config/skillswap.php` boot-time validation                |
| 1      | 3–4   | Auth: register, login, logout, refresh, email verification, password reset, user profile CRUD, avatar upload, GitHub Actions CI (`.github/workflows/ci.yml`) — added once RegisterTest/LoginTest pass |

### Phase 2 — Core Features (Sprints 2–3)

| Sprint | Weeks | Deliverable                                                                                                                         |
| ------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 2      | 5–6   | Skill taxonomy (Admin CRUD), user skills add/update/remove, search users by skill/category/location, seed initial skill list        |
| 3      | 7–8   | Skill requests: create, accept, reject, cancel, complete, list (incoming/outgoing), state-machine enforcement, expiry scheduled job |

### Phase 3 — Messaging (Sprints 4–5)

| Sprint | Weeks | Deliverable                                                                                                                                                                    |
| ------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 4      | 9–10  | Conversations + text messages: get-or-create conversation on `SkillRequestCreated`, send/list messages (cursor-paginated), real-time delivery via Reverb, read/unread tracking |
| 5      | 11–12 | Attachments: signed Cloudinary upload for chat images/files, size/MIME validation, unread counts (cached), conversation list sorted by recency                                 |

### Phase 4 — Reviews & Notifications (Sprints 6–7)

| Sprint | Weeks | Deliverable                                                                                                                                  |
| ------ | ----- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 6      | 13–14 | Reviews: create, list, duplicate/pre-completion rejection, cached average rating on profiles                                                 |
| 7      | 15–16 | Notifications: creation on request/review/message events, mark read, list, real-time push via Laravel Reverb, session reminder scheduled job |

### Phase 5 — Client & Polish (Sprints 8–9)

| Sprint | Weeks | Deliverable                                                                                                                           |
| ------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 8      | 17–18 | Next.js pages: landing, auth flows, dashboard, profile, skill browse/detail, request flows, chat UI (conversation list + thread view) |
| 9      | 19–20 | Polish: responsive design, loading/error states, form validation, pagination, Admin dashboard, deployment to production               |

---

## DESIGN DECISIONS & CLARIFIED GAPS

The original brief had several soft spots. Each is resolved here so nothing is
reinterpreted silently later in development.

**D1 — Does email verification block login or just block actions?**
Resolved: login is allowed pre-verification (reduces onboarding drop-off), but sending
or accepting a skill request requires `email_verified_at` to be set. Enforced in
`SkillRequestService`, not just hidden in the UI.

**D2 — "JWT" via Sanctum?**
The original brief listed "Laravel Sanctum (JWT)" — these are not the same thing.
Sanctum issues opaque, revocable API tokens stored hashed in the database; it does not
issue self-contained JWTs. Resolved: use Sanctum's native token model, not a hand-rolled
JWT layered on top — simpler, and revocation actually works (a real JWT can't be
invalidated before expiry without an extra blacklist layer, which Sanctum already
avoids by design).

**D3 — "Real-time notifications" — how, exactly?**
The original brief said "WebSocket/SSE" without picking one. Resolved: Laravel Reverb
(first-party, self-hosted, integrates directly with Laravel's broadcasting system and
Next.js via Laravel Echo) is the single implementation — not an either/or left to be
decided mid-sprint.

**D4 — Teacher/Learner as separate actors vs. roles.**
The original brief listed "Teacher" and "Learner" as distinct rows in an actor table
alongside "User," implying separate account types. There is no registration flow that
would justify that — anyone can list a skill to teach or to learn from the same
profile. Resolved: single `User` model; Teacher/Learner are contextual roles on a given
`SkillRequest`, not account types. This removes an entire (unnecessary) parallel
onboarding flow from the roadmap.

**D5 — What actually happens "during" a session?**
The original brief never specified where/how the learning session itself takes place.
Resolved for MVP: SKILLSWAP does not host video or in-person logistics. The `message`
field on a `SkillRequest` is where participants agree on a meeting method (a video
link, an address, a phone call) — this is explicitly out of scope for structured data
in the MVP and called out as a Phase 7 candidate (in-app video/calendar integration).

**D6 — What stops a `SkillRequest` from sitting in `pending` forever?**
Not addressed in the original brief. Resolved: `expires_at` set on creation
(`request_expiry_hours`, default 72h), enforced by a scheduled job
(`ExpireStaleSkillRequestsJob`) that transitions stale `pending` requests to `expired`
and notifies both parties.

**D7 — Can both participants review each other, and what stops double-reviewing or
self-reviewing?**
The original brief's `reviews` table only had a single `reviewer_id`, with no
`reviewee_id` — meaning "who is being reviewed" was never actually recoverable from the
schema without inferring it from the parent request, which breaks once a request has
two possible reviewees. Resolved: added an explicit `reviewee_id` column, a unique
constraint on `(skill_request_id, reviewer_id)` to cap one review per person per
request, and a `REQUEST_NOT_COMPLETED` check enforced in `ReviewService` before any
review is accepted.

**D8 — Average rating storage.**
Not addressed in the original brief. Resolved: computed from `reviews`, not stored as a
mutable column on `users` (which risks drifting from the source rows on partial
failures); cached in Redis with a short TTL for read performance.

**D9 — Location search.**
The original brief mentioned "location preferences" in the pitch but never added
latitude/longitude fields or a radius-search endpoint. Resolved: added `latitude` /
`longitude` to `users`, plus a `radius_km` parameter on `GET /users/search`.

**D10 — Admin's actual responsibilities.**
The original brief listed Admin as an actor with no defined permissions anywhere else
in the document. Resolved: Admin manages the skill taxonomy, suspends/unsuspends
users, and moderates (hides) reviews — reflected in a dedicated `/api/v1/admin/*`
route group and `EnsureUserIsAdmin` middleware.

**D11 — Soft-deleted / suspended users inside other people's history.**
Not addressed in the original brief. Resolved: `SkillRequest` and `Review` rows are
never cascade-deleted when a user is soft-deleted or suspended; the other participant
still sees their history, with the removed user rendered as "Deleted User" in the UI.

**D12 — How do two matched users actually coordinate a session?**
The original brief said the session happens "in person or via an external video call
link" but never specified how that link — or any coordination at all — actually
reaches the other person. There was no messaging system in the original design, only
a single one-way `message` field the learner fills in once when first sending a
request. That's a real gap: the teacher would have no way to reply, ask a clarifying
question, or send a meeting link back. Resolved: a private one-to-one `Conversation`
is automatically unlocked between two users the first time a `SkillRequest` exists
between them (either direction), independent of that request's outcome — chat
persists even if the request is later rejected, expired, or completed, so two people
who've connected once can keep coordinating future sessions without re-triggering a
new request first. Chat is gated behind having exchanged a request specifically to
avoid turning the platform into an open inbox where any user can cold-message any
teacher — see also the Known Gaps entry on moderation/blocking, which is deferred
rather than solved, not ignored.

**D13 — Why not reuse an existing separate chat backend?**
A working Node/Express real-time chat service (own auth, own Postgres schema, own
Socket.IO layer) was considered and deliberately not integrated as a second service.
Bolting it on would mean two authentication systems that don't recognize each other's
tokens, two `users` tables that could drift out of sync, and two deployments to run
and pay for — real infrastructure cost for one feature, not a shortcut. The
architecture that made that project good (Controller → Service → Repository, typed
exceptions + a global handler, HTTP-persists/WebSocket-delivers) is a pattern, not a
codebase — it was ported into `ConversationService`/`MessageService` inside the
existing Laravel app instead, reusing the Sanctum auth, Postgres database, and Reverb
WebSocket layer SkillSwap already has, rather than duplicating all three.

---

## KNOWN GAPS — TO BE RESOLVED IN THEIR RESPECTIVE SPRINTS

These items are intentionally deferred so nothing gets forgotten during sprint planning.

### Gap 1 — Deleting a Skill That's In Active Use (Sprint 2)

`DELETE /skills/{id}` needs a defined behavior when `UserSkill` or `SkillRequest` rows
reference it. During Sprint 2, decide between: (a) soft-delete the skill and keep it
visible only on existing references, or (b) hard-block deletion while references exist
and require Admin to reassign/merge first. Default assumption going in: block deletion
(409) if any `user_skills` or non-terminal `skill_requests` reference it.

### Gap 2 — Matching Algorithm Scoring Weights (Phase 7 / Post-MVP)

The future "smart matching" feature needs concrete weights for skill overlap vs.
location proximity vs. rating. Not specified yet — defer full design until Phase 7
kicks off, after there's real usage data to tune against.

### Gap 3 — Timezone Handling for `proposed_at` (Sprint 3)

`proposed_at` is stored in UTC with the learner's `timezone` captured separately, but
the exact UI behavior for a teacher in a different timezone (auto-convert vs. show
both) needs to be nailed down when the request-creation form is built in Sprint 3.

### Gap 4 — Rate Limiting Reviews Without Blocking Legitimate Multi-Session Users

(Sprint 6)

A user who has many completed sessions in a short window could hit the review rate
limit legitimately. During Sprint 6, confirm whether the 10/min cap on
`POST /reviews/{id}` needs a higher per-day ceiling instead, once real usage patterns
are visible.

### Gap 5 — Laravel Reverb Horizontal Scaling (Sprint 4)

Reverb's default setup is single-process. Messaging (Sprint 4) is the first feature to
put real concurrent-connection load on Reverb — heavier than the notification-only use
case it was originally scoped for. If concurrent connections grow beyond what one
instance handles, document the Redis pub/sub scaling configuration during Sprint 4
rather than assuming single-instance is sufficient indefinitely.

### Gap 6 — Chat Moderation, Blocking, and Reporting (Phase 7 / Post-MVP)

MVP chat has no way for a user to block another participant or report an abusive
message/attachment — Admin can only see conversations by direct database access, not
through any admin UI. Since chat is gated behind an actual skill request (not an open
inbox), the abuse surface is smaller than a general chat app, but it isn't zero.
Deferred deliberately rather than solved: a real "report conversation" flow with
Admin visibility is a reasonable Phase 7 addition once there's real usage to gauge
actual need against.
