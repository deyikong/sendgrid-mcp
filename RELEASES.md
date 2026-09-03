# Release Notes

## [1.3.0](https://github.com/deyikong/sendgrid-mcp/compare/sendgrid-mcp-v1.2.1...sendgrid-mcp-v1.3.0) (2026-09-03)


### Features

* add MCP structuredContent/outputSchema to object-returning tools ([4506742](https://github.com/deyikong/sendgrid-mcp/commit/450674240396f7eb8e2274f4e8953866611c738a))
* add MCPB bundle build for Smithery/Claude Desktop distribution ([969fa8e](https://github.com/deyikong/sendgrid-mcp/commit/969fa8e93a0fde923a4b2516722a2f88769ff972))


### Bug Fixes

* read MCP_SERVER_VERSION from package.json instead of a hardcoded default ([7c8b6e2](https://github.com/deyikong/sendgrid-mcp/commit/7c8b6e20059b2b563476d1a5014d0ce07242c7d4))
* resolve @anthropic-ai/mcpb's dependency tree through the public npm registry ([5687436](https://github.com/deyikong/sendgrid-mcp/commit/5687436d7b9e5421b005702ba59fb0367b50e9cd))

## [1.2.1](https://github.com/deyikong/sendgrid-mcp/compare/sendgrid-mcp-v1.2.0...sendgrid-mcp-v1.2.1) (2026-08-26)


### Bug Fixes

* correct version extraction in the MCP registry publish workflow ([b64f8db](https://github.com/deyikong/sendgrid-mcp/commit/b64f8dbd2fb5fd670bca1fb614aef7efd567324b))
* match release-please's changelog heading format in docs test ([a2d49d5](https://github.com/deyikong/sendgrid-mcp/commit/a2d49d52a9d7f724791f7aad60c7e09b5b255104))
* migrate to zod v4 ([e3e3873](https://github.com/deyikong/sendgrid-mcp/commit/e3e3873f4966b95e70d02649e419d58649a09291))
* resolve zod's lockfile entry through the public npm registry ([1205e4c](https://github.com/deyikong/sendgrid-mcp/commit/1205e4c270c2e4838ef0bc5048599ae10bc4a5c3))

## [1.2.0](https://github.com/deyikong/sendgrid-mcp/compare/sendgrid-mcp-v1.1.2...sendgrid-mcp-v1.2.0) (2026-08-26)


### Features

* publish server metadata to the MCP registry via OIDC ([c7203c9](https://github.com/deyikong/sendgrid-mcp/commit/c7203c9be7f4c548082f6604458344eb60601253))

## v1.1.2 — 2026-08-25

Four more `contacts` tool bugs, found by auditing every tool file against
SendGrid's public OpenAPI spec repo ([twilio/sendgrid-oai](https://github.com/twilio/sendgrid-oai))
rather than relying on the client author's original assumptions about each
endpoint.

### Fixed

- `update_custom_field` sent `PUT`; the spec only documents `PATCH` on
  `/v3/marketing/field_definitions/{id}`.
- `list_segments` hit the deprecated v1 Segments API (dead since December
  2022) instead of v2 (`/v3/marketing/segments/2.0`), which
  `update_segment`/`delete_segment` already used — segments created since
  the deprecation wouldn't show up.
- `list_contacts` sent `page_size`/`page_token` to `GET /v3/marketing/contacts`,
  which takes no parameters and only ever returns the 50 most recent
  contacts — SendGrid deprecated pagination on this endpoint entirely.
- `search_contacts` sent `page_size`/`page_token` in the body to
  `POST /v3/marketing/contacts/search`, which only documents a `query`
  field and caps results at 50 with no pagination.

`mail`, `misc`, and `templates` tools were also audited against their specs
and found correct. `automations` has no public OpenAPI spec to check against
(none of the 46 spec files in `twilio/sendgrid-oai` cover it), so its
endpoints remain unverified by this method.

## v1.1.1 — 2026-08-25

Bug fixes in the stats, contacts, and templates tools, plus a new request-building
test suite for the tool handlers that didn't have one.

### Fixed

- `get_stats_by_device_type` was hitting `/v3/clients/stats` (the client-type
  endpoint) instead of `/v3/devices/stats` — device and client type are
  separate SendGrid endpoints with separate metrics. The `sendgrid://stats/devices`
  resource had the same bug.
- Removed three filter parameters that SendGrid silently ignores because the
  underlying endpoints don't support them: `client_type` on
  `get_stats_by_client_type`, `device_type` on `get_stats_by_device_type`, and
  `state` on `get_stats_by_country` (geo stats only filters by `country`).
- Added `limit`/`offset` pagination to `get_stats_by_browser`,
  `get_stats_by_device_type`, `get_stats_by_country`, and
  `get_stats_by_mailbox_provider` — SendGrid paginates these at 500 results by
  default, which callers with high-volume accounts and day-level granularity
  could otherwise silently truncate.
- `delete_sender` called `DELETE /v3/verified_senders/{id}`, a different
  resource family than `list_senders`/`create_sender` (`/v3/marketing/senders`)
  — deleting a sender created via `create_sender` would hit the wrong
  endpoint/ID space. Now consistent across all three.
- `create_html_template` left an orphaned, empty template behind if the
  version-creation request itself failed (it already cleaned up correctly for
  a local invalid-`test_data` error, just not a real API failure). It now
  rolls back the template in both cases.
- Tool and resource descriptions for the stats endpoints now document each
  endpoint's actual (narrower) metric set — e.g. browser/device/client-type
  stats only return a subset of the fields `get_global_stats` and
  `get_stats_by_mailbox_provider` return.

### Added

- A `node:test` suite covering request building for the `automations`,
  `contacts`, `mail`, `misc`, `stats`, and `templates` tool handlers (87 new
  tests, on top of the existing transport/auth/env/campaigns suite), plus a
  dedicated test confirming the `READ_ONLY` write guard actually blocks writes
  by default.

## v1.1.0 — 2026-08-06

This release lets the server be reached from remote MCP clients (Claude custom
connectors, OpenAI Responses API / Apps SDK) over the new Streamable HTTP
transport, and adds the security primitives required to do so safely.

### Added

- **Streamable HTTP transport** (`MCP_TRANSPORT=http`). The stdio transport is
  unchanged and remains the default. HTTP mode serves `POST /mcp` and
  `GET /health`, and runs **statelessly** — fresh server and transport per
  request, torn down on response close — which is what hosted clients expect.
- **OAuth 2.1 resource-server authentication** (`MCP_AUTH_MODE=oauth`). Verifies
  access tokens minted by an external identity provider against its published
  JWKS, checking signature, issuer, audience, expiry, and the RFC 8707 resource
  indicator. The server never issues or stores credentials.
- **RFC 9728 Protected Resource Metadata** at
  `/.well-known/oauth-protected-resource`, so clients can auto-discover the
  configured authorization server from a `401`'s `WWW-Authenticate` header.
- **Pluggable auth modes**: `oauth` (recommended for production), `token`
  (shared secret, replaces the previous `MCP_AUTH_TOKEN`-only behavior), and
  `none` (loopback development only).
- **In-process TLS** via `TLS_KEY_FILE`/`TLS_CERT_FILE`, with optional
  `TLS_CA_FILE` for intermediate chains. TLS 1.2 is the enforced minimum.
- **Proxy-friendly mode** via `TRUST_PROXY=true` + `MCP_PUBLIC_URL`, for
  deployments where TLS is terminated by a load balancer or reverse proxy.
- **Startup-time configuration validation**. The server refuses to boot on
  combinations that would quietly expose the SendGrid account — plaintext on a
  non-loopback bind, `auth=none` off loopback, a non-loopback `http://` public
  URL, a missing or under-length static token, OAuth without issuer and
  audience, or a half-set TLS pair.
- **MCP Market listing**: a hosted, one-click deploy of this server at
  [MCP Market](https://app.mcpmarket.com/deyikong/mcp/sendgrid), for users who
  don't want to install or run it themselves.
- **Test suite** covering the new transport end-to-end: the full OAuth token
  matrix (valid, expired, wrong issuer/audience/signature, missing scope),
  RFC 9728 metadata, every environment-validation rule, `startHttpTransport()`
  itself (not just `buildApp()` in isolation) across token/none auth modes,
  `GET /health`, the 404/500 handlers, DNS-rebinding protection, the
  4MB request-body limit, and the `MCP_PUBLIC_URL`-only fallback for both
  `publicOrigin()` and `resourceIdentifier()`. Plus a README/docs consistency
  suite that checks the README's tool count, version callout, and Tools
  Summary entries against the live tool and prompt registries.

### Changed

- `MCP_AUTH_MODE` defaults to `token`, preserving the previous behavior — but
  `MCP_AUTH_TOKEN` is now required to be at least 16 characters; deployments
  with a shorter token must regenerate it.
- The HTTP layer moves from `node:http` to Express so it can use the SDK's
  `requireBearerAuth` middleware. Endpoint behavior and stateless handling are
  unchanged.
- Bumped `@modelcontextprotocol/sdk` to `^1.30.0` (no source changes required;
  the `McpServer` + `registerTool`/`registerResource`/`registerPrompt` API is
  still current). The server now reports protocol version `2025-06-18`.
- Restructured the README into a linear, top-to-bottom setup flow (install →
  API key → client configuration), added a categorized "Available Tools"
  reference with worked examples per category, and added concrete OAuth setup
  walkthroughs for Auth0, Okta, and Microsoft Entra ID.
- **Raised the minimum Node version to 20** (from 18). `jose` v6, used for
  OAuth JWT verification, requires the global Web Crypto API, which isn't
  available on Node 18. Node 18 has also been end-of-life since April 2025.
  This only matters if you're running HTTP/OAuth mode on Node 18; stdio-only
  usage never reached the affected code path.
- The `/mcp` route now runs auth (`requireBearerAuth`) **before**
  `express.json()` body parsing, so an unauthenticated request can no longer
  trigger a body read. Applied via GitHub Copilot Autofix after a code-scan
  finding.
- Added a startup-validation rule: `TRUST_PROXY=true` with
  `MCP_AUTH_MODE=oauth` now requires `MCP_PUBLIC_URL` to be set, so OAuth
  discovery URLs are guaranteed externally reachable. Also via Copilot
  Autofix.

### Fixed

- `list_single_sends` was hitting a nonexistent `/search` endpoint; it now
  calls the documented `GET /v3/marketing/singlesends` collection endpoint and
  supports a `page_token` for pagination.
- Added the missing `get_single_send` tool for retrieving a single send
  campaign's content and settings — bringing the total tool count to 58.

### Notes

- Per-tool scope enforcement is **not** in this release. `MCP_OAUTH_REQUIRED_SCOPES`
  gates the `/mcp` endpoint as a whole — a token that gets in can call any of
  the 58 tools. `READ_ONLY=true` remains the real write-protection boundary.
- HTTP mode is fully backward-compatible with stdio — existing Claude Desktop
  and Claude Code configs need no changes.

## v1.0.4 — 2026-02-24

- Fixed the `repository`, `bugs`, and `homepage` URLs in `package.json` to
  point at the `deyikong` GitHub org (they previously pointed at a stale
  `dkong` org), which npm's provenance attestation checks against.

## v1.0.3 — 2026-02-24

- Fixed the `bin` path in `package.json` so the globally-installed
  `sendgrid-mcp` command resolves correctly.

## v1.0.2 — 2026-02-24

- Committed `package-lock.json` (previously gitignored) and fixed the
  `NODE_AUTH_TOKEN` → `NPM_TOKEN` mismatch in the GitHub Actions workflow, so
  `npm ci` and automated npm publishing on release actually work.
- Added a `LICENSE` file and filled in npm registry metadata: description,
  keywords, `author`, `repository`, `bugs`, `homepage`, and an `engines` field
  requiring Node 18+.

## v1.0.1 — 2025-08-26

- Added Dynamic Template Management: create/list/get/update/delete templates
  and versions, plus the AI-optimized `create_html_template` for creating a
  template and its first version in one call.
- Added Email Statistics & Analytics: global stats, and breakdowns by
  browser, device, client type, country, and mailbox provider.
- Expanded Contact Management: list/custom-field/segment CRUD operations
  alongside the original contact CRUD tools.
- Added `READ_ONLY` mode (defaults to `true`), blocking mutating operations
  at runtime while keeping every tool registered and visible.
- Added help prompts covering the newly added tool categories.

## v1.0.0 — 2025-08-20

- Initial release: Marketing Automations, Single Send Campaigns, Contact
  Management, and Mail Sending tools, plus the corresponding MCP resources
  and help prompts.
