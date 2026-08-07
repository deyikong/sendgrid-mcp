import assert from "node:assert/strict";
import test from "node:test";
import { request as httpRequest } from "node:http";

/**
 * These tests exercise startHttpTransport() itself -- the real production
 * entrypoint (TLS/plain server selection, listen, startup logging, signal
 * handlers) -- rather than buildApp() wrapped in a hand-rolled server, which
 * is what tests/auth.test.mjs does. All servers here bind to 127.0.0.1
 * without TLS, since MCP_HTTP_HOST=127.0.0.1 is exempt from the
 * TLS-required-on-public-bind rule.
 */

const BASE_ENV = { SENDGRID_API_KEY: "SG.testtesttesttesttesttest" };

/** Picks a high, unlikely-to-collide port for each server instance. */
function randomPort() {
  return 30000 + Math.floor(Math.random() * 20000);
}

async function withHttpServer(extra, fn) {
  const saved = { ...process.env };
  const port = extra.PORT ?? randomPort();
  try {
    process.env = {
      ...saved,
      ...BASE_ENV,
      MCP_TRANSPORT: "http",
      MCP_HTTP_HOST: "127.0.0.1",
      ...extra,
      PORT: String(port),
    };

    const httpUrl = new URL("../build/http.js", import.meta.url).href + `?t=${Date.now()}-${Math.random()}`;
    const { parseFresh, startHttpTransport } = await import(httpUrl);
    parseFresh();
    const server = await startHttpTransport();

    try {
      await fn({ baseUrl: `http://127.0.0.1:${port}`, port });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  } finally {
    process.env = saved;
  }
}

const INIT = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } },
});

function post(baseUrl, path, body, opts = {}) {
  const u = new URL(path, baseUrl);
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    ...opts.headers,
  };
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      { method: "POST", hostname: u.hostname, port: u.port, path: u.pathname, headers },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          let parsed;
          try {
            parsed = data ? JSON.parse(data) : undefined;
          } catch {
            parsed = undefined;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: data });
        });
      }
    );
    req.on("error", reject);
    req.end(body);
  });
}

function get(baseUrl, path) {
  const u = new URL(path, baseUrl);
  return new Promise((resolve, reject) => {
    const req = httpRequest({ method: "GET", hostname: u.hostname, port: u.port, path: u.pathname }, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        let parsed;
        try {
          parsed = data ? JSON.parse(data) : undefined;
        } catch {
          parsed = undefined;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on("error", reject);
    req.end();
  });
}

test("token mode: valid bearer token is accepted, missing token is rejected", async () => {
  const token = "x".repeat(32);
  await withHttpServer({ MCP_AUTH_MODE: "token", MCP_AUTH_TOKEN: token }, async ({ baseUrl }) => {
    const ok = await post(baseUrl, "/mcp", INIT, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(ok.status, 200);

    const missing = await post(baseUrl, "/mcp", INIT);
    assert.equal(missing.status, 401);
  });
});

test("none mode: request succeeds with no Authorization header at all", async () => {
  await withHttpServer({ MCP_AUTH_MODE: "none" }, async ({ baseUrl }) => {
    const res = await post(baseUrl, "/mcp", INIT);
    assert.equal(res.status, 200);
  });
});

test("GET /health reports server name and version", async () => {
  await withHttpServer({ MCP_AUTH_MODE: "none" }, async ({ baseUrl }) => {
    const res = await get(baseUrl, "/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
    assert.equal(res.body.server, "sendgrid-mcp");
    assert.ok(res.body.version);
  });
});

test("unknown route returns a 404 JSON-RPC error", async () => {
  await withHttpServer({ MCP_AUTH_MODE: "none" }, async ({ baseUrl }) => {
    const res = await get(baseUrl, "/nonexistent");
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { jsonrpc: "2.0", error: { code: -32601, message: "Not found" }, id: null });
  });
});

test("malformed JSON body is caught by the error handler as a 500", async () => {
  await withHttpServer({ MCP_AUTH_MODE: "none" }, async ({ baseUrl }) => {
    const res = await post(baseUrl, "/mcp", "{not valid json");
    assert.equal(res.status, 500);
    assert.equal(res.body.jsonrpc, "2.0");
    assert.equal(res.body.error.code, -32603);
  });
});

test("request body over the 4MB limit is rejected", async () => {
  await withHttpServer({ MCP_AUTH_MODE: "none" }, async ({ baseUrl }) => {
    const oversized = Buffer.alloc(4 * 1024 * 1024 + 1024, 0x61);
    const res = await post(baseUrl, "/mcp", oversized);
    assert.equal(res.status, 500);
  });
});

test("DNS-rebinding protection: mismatched Host header is rejected, matching one is allowed", async () => {
  const port = randomPort();
  await withHttpServer(
    { MCP_AUTH_MODE: "none", PORT: port, MCP_ALLOWED_HOSTS: `127.0.0.1:${port}` },
    async ({ baseUrl }) => {
      const allowed = await post(baseUrl, "/mcp", INIT);
      assert.equal(allowed.status, 200);

      const rejected = await post(baseUrl, "/mcp", INIT, { headers: { Host: "evil.example" } });
      assert.equal(rejected.status, 403);
      assert.equal(rejected.body.error.code, -32000);
      assert.match(rejected.body.error.message, /Invalid Host header/);
    }
  );
});

test("publicOrigin() falls back to deriving scheme://host:port when MCP_PUBLIC_URL is unset", async () => {
  await withHttpServer(
    {
      MCP_AUTH_MODE: "oauth",
      MCP_OAUTH_ISSUER: "https://issuer.example.com",
      MCP_OAUTH_AUDIENCE: "https://mcp.example.com",
      // MCP_PUBLIC_URL intentionally unset.
    },
    async ({ baseUrl, port }) => {
      const res = await post(baseUrl, "/mcp", INIT);
      assert.equal(res.status, 401);
      assert.match(
        res.headers["www-authenticate"],
        new RegExp(`resource_metadata="http://127\\.0\\.0\\.1:${port}/\\.well-known/oauth-protected-resource"`)
      );
    }
  );
});

test("resourceIdentifier() falls back to MCP_PUBLIC_URL when MCP_OAUTH_AUDIENCE is unset", async () => {
  const publicUrl = "https://mcp.example.com";
  await withHttpServer(
    {
      MCP_AUTH_MODE: "oauth",
      MCP_OAUTH_ISSUER: "https://issuer.example.com",
      MCP_PUBLIC_URL: publicUrl,
      // MCP_OAUTH_AUDIENCE intentionally unset -- validated as acceptable
      // because MCP_PUBLIC_URL is set (see env.test.mjs), but nothing
      // previously checked that resourceIdentifier() actually uses it.
    },
    async ({ baseUrl }) => {
      const res = await get(baseUrl, "/.well-known/oauth-protected-resource");
      assert.equal(res.status, 200);
      assert.equal(res.body.resource, publicUrl);
    }
  );
});
