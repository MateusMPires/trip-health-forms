# trip-health-forms

**A multi-tenant, privacy-first platform for collecting and managing sensitive traveler data — personal details, health records, and documents — for missionary trips, online and offline.**

Built as a portfolio piece by an **AI Product Engineer**: it pairs a production-grade product architecture (multi-tenant RLS, defense-in-depth, LGPD compliance) with a **codified engineering harness** that governs how an AI coding agent is allowed to build the system.

<p>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-App_Router-000000?logo=nextdotjs&logoColor=white">
  <img alt="Expo" src="https://img.shields.io/badge/Expo-React_Native-000020?logo=expo&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres_·_RLS-3FCF8E?logo=supabase&logoColor=white">
  <img alt="Turborepo" src="https://img.shields.io/badge/Turborepo-pnpm-EF4444?logo=turborepo&logoColor=white">
  <img alt="Zod" src="https://img.shields.io/badge/Zod-domain_contract-3E67B1">
</p>

---

## What this project demonstrates

This isn't a CRUD demo. The interesting engineering is in the **trust boundaries** and the **build discipline**:

- **Zero-trust public intake.** An anonymous web form *writes* sensitive data but can *never read* it — enforced at the database, not the app layer.
- **Defense in depth for file uploads.** The public client never touches the private storage bucket directly; a server-side Edge Function mints a single-object, short-lived signed upload URL and builds the storage path itself.
- **A single source of truth for the domain.** The "traveler" contract is defined once in Zod (`packages/core`) and reused by web and mobile — no schema drift.
- **LGPD by construction.** Consent gating, minor-guardian rules, and a hard "never log sensitive data" invariant are baked into the schema and the workflow, not bolted on.
- **An AI engineering harness.** The repo ships a machine-and-human-checkable *constitution* (`CLAUDE.md`) that constrains how the AI agent writes code — turning "AI-assisted" into "AI-governed."

---

## The product

Two surfaces over one Supabase backend:

| Surface | What it is | Who uses it | Access |
|---|---|---|---|
| **Web form** (`apps/web`) | Multi-step wizard to register a traveler: personal data, health block, documents, LGPD consent, and (for minors) guardian data. | Traveler / guardian | **Public link** with a 6-digit trip code — no account |
| **Mobile app** (`apps/mobile`) | Leaders log in and browse the travelers on their trips, fully **offline** (SQLite mirroring Supabase, pull-based `server-wins` sync). | Trip leaders | **Login** (Supabase Auth) |

> **Status:** the web intake form is fully implemented (7-step wizard, uploads, validation, consent). The mobile app is scaffolded and on the roadmap below — this README is explicit about what's built vs. planned.

---

## Architecture

```
        Anonymous traveler                       Authenticated leader
   ┌─────────────────────────┐              ┌─────────────────────────┐
   │   Web form (Next.js)     │              │  Mobile app (Expo/RN)    │
   │   public, no account     │              │  login · offline-first   │
   └───────────┬─────────────┘              └───────────┬─────────────┘
       write-only, via              pull sync (server-wins) → SQLite,
       SECURITY DEFINER RPC                 read via tenant-scoped RLS
               │                                        │
               ▼                                        ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │                            Supabase                               │
   │   Postgres + RLS  ·  Auth  ·  Storage (private buckets)           │
   │   Edge Function: request-upload-url (service role, path-safe)     │
   └──────────────────────────────────────────────────────────────────┘
                               ▲
                shared domain contract (one source of truth)
                ┌──────────────┴───────────────┐
                │ packages/core     (Zod schemas, rules, constants) │
                │ packages/supabase (generated DB types + client)   │
                └───────────────────────────────────────────────────┘
```

### Security & privacy model (the crown jewel)

Every design choice here answers a specific threat, and the enforcement lives **in the database**, so a bug in the client can't widen access:

- **Public form writes, but never reads.** There is no anon `SELECT` policy on `trips` or `travelers`. Submission goes through a `SECURITY DEFINER` RPC (`submit_traveler`) that validates the trip code and inserts the traveler + guardians + health record + consent + documents **atomically in one transaction**. To render the landing screen, a separate `get_trip_public` RPC returns **only the trip name** — never `organization_id` or `trip_id`, which the public form must not learn.
- **Uploads never trust the client.** The anon form has no Storage `INSERT` policy. Instead, the `request-upload-url` Edge Function runs with the service role, resolves the trip from the code server-side, **builds the object path itself** (client paths are ignored), sanitizes the filename, enforces per-kind MIME allowlists and a size cap, and returns a signed token scoped to exactly one object.
- **Multi-tenant isolation via RLS.** Every table is RLS-on from birth with explicit policies. RLS helper predicates (`is_trip_member`, `is_trip_admin`, `is_org_member`) are `SECURITY DEFINER` and granted narrowly to `authenticated`/`service_role`. A leader can only reach the trips they belong to; data never crosses organizations.
- **Consent is a precondition, not a checkbox.** Health data and minors' data cannot be persisted without a recorded LGPD consent — enforced inside the submission RPC.
- **Sensitive data is never logged.** A hard project invariant forbids sending health data, documents, or minors' personal data to logs, analytics, or crash reporting.
- **Defense in depth on validation.** Client-side checks are treated as *UX only*; the trusted gate (MIME, size, allowlists) is duplicated server-side in the Edge Function, with a pointer back to the `packages/core` source of truth.

### Shared domain contract

The traveler domain — personal data, health, documents, consent, guardian — is modeled **once** in `packages/core` as Zod schemas, then reused across surfaces:

- **Business rules live where they belong.** `isMinor(birthDate, reference)` is kept in code (not the DB) precisely because it depends on a non-immutable reference date; it returns `false` for an unknown birth date and lets the form infer minority from the presence of a guardian instead. Rules like this ship with unit tests.
- **Types flow from the database.** `packages/supabase` holds the generated `Database` types; after any migration the types are regenerated so the client, the RPC payloads, and the Zod contract stay aligned.

---

## The engineering harness

> This is the part most relevant to an **AI Product Engineer** role.

The repo doesn't just *use* an AI coding agent — it **governs** one. [`CLAUDE.md`](./CLAUDE.md) is a project constitution: a set of inviolable rules the agent must obey on every task, independent of the feature being built. It turns an open-ended assistant into a bounded, auditable contributor.

**Codified invariants (a sample):**
- Database is **English, `snake_case`, plural tables** — no exceptions.
- **Secrets only in `.env`**; the service-role key is server-side only and never reaches the client/app.
- **Schema changes only via versioned migrations** in `supabase/migrations/`; regenerate types + review RLS afterward.
- **RLS always on**; no table is ever exposed without an explicit policy.
- **Consent-before-persistence** and **never-log-sensitive-data** as first-class rules.
- **One domain contract** in `packages/core`; no duplicated validation between web and mobile.

**A machine-checkable definition of done.** Nothing is "done" until, in the affected package:

```bash
pnpm typecheck   # tsc --noEmit across the workspace
pnpm lint        # eslint / next lint
pnpm test        # Zod schemas, is_minor, guardian-required, sync logic
```

Deterministic logic (schemas, parsing, business rules like `is_minor` and guardian obligation) is covered by tests, so the harness — not vibes — decides whether a change is acceptable. Migrations follow a fixed loop: **write migration → regenerate types → review RLS on the new tables → only then move on.**

The result is a workflow where AI velocity is real but every change is fenced by invariants a reviewer (or the next agent) can rely on. **That governance layer — not just the feature code — is the portfolio artifact.**

---

## Tech stack

- **Monorepo:** Turborepo + pnpm workspaces (`pnpm` only)
- **Web:** Next.js (App Router) + TypeScript, React Hook Form + Zod
- **Mobile:** Expo + EAS, React Native, expo-router, SQLite (expo-sqlite / op-sqlite) — *scaffolded*
- **Backend:** Supabase — Postgres (RLS), Auth, Storage, Edge Functions (Deno)
- **Domain/validation:** Zod in `packages/core` (single source of truth)
- **Distribution:** EAS Build → TestFlight (iOS) + Firebase App Distribution (Android)

## Repository layout

```
trip-health-forms/
├── apps/
│   ├── web/          # Next.js — public traveler intake form  (built)
│   └── mobile/       # Expo — leaders' offline app            (scaffolded)
├── packages/
│   ├── core/         # shared domain: Zod schemas, rules, constants  (+ tests)
│   ├── supabase/     # generated DB types + browser client
│   ├── ui/           # shared design tokens (planned)
│   └── config/       # shared tsconfig / eslint (planned)
├── supabase/
│   ├── migrations/   # 16 versioned migrations: schema, RLS, RPCs, storage
│   └── functions/    # request-upload-url (Deno Edge Function)
├── CLAUDE.md         # the engineering harness / project constitution
├── turbo.json · pnpm-workspace.yaml
```

## Local development

```bash
pnpm install

# Web form (runs with just NEXT_PUBLIC_PREVIEW=true, no backend needed)
cp apps/web/.env.example apps/web/.env.local   # fill in Supabase URL + anon key
pnpm --filter web dev

# Full stack, all surfaces
pnpm dev
```

Environment variables are never committed — only `.env.example` files are tracked. `NEXT_PUBLIC_*` vars are inlined at build time and must be configured per environment (e.g. per Vercel scope).

## Roadmap

| Phase | Goal | Status |
|---|---|---|
| **0 — Foundation** | Monorepo scaffold, Supabase project, CI, EAS/Firebase | ✅ |
| **1 — Data model** | Schema, migrations, RLS, RPCs, generated types | ✅ |
| **2 — Web form** | Multi-step wizard, uploads, health block, consent, guardian | ✅ |
| **3 — App (online)** | Login, trip list, traveler list & detail | ⏳ |
| **4 — Offline** | SQLite schema, pull-based sync engine, file cache | ⏳ |
| **5 — Distribution** | EAS builds → TestFlight + Firebase App Distribution | ⏳ |
| **6 — Hardening** | LGPD/security review, retention & deletion policy | ⏳ |

---

## License

Private / portfolio use. The repository contains **no real personal data** — all sensitive records live only in the database, never in source control.
