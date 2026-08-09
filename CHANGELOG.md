# Changelog

Notable changes to CRM. Format loosely follows [Keep a Changelog](https://keepachangelog.com);
versions follow [semantic versioning](https://semver.org). While the project is pre-1.0, minor
versions may contain breaking changes — those are always listed first.

## [Unreleased]

## [0.1.1] — 2026-08-09

### Fixed

- **The npm package could not run.** `bin` pointed at `src/cli/main.ts`, and Node refuses to
  strip types for files under `node_modules` — so `npx @anosf/crm mcp`, the package's whole
  purpose, failed with `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`. Publishing now ships
  compiled JavaScript in `dist/`. Running from a clone still executes the TypeScript directly.
- The published tarball omitted `public/`, so a server started from an npm install had no web
  UI. The build now produces the browser bundle and the tarball includes it.

## [0.1.0] — 2026-08-09

First release. A self-hosted CRM whose API is the primary surface rather than an afterthought:
REST, MCP, and a CLI all call one service layer, so agents and people share the same
permission model, the same validation, and the same reversible audit trail.

### Records and workflow

- Contacts, companies, deals, activities, and tasks, each with a free-form `properties` object
  so custom data never needs a schema migration
- Configurable pipelines with a real stage/status state machine — moving a deal updates the
  stage, the won/lost status, the close timestamp, and the timeline atomically
- Timelines that record who logged what, including which agent
- Tags, saved views, and cursor-paginated lists with filter operators and sorting
- Full-text search across every record type (SQLite FTS5)
- Dashboard metrics and a work queue: overdue tasks, deals that have gone quiet, and contacts
  nobody has ever contacted
- CSV import with a column-mapping step — columns are matched automatically against the
  headings other tools emit, every guess is overridable, and unmapped columns can be kept as
  custom fields rather than discarded. CSV export follows the cursor rather than stopping at
  the loaded page.

### For agents

- `GET /api/v1/discover` — a machine-readable capability map, plus `/llms.txt` and an
  OpenAPI 3.1 document generated from the same Zod schemas the server validates with
- `Idempotency-Key` on writes; the same key with a different body is rejected rather than
  silently replayed
- `GET /{type}/{id}/context` — record, tags, relations, timeline, and open tasks in one call
- `If-Match: <version>` for optimistic concurrency
- Structured errors carrying a `hint` written for the caller; unknown fields are rejected with
  the list of accepted ones
- Bulk create, up to 200 records in one transaction, all-or-nothing or with per-row errors
- MCP server over stdio and streamable HTTP: 24 tools, 4 resources, 3 prompts. Tool calls
  execute through the same HTTP stack as REST, so authentication, validation, idempotency, and
  auditing are identical by construction
- Scoped API tokens with a per-token audit trail and one-call revert of any change

### Operations

- `GET /api/v1/system/selfcheck` — schema, integrity, search index, domain invariant, and
  configuration checks; every non-passing check carries a remedy, and `POST …?repair=true`
  fixes what it safely can
- `crm backup` — consistent, compacted, integrity-verified snapshot taken while the server is
  running
- Outbound webhooks with HMAC-signed payloads and delivery history
- Docker image running as a non-root user with a health check, and a `docker compose` setup
- 161 tests through the real HTTP stack, a 35-assertion end-to-end smoke test against a
  running server, and a UI/API response contract suite

### Security

- API tokens can never exceed the role of the user who minted them, and they do not outlive
  that account: deleting or disabling a user revokes the tokens they created, and a token
  whose creator is gone is refused rather than falling back to a default role
- Webhook destinations are restricted to `http(s)` and re-resolved before every delivery;
  loopback, RFC1918, link-local, CGNAT, and IPv4-mapped equivalents are refused and redirects
  are not followed, so a webhook cannot be turned into a port scanner or a route to cloud
  metadata
- No endpoint mutates state on a `GET`, and cookie-authenticated writes must declare a JSON
  content type, so nothing is reachable cross-site with a session cookie alone
- Passwords are hashed with scrypt; password attempts get their own tight rate-limit bucket,
  separate from the general request budget

[Unreleased]: https://github.com/anosf/crm/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/anosf/crm/releases/tag/v0.1.1
[0.1.0]: https://github.com/anosf/crm/releases/tag/v0.1.0
