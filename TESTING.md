# Manual Testing: HTTP Transport & Auth Modes

The automated suite (`npm test`) covers this in depth already — see
`tests/http.test.mjs`, `tests/auth.test.mjs`, and `tests/env.test.mjs`. This
doc is for manually verifying a **real client** can actually connect over
each mode, which the automated tests don't exercise (they talk to the server
directly, not through a client like Claude Code or MCP Inspector).

`SENDGRID_API_KEY` only needs to look valid (`SG.` + 20+ chars) to pass
startup validation — a dummy value is fine for testing the connection/auth
layer. Only actual tool calls (e.g. `list_automations`) would hit SendGrid
for real and fail with a dummy key, which is expected.

Build once first:

```bash
npm run build
```

## 1. HTTP + token auth

```bash
export SENDGRID_API_KEY="SG.testtesttesttesttesttest"
export MCP_TRANSPORT=http
export MCP_AUTH_MODE=token
export MCP_AUTH_TOKEN=$(openssl rand -hex 32)
export MCP_HTTP_HOST=127.0.0.1
echo "Token: $MCP_AUTH_TOKEN"
node build/index.js
```

In another terminal:

```bash
curl -s http://127.0.0.1:3000/health

curl -s -X POST http://127.0.0.1:3000/mcp \
  -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl-test","version":"1"}}}'
# expect 200 with serverInfo

curl -i -X POST http://127.0.0.1:3000/mcp -H "Content-Type: application/json" -d '{}'
# expect 401, no token supplied
```

Real client — Claude Code CLI:

```bash
claude mcp add --transport http sendgrid-token-test http://127.0.0.1:3000/mcp --header "Authorization: Bearer $MCP_AUTH_TOKEN"
claude   # then run /mcp inside the session -- should show "connected"
claude mcp remove sendgrid-token-test   # cleanup
```

Real client — MCP Inspector (visual):

```bash
npx @modelcontextprotocol/inspector
# In the UI: Transport = Streamable HTTP, URL = http://127.0.0.1:3000/mcp
# Header: Authorization: Bearer <token>  -> Connect -> "List Tools" (expect 58)
```

## 2. HTTP + no auth (loopback dev)

```bash
export MCP_AUTH_MODE=none
unset MCP_AUTH_TOKEN
node build/index.js
```

```bash
curl -s -X POST http://127.0.0.1:3000/mcp \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl-test","version":"1"}}}'
# expect 200, no Authorization header needed

claude mcp add --transport http sendgrid-none-test http://127.0.0.1:3000/mcp
```

This mode only starts on a loopback bind — try `MCP_HTTP_HOST=0.0.0.0` and
confirm it **refuses to start**.

## 3. HTTP + TLS (in-process)

```bash
openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj "/CN=localhost" \
  -keyout /tmp/mcp-key.pem -out /tmp/mcp-cert.pem

export TLS_KEY_FILE=/tmp/mcp-key.pem
export TLS_CERT_FILE=/tmp/mcp-cert.pem
export MCP_AUTH_MODE=token
export MCP_AUTH_TOKEN=$(openssl rand -hex 32)
node build/index.js
```

```bash
curl -sk -X POST https://127.0.0.1:3000/mcp \
  -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl-test","version":"1"}}}'
# -k skips cert verification since it's self-signed -- fine for this smoke test
```

Claude Code CLI will reject the self-signed cert by default. Either use
[mkcert](https://github.com/FiloSottile/mkcert) to get a locally-trusted cert
(`mkcert localhost`, then point `TLS_KEY_FILE`/`TLS_CERT_FILE` at its output),
or, **for local testing only**, bypass verification:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 claude mcp add --transport http sendgrid-tls-test https://127.0.0.1:3000/mcp --header "Authorization: Bearer $MCP_AUTH_TOKEN"
```

## 4. HTTP + OAuth

Easiest realistic path: create a free Auth0 API per the README's
[Auth0 walkthrough](README.md#1-install-the-server), then use Auth0's own
**API → Test tab**, which hands you a ready-made `curl` command to fetch a
real access token via client-credentials — no app/redirect config needed.

```bash
export MCP_AUTH_MODE=oauth
export MCP_OAUTH_ISSUER="https://YOUR_TENANT.auth0.com/"
export MCP_OAUTH_AUDIENCE="https://mcp.example.com"   # must match the Auth0 API Identifier exactly
export MCP_OAUTH_REQUIRED_SCOPES="sendgrid:read"
export MCP_PUBLIC_URL="http://127.0.0.1:3000"          # loopback, so no TLS required
node build/index.js
```

```bash
curl -s http://127.0.0.1:3000/.well-known/oauth-protected-resource
# expect resource/authorization_servers/scopes_supported

curl -i -X POST http://127.0.0.1:3000/mcp -H "Content-Type: application/json" -d '{}'
# expect 401 with a WWW-Authenticate header pointing at the discovery doc above

# Paste the access_token from Auth0's Test tab curl command here:
export TOKEN="paste_access_token"
curl -s -X POST http://127.0.0.1:3000/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl-test","version":"1"}}}'
# expect 200
```

For the full interactive login flow (closer to real usage), `claude mcp add`
supports it directly via `--client-id`/`--client-secret`/`--callback-port` —
but it needs an Auth0 Application configured for a loopback redirect URI,
which is easiest to set up by following Auth0's own quickstart for your
application type. The curl test above already exercises 100% of this
server's real OAuth verification code (signature, issuer, audience, expiry,
scope) against a real IdP-issued token, which is the part that actually
changed in this branch.

## 5. Bonus: DNS-rebinding protection (`MCP_ALLOWED_HOSTS`)

```bash
export MCP_AUTH_MODE=none
export MCP_ALLOWED_HOSTS="127.0.0.1:3000"
node build/index.js
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:3000/mcp \
  -H "Host: evil.example" -H "Content-Type: application/json" -d '{}'
# expect 403
```
