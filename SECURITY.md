# Security Policy

This project is an independent, solo-maintained MCP server for the SendGrid
API — it is **not** an official SendGrid or Twilio product, and there is no
dedicated security team behind it. That said, this server handles a
`SENDGRID_API_KEY` with real send/contact/billing-adjacent permissions, so
vulnerabilities here are taken seriously.

## Reporting a vulnerability

Please report security vulnerabilities privately using GitHub's built-in
reporting flow rather than opening a public issue:

1. Go to the [Security tab](https://github.com/deyikong/sendgrid-mcp/security) of this repository.
2. Click **"Report a vulnerability"**.
3. Describe the issue, including reproduction steps and impact if known.

This opens a private advisory visible only to you and the maintainer, so the
issue isn't disclosed before a fix ships.

If you're unable to use that flow for any reason, open a regular GitHub issue
with as few technical details as possible and ask to be contacted privately;
a maintainer will follow up.

## What's in scope

- The MCP server code in this repository (tool handlers, the stdio and
  Streamable HTTP transports, OAuth 2.1 resource-server auth, TLS handling).
- Ways a malicious or compromised MCP client could exploit this server, or a
  malicious server response could exploit a client, when running as
  documented.

## What's out of scope

- Vulnerabilities in SendGrid's own API or web application — report those to
  [Twilio/SendGrid directly](https://www.twilio.com/en-us/company/legal/vulnerability-disclosure-policy).
- Vulnerabilities in `@modelcontextprotocol/sdk`, Express, or other
  dependencies — please report those upstream. If a dependency vulnerability
  affects this server specifically (e.g. it's reachable through a tool call),
  a report here is still welcome so this project can pin/patch around it.
- Issues that require an attacker to already have your `SENDGRID_API_KEY` or
  shell access to the machine running this server.

## Response expectations

This is maintained on a best-effort, spare-time basis. There's no SLA, but
valid reports will get a response and, for confirmed issues, a fix and a
patch release documented in [RELEASES.md](./RELEASES.md).

## Supported versions

Only the latest published version on npm receives security fixes. Please
upgrade before reporting if you're on an older version — the issue may
already be fixed.
