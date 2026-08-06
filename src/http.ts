import { createServer as createHttpServer, IncomingMessage, ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";
import { getEnv } from "./shared/env.js";

const MCP_PATH = "/mcp";

function send(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function jsonRpcError(res: ServerResponse, status: number, code: number, message: string): void {
  send(res, status, { jsonrpc: "2.0", error: { code, message }, id: null });
}

/**
 * Constant-time-ish bearer token check.
 */
function isAuthorized(req: IncomingMessage, expected: string | undefined): boolean {
  if (!expected) return true; // auth disabled
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return false;
  const provided = Buffer.from(header.slice("Bearer ".length).trim());
  const want = Buffer.from(expected);
  if (provided.length !== want.length) return false;
  return timingSafeEqual(provided, want);
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 4 * 1024 * 1024) throw new Error("Request body too large");
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return undefined;
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function startHttpTransport(): Promise<void> {
  const env = getEnv();

  if (!env.MCP_AUTH_TOKEN && env.MCP_HTTP_HOST !== "127.0.0.1" && env.MCP_HTTP_HOST !== "localhost") {
    console.error(
      "WARNING: HTTP transport is bound to a non-loopback address without MCP_AUTH_TOKEN set. " +
        "Anyone who can reach this port can send email through your SendGrid account."
    );
  }

  const httpServer = createHttpServer((req, res) => {
    void (async () => {
      try {
        const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

        if (url.pathname === "/health") {
          return send(res, 200, { status: "ok", server: env.MCP_SERVER_NAME, version: env.MCP_SERVER_VERSION });
        }

        if (url.pathname !== MCP_PATH) {
          return jsonRpcError(res, 404, -32601, "Not found");
        }

        if (!isAuthorized(req, env.MCP_AUTH_TOKEN)) {
          res.setHeader("WWW-Authenticate", 'Bearer realm="sendgrid-mcp"');
          return jsonRpcError(res, 401, -32001, "Unauthorized");
        }

        // Stateless mode: a fresh server + transport per request. This is what
        // remote clients (Claude custom connectors, OpenAI Responses API) expect
        // and it avoids cross-request session state entirely.
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

        const body = req.method === "POST" ? await readBody(req) : undefined;
        await transport.handleRequest(req, res, body);
      } catch (error) {
        console.error("HTTP request failed:", error);
        if (!res.headersSent) {
          jsonRpcError(res, 500, -32603, "Internal server error");
        } else {
          res.end();
        }
      }
    })();
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(env.PORT, env.MCP_HTTP_HOST, resolve);
  });

  console.error(
    `SendGrid MCP Server running on Streamable HTTP at http://${env.MCP_HTTP_HOST}:${env.PORT}${MCP_PATH}`
  );
  console.error(env.MCP_AUTH_TOKEN ? "Bearer auth: enabled" : "Bearer auth: DISABLED (set MCP_AUTH_TOKEN)");
}
