import assert from "node:assert/strict";
import test from "node:test";
import { createServer as createHttpServer } from "node:http";
import { createServer as createHttpsServer, request as httpsRequest } from "node:https";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { generateKeyPairSync } from "node:crypto";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

const here = new URL(".", import.meta.url);
const root = new URL("..", here);

/**
 * Spin up a tiny in-process IdP: serves a JWKS and mints tokens with
 * overridable claims. Bound to a random port on 127.0.0.1; resolved via the
 * returned URL object.
 */
async function startFakeIdp() {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = await exportJWK(publicKey);
  jwk.kid = "test-key-1";
  jwk.alg = "RS256";
  jwk.use = "sig";

  const { privateKey: wrongKey } = await generateKeyPair("RS256");

  const server = createHttpServer((req, res) => {
    if (req.url === "/.well-known/jwks.json") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ keys: [jwk] }));
    }
    res.writeHead(404).end();
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  // Fix the port into the URL the server will be told is the issuer, so the
  // MCP server's metadata echoes back the same IdP URL we set up.
  const issuer = `http://127.0.0.1:${port}`;
  // Save the bound port for tests that need to know it; it has to round-trip
  // through the URL the server reads from process.env.

  /**
   * Mint a token signed with the configured private key.
   *
   * The `overrides` argument accepts partial claim overrides so individual
   * tests can produce tokens that fail verification in a specific way.
   */
  async function mint(overrides = {}) {
    const {
      issuer: iss = issuer,
      audience = `https://mcp.test`,
      scope = "sendgrid:read",
      expOffset = 3600,
      key = privateKey,
      ...extra
    } = overrides;
    return await new SignJWT({ scope, ...extra })
      .setProtectedHeader({ alg: "RS256", kid: "test-key-1" })
      .setIssuer(iss)
      .setAudience(audience)
      .setSubject("user-1")
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + expOffset)
      .sign(key);
  }

  return {
    issuer,
    jwksUri: `${issuer}/.well-known/jwks.json`,
    audience: "https://mcp.test",
    wrongPrivateKey: wrongKey,
    mint,
    close: () => new Promise((r) => server.close(r)),
  };
}

/**
 * Generate a throwaway self-signed cert for the HTTPS transport. Lives in
 * /tmp so the test fixtures don't pollute the repo.
 */
function makeSelfSignedCert() {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const keyPem = privateKey.export({ format: "pem", type: "pkcs8" });
  const keyFile = `${tmpdir()}/sendgrid-mcp-test-${process.pid}-${Date.now()}.key`;
  const certFile = `${tmpdir()}/sendgrid-mcp-test-${process.pid}-${Date.now()}.crt`;
  writeFileSync(keyFile, keyPem);
  execFileSync(
    "openssl",
    [
      "req",
      "-x509",
      "-new",
      "-key", keyFile,
      "-out", certFile,
      "-days", "1",
      "-subj", "/CN=localhost",
    ],
    { stdio: "ignore" }
  );
  return { keyFile, certFile };
}

/**
 * Start the real Express app on HTTPS with OAuth mode configured against the
 * supplied fake IdP. Returns the listen URL plus a shutdown function.
 */
async function startAuthServer(idp) {
  const { keyFile, certFile } = makeSelfSignedCert();
  const tlsKey = await import("node:fs").then((fs) => fs.readFileSync(keyFile));
  const tlsCert = await import("node:fs").then((fs) => fs.readFileSync(certFile));

  process.env.SENDGRID_API_KEY = "SG.testtesttesttesttesttest";
  process.env.MCP_TRANSPORT = "http";
  process.env.MCP_AUTH_MODE = "oauth";
  process.env.MCP_OAUTH_ISSUER = idp.issuer;
  process.env.MCP_OAUTH_AUDIENCE = idp.audience;
  process.env.MCP_OAUTH_JWKS_URI = idp.jwksUri;
  process.env.MCP_OAUTH_REQUIRED_SCOPES = "sendgrid:read";
  process.env.MCP_PUBLIC_URL = idp.audience;
  process.env.TLS_KEY_FILE = keyFile;
  process.env.TLS_CERT_FILE = certFile;
  process.env.MCP_HTTP_HOST = "127.0.0.1";
  // PORT is intentionally left at its default (3000) so env validation
  // passes on import; we override at listen time with port 0.
  delete process.env.PORT;

  // Module caches survive between tests; the query string differs per call
  // so the ESM cache treats each import as a fresh module. http.js re-exports
  // parseFresh so we re-parse process.env (the cached `_env` from a prior
  // test would otherwise hold stale values).
  const root = new URL("..", new URL(".", import.meta.url));
  const httpAbs = new URL("./build/http.js", root).href;
  const { parseFresh, buildApp } = await import(httpAbs + `?t=${Date.now()}`);
  parseFresh();
  const app = buildApp();
  const httpsServer = createHttpsServer(
    { key: tlsKey, cert: tlsCert, minVersion: "TLSv1.2" },
    app
  );
  await new Promise((resolve) => httpsServer.listen(0, "127.0.0.1", resolve));
  const { port } = httpsServer.address();

  return {
    url: `https://127.0.0.1:${port}`,
    close: () => new Promise((r) => httpsServer.close(r)),
  };
}

const INIT = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } },
});

/**
 * Helper to POST an initialize request and capture both status and any
 * WWW-Authenticate header (which is what tells us the SDK distinguished
 * "missing token" from "bad token" from "missing scope").
 *
 * Uses the raw https module rather than fetch because Node's undici does not
 * trust self-signed certs without an explicit dispatcher; this is one less
 * moving part.
 */
function initialize(url, token, opts = {}) {
  const u = new URL(`${url}/mcp`);
  const headers = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
  if (token !== undefined) headers.Authorization = `Bearer ${token}`;

  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        method: "POST",
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        headers,
        // Trust the cert we just generated.
        rejectUnauthorized: false,
      },
      (res) => {
        // Drain the body so the socket can close cleanly.
        res.resume();
        res.on("end", () =>
          resolve({ status: res.statusCode, wwwAuthenticate: res.headers["www-authenticate"] })
        );
      }
    );
    req.on("error", reject);
    req.end(opts.body ?? INIT);
  });
}

function getJson(url, path) {
  const u = new URL(`${url}${path}`);
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      { method: "GET", hostname: u.hostname, port: u.port, path: u.pathname, rejectUnauthorized: false },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

test("OAuth resource server: token matrix", async (t) => {
  const idp = await startFakeIdp();
  const server = await startAuthServer(idp);
  t.after(() => Promise.all([idp.close(), server.close()]));

  const cases = [
    ["valid token",          () => idp.mint(),                              200],
    ["token with extra scope", () => idp.mint({ scope: "sendgrid:read sendgrid:write" }), 200],
    ["expired token",        () => idp.mint({ expOffset: -60 }),            401],
    ["wrong audience",       () => idp.mint({ audience: "https://other.example" }), 401],
    ["wrong issuer",         () => idp.mint({ issuer: "https://evil.example" }), 401],
    ["wrong signature",      () => idp.mint({ key: idp.wrongPrivateKey }),  401],
    ["token missing required scope",
      () => idp.mint({ scope: "sendgrid:write" }),                         403],
  ];

  for (const [label, makeToken, expected] of cases) {
    await t.test(label, async () => {
      const token = await makeToken();
      const { status } = await initialize(server.url, token);
      assert.equal(status, expected, `${label}: expected ${expected}, got ${status}`);
    });
  }

  await t.test("no Authorization header", async () => {
    const { status, wwwAuthenticate } = await initialize(server.url, undefined);
    assert.equal(status, 401);
    assert.match(wwwAuthenticate, /resource_metadata=/, "WWW-Authenticate must point at the metadata doc");
  });

  await t.test("malformed Authorization header", async () => {
    const { status } = await initialize(server.url, "not.a.jwt");
    assert.equal(status, 401);
  });
});

test("RFC 9728 Protected Resource Metadata is served and lists the issuer", async (t) => {
  const idp = await startFakeIdp();
  const server = await startAuthServer(idp);
  t.after(() => Promise.all([idp.close(), server.close()]));

  const { status, body } = await getJson(server.url, "/.well-known/oauth-protected-resource");
  assert.equal(status, 200);
  assert.equal(body.resource, idp.audience);
  assert.deepEqual(body.authorization_servers, [idp.issuer]);
  assert.deepEqual(body.bearer_methods_supported, ["header"]);
  assert.deepEqual(body.scopes_supported, ["sendgrid:read"]);
});

test("ExternalIdpTokenVerifier rejects when audience claim mismatches", async () => {
  const idp = await startFakeIdp();
  try {
    const { ExternalIdpTokenVerifier } = await import(
      new URL("../build/auth.js", import.meta.url).href + `?t=${Date.now()}`
    );
    const verifier = new ExternalIdpTokenVerifier(
      idp.issuer,
      "https://different-audience",
      idp.jwksUri
    );
    const token = await idp.mint(); // minted for idp.audience, not "https://different-audience"
    await assert.rejects(verifier.verifyAccessToken(token), /invalid|expired/i);
  } finally {
    await idp.close();
  }
});

test("StaticTokenVerifier matches with constant-time equality", async () => {
  process.env.SENDGRID_API_KEY = "SG.testtesttesttesttesttest";
  process.env.MCP_AUTH_MODE = "token";
  process.env.MCP_AUTH_TOKEN = "x".repeat(32);
  const envUrl = new URL("../build/shared/env.js", import.meta.url).href + `?t=${Date.now()}`;
  const { validateEnvironment } = await import(envUrl);
  validateEnvironment();

  const { StaticTokenVerifier } = await import(
    new URL("../build/auth.js", import.meta.url).href + `?t=${Date.now()}`
  );
  const verifier = new StaticTokenVerifier(process.env.MCP_AUTH_TOKEN);

  const ok = await verifier.verifyAccessToken(process.env.MCP_AUTH_TOKEN);
  assert.equal(ok.clientId, "static-token");
  assert.equal(typeof ok.expiresAt, "number", "AuthInfo must have a numeric expiresAt");

  await assert.rejects(
    verifier.verifyAccessToken(process.env.MCP_AUTH_TOKEN + "x"),
    /invalid/i
  );
  await assert.rejects(verifier.verifyAccessToken(""), /invalid/i);
});