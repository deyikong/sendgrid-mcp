import { readFileSync } from "node:fs";
import { createServer as createHttpServer, type Server } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import type { OAuthTokenVerifier } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import { createServer } from "./server.js";
import { ExternalIdpTokenVerifier, StaticTokenVerifier, buildProtectedResourceMetadata } from "./auth.js";
import { getEnv, parseFresh } from "./shared/env.js";

const MCP_PATH = "/mcp";
const RESOURCE_METADATA_PATH = "/.well-known/oauth-protected-resource";
const MAX_BODY_BYTES = 4 * 1024 * 1024;

function jsonRpcError(res: Response, status: number, code: number, message: string): void {
  res.status(status).json({ jsonrpc: "2.0", error: { code, message }, id: null });
}

/**
 * The externally reachable origin. Behind a proxy the socket only knows the
 * internal address, so an explicit MCP_PUBLIC_URL wins when configured.
 */
function publicOrigin(): string {
  const env = getEnv();
  if (env.MCP_PUBLIC_URL) return env.MCP_PUBLIC_URL;
  const scheme = env.TLS_KEY_FILE && env.TLS_CERT_FILE ? "https" : "http";
  return `${scheme}://${env.MCP_HTTP_HOST}:${env.PORT}`;
}

function resourceIdentifier(): string {
  return getEnv().MCP_OAUTH_AUDIENCE ?? publicOrigin();
}

function buildVerifier(): OAuthTokenVerifier | null {
  const env = getEnv();

  switch (env.MCP_AUTH_MODE) {
    case "oauth": {
      const issuer = env.MCP_OAUTH_ISSUER!.replace(/\/+$/, "");
      const jwksUri = env.MCP_OAUTH_JWKS_URI ?? `${issuer}/.well-known/jwks.json`;
      return new ExternalIdpTokenVerifier(env.MCP_OAUTH_ISSUER!, resourceIdentifier(), jwksUri);
    }
    case "token":
      return new StaticTokenVerifier(env.MCP_AUTH_TOKEN!);
    case "none":
      return null;
  }
}

/**
 * Handles one MCP request in stateless mode: a fresh server and transport per
 * request, torn down when the response closes.
 */
async function handleMcpRequest(req: Request, res: Response): Promise<void> {
  const env = getEnv();

  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    enableDnsRebindingProtection: Boolean(env.MCP_ALLOWED_HOSTS || env.MCP_ALLOWED_ORIGINS),
    allowedHosts: env.MCP_ALLOWED_HOSTS,
    allowedOrigins: env.MCP_ALLOWED_ORIGINS,
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}

export { parseFresh };

export function buildApp(): Express {
  const env = getEnv();
  const app = express();

  // Behind a proxy, let Express derive req.protocol/req.ip from X-Forwarded-*.
  // Off by default because those headers are attacker-controlled otherwise.
  app.set("trust proxy", env.TRUST_PROXY);
  app.disable("x-powered-by");

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", server: env.MCP_SERVER_NAME, version: env.MCP_SERVER_VERSION });
  });

  // RFC 9728 discovery. Clients fetch this after a 401 to learn which
  // authorization server to send the user to. Served unauthenticated by design.
  if (env.MCP_AUTH_MODE === "oauth") {
    const metadata = buildProtectedResourceMetadata(
      resourceIdentifier(),
      env.MCP_OAUTH_ISSUER!,
      env.MCP_OAUTH_REQUIRED_SCOPES
    );
    const serveMetadata = (_req: Request, res: Response) => res.json(metadata);

    app.get(RESOURCE_METADATA_PATH, serveMetadata);
    // Path-suffixed form, used when the MCP endpoint is not at the origin root.
    app.get(`${RESOURCE_METADATA_PATH}${MCP_PATH}`, serveMetadata);
  }

  const verifier = buildVerifier();
  const guards = verifier
    ? [
        requireBearerAuth({
          verifier,
          requiredScopes: env.MCP_AUTH_MODE === "oauth" ? env.MCP_OAUTH_REQUIRED_SCOPES : [],
          resourceMetadataUrl:
            env.MCP_AUTH_MODE === "oauth" ? `${publicOrigin()}${RESOURCE_METADATA_PATH}` : undefined,
        }),
      ]
    : [];

  app.all(
    MCP_PATH,
    express.json({ limit: MAX_BODY_BYTES }),
    ...guards,
    (req: Request, res: Response, next: NextFunction) => {
      handleMcpRequest(req, res).catch(next);
    }
  );

  app.use((_req: Request, res: Response) => {
    jsonRpcError(res, 404, -32601, "Not found");
  });

  // Four-arg signature is required for Express to treat this as error handling.
  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("HTTP request failed:", error);
    if (res.headersSent) return res.end();
    jsonRpcError(res, 500, -32603, "Internal server error");
  });

  return app;
}

export async function startHttpTransport(): Promise<Server> {
  const env = getEnv();
  const app = buildApp();

  let server: Server;
  if (env.TLS_KEY_FILE && env.TLS_CERT_FILE) {
    server = createHttpsServer(
      {
        key: readFileSync(env.TLS_KEY_FILE),
        cert: readFileSync(env.TLS_CERT_FILE),
        ...(env.TLS_CA_FILE ? { ca: readFileSync(env.TLS_CA_FILE) } : {}),
        minVersion: "TLSv1.2",
      },
      app
    );
  } else {
    server = createHttpServer(app);
  }

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(env.PORT, env.MCP_HTTP_HOST, () => {
      server.removeListener("error", reject);
      resolve();
    });
  });

  const scheme = env.TLS_KEY_FILE && env.TLS_CERT_FILE ? "https" : "http";
  console.error(
    `SendGrid MCP Server running on Streamable HTTP at ${scheme}://${env.MCP_HTTP_HOST}:${env.PORT}${MCP_PATH}`
  );
  console.error(`Public URL: ${publicOrigin()}${MCP_PATH}`);

  switch (env.MCP_AUTH_MODE) {
    case "oauth":
      console.error(`Auth: OAuth 2.1 resource server (issuer ${env.MCP_OAUTH_ISSUER}, resource ${resourceIdentifier()})`);
      if (env.MCP_OAUTH_REQUIRED_SCOPES.length > 0) {
        console.error(`Required scopes: ${env.MCP_OAUTH_REQUIRED_SCOPES.join(", ")}`);
      }
      break;
    case "token":
      console.error("Auth: static bearer token");
      break;
    case "none":
      console.error("Auth: DISABLED (loopback only)");
      break;
  }

  const shutdown = () => server.close(() => process.exit(0));
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
  // Deregister once the server closes so repeated start/stop cycles (e.g. in
  // tests) don't leak listeners onto the shared process object.
  server.once("close", () => {
    process.off("SIGTERM", shutdown);
    process.off("SIGINT", shutdown);
  });

  return server;
}
