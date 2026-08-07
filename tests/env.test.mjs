import assert from "node:assert/strict";
import test from "node:test";

/**
 * Environment-validation tests. Each test mutates process.env, then imports
 * the env module fresh (with a cache-busting query string) so the validation
 * runs against exactly the variables this test set up.
 *
 * No test sets TLS_KEY_FILE/TLS_CERT_FILE because the build emits into the
 * repo and we don't want to write certs there; the TLS-required-on-public-bind
 * rule is exercised indirectly via TRUST_PROXY=false + non-loopback.
 */

const BASE_ENV = { SENDGRID_API_KEY: "SG.testtesttesttesttesttest" };

async function withEnv(extra, fn) {
  const saved = { ...process.env };
  try {
    process.env = { ...saved, ...BASE_ENV, ...extra };
    // The env module caches the parsed result internally; importing with a
    // fresh query string forces it to re-parse.
    const mod = await import(
      new URL("../build/shared/env.js", import.meta.url).href + `?t=${Date.now()}-${Math.random()}`
    );
    return await fn(mod);
  } finally {
    process.env = saved;
  }
}

/** Assert that validateEnvironment() throws and that the message mentions the named field. */
async function assertRejects(field, extra) {
  await withEnv(extra, async ({ validateEnvironment }) => {
    let caught;
    try {
      validateEnvironment();
    } catch (err) {
      caught = err;
    }
    assert.ok(caught instanceof Error, "validateEnvironment must throw");
    assert.match(caught.message, new RegExp(field, "i"), `error must mention ${field}`);
  });
}

/** Assert that validateEnvironment() returns without throwing for the given env. */
async function assertAccepts(extra) {
  await withEnv(extra, async ({ validateEnvironment }) => {
    const env = validateEnvironment();
    assert.equal(env.MCP_TRANSPORT, "http", "transport should be http");
  });
}

test("rejects: plaintext HTTP on a non-loopback bind without proxy", async () => {
  await assertRejects("TLS_CERT_FILE", {
    MCP_TRANSPORT: "http",
    MCP_HTTP_HOST: "0.0.0.0",
    MCP_AUTH_MODE: "token",
    MCP_AUTH_TOKEN: "0123456789abcdef",
  });
});

test("rejects: auth=none on a non-loopback bind", async () => {
  await assertRejects("MCP_AUTH_MODE", {
    MCP_TRANSPORT: "http",
    MCP_HTTP_HOST: "0.0.0.0",
    MCP_AUTH_MODE: "none",
    TRUST_PROXY: "true",
  });
});

test("rejects: auth=token without MCP_AUTH_TOKEN", async () => {
  await assertRejects("MCP_AUTH_TOKEN", {
    MCP_TRANSPORT: "http",
    MCP_AUTH_MODE: "token",
  });
});

test("rejects: auth=token with a too-short token", async () => {
  await assertRejects("MCP_AUTH_TOKEN", {
    MCP_TRANSPORT: "http",
    MCP_AUTH_MODE: "token",
    MCP_AUTH_TOKEN: "short",
  });
});

test("rejects: auth=oauth without MCP_OAUTH_ISSUER", async () => {
  await assertRejects("MCP_OAUTH_ISSUER", {
    MCP_TRANSPORT: "http",
    MCP_AUTH_MODE: "oauth",
    MCP_OAUTH_AUDIENCE: "https://mcp.example.com",
  });
});

test("rejects: auth=oauth without audience or public URL", async () => {
  await assertRejects("MCP_OAUTH_AUDIENCE", {
    MCP_TRANSPORT: "http",
    MCP_AUTH_MODE: "oauth",
    MCP_OAUTH_ISSUER: "https://issuer.example.com",
  });
});

test("rejects: TLS_KEY_FILE without TLS_CERT_FILE", async () => {
  await assertRejects("TLS_KEY_FILE", {
    MCP_TRANSPORT: "http",
    MCP_AUTH_MODE: "none",
    TLS_KEY_FILE: "/somewhere/key.pem",
  });
});

test("rejects: non-loopback http:// public URL", async () => {
  await assertRejects("MCP_PUBLIC_URL", {
    MCP_TRANSPORT: "http",
    MCP_AUTH_MODE: "none",
    MCP_PUBLIC_URL: "http://mcp.example.com",
  });
});

test("accepts: loopback + auth=none", async () => {
  await assertAccepts({
    MCP_TRANSPORT: "http",
    MCP_HTTP_HOST: "127.0.0.1",
    MCP_AUTH_MODE: "none",
  });
});

test("accepts: public bind + TRUST_PROXY=true + public URL", async () => {
  await assertAccepts({
    MCP_TRANSPORT: "http",
    MCP_HTTP_HOST: "0.0.0.0",
    MCP_AUTH_MODE: "token",
    MCP_AUTH_TOKEN: "0123456789abcdef",
    TRUST_PROXY: "true",
    MCP_PUBLIC_URL: "https://mcp.example.com",
  });
});

test("accepts: oauth with issuer + audience", async () => {
  await assertAccepts({
    MCP_TRANSPORT: "http",
    MCP_HTTP_HOST: "127.0.0.1",
    MCP_AUTH_MODE: "oauth",
    MCP_OAUTH_ISSUER: "https://issuer.example.com",
    MCP_OAUTH_AUDIENCE: "https://mcp.example.com",
  });
});

test("stdio ignores all HTTP-only rules (loopback, TLS, auth)", async () => {
  // Without these the HTTP rules would all fire; with stdio they should be
  // skipped entirely.
  await withEnv({ MCP_TRANSPORT: "stdio" }, async ({ validateEnvironment }) => {
    const env = validateEnvironment();
    assert.equal(env.MCP_TRANSPORT, "stdio");
  });
});

test("transforms and defaults are applied", async () => {
  await withEnv(
    { MCP_TRANSPORT: "http", MCP_AUTH_MODE: "none" },
    async ({ validateEnvironment, getEnv }) => {
      validateEnvironment();
      const env = getEnv();
      assert.equal(env.PORT, 3000);
      assert.equal(env.MCP_HTTP_HOST, "127.0.0.1");
      assert.equal(env.READ_ONLY, true);
      assert.equal(env.REQUEST_TIMEOUT, 30000);
    }
  );
});

test("SENDGRID_API_KEY must start with 'SG.'", async () => {
  await assertRejects("SENDGRID_API_KEY", {
    SENDGRID_API_KEY: "AKIA-not-a-sendgrid-key",
  });
});