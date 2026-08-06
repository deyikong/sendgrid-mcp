# Release Notes

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

### Notes

- Per-tool scope enforcement is **not** in this release. `MCP_OAUTH_REQUIRED_SCOPES`
  gates the `/mcp` endpoint as a whole — a token that gets in can call any of
  the 57 tools. `READ_ONLY=true` remains the real write-protection boundary.
- HTTP mode is fully backward-compatible with stdio — existing Claude Desktop
  and Claude Code configs need no changes.

## v1.0.4 — 2025

- Fix repository URL for provenance verification