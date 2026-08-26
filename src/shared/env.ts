import { z } from "zod";

// Environment variable schema
const EnvSchema = z.object({
  SENDGRID_API_KEY: z
    .string()
    .min(1, "SENDGRID_API_KEY is required")
    .startsWith("SG.", "SENDGRID_API_KEY must start with 'SG.'"),
  
  MCP_SERVER_NAME: z.string().optional().default("sendgrid-mcp"),
  MCP_SERVER_VERSION: z.string().optional().default("1.0.0"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional().default("info"),
  REQUEST_TIMEOUT: z
    .string()
    .optional()
    .default("30000")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 300000, {
      message: "REQUEST_TIMEOUT must be between 1 and 300000 milliseconds",
    }),
  // Transport selection: "stdio" (default, for Claude Desktop / Claude Code)
  // or "http" (Streamable HTTP, for remote connectors and OpenAI).
  MCP_TRANSPORT: z.enum(["stdio", "http"]).optional().default("stdio"),

  PORT: z
    .string()
    .optional()
    .default("3000")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val < 65536, {
      message: "PORT must be between 1 and 65535",
    }),

  MCP_HTTP_HOST: z.string().optional().default("127.0.0.1"),

  // Authentication mode for the HTTP transport.
  //   "oauth" - verify tokens from an external identity provider (recommended)
  //   "token" - single shared secret in MCP_AUTH_TOKEN
  //   "none"  - no auth; only permitted on a loopback bind
  MCP_AUTH_MODE: z.enum(["oauth", "token", "none"]).optional().default("token"),

  // Bearer token required on every HTTP request when MCP_AUTH_MODE=token.
  MCP_AUTH_TOKEN: z.string().optional(),

  // --- MCP_AUTH_MODE=oauth ---
  // Issuer URL of the authorization server (e.g. https://you.auth0.com).
  MCP_OAUTH_ISSUER: z.string().url().optional(),
  // This server's resource identifier; must match the token's `aud` claim.
  // Defaults to MCP_PUBLIC_URL when unset.
  MCP_OAUTH_AUDIENCE: z.string().url().optional(),
  // Override JWKS location. Defaults to <issuer>/.well-known/jwks.json.
  MCP_OAUTH_JWKS_URI: z.string().url().optional(),
  // Scopes a token must carry to reach /mcp at all.
  MCP_OAUTH_REQUIRED_SCOPES: z
    .string()
    .optional()
    .transform((val) =>
      val ? val.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean) : []
    ),

  // Externally reachable base URL, used to build OAuth metadata documents and
  // the resource identifier. Required behind a proxy, where the server cannot
  // infer its own public origin.
  MCP_PUBLIC_URL: z
    .string()
    .url()
    .optional()
    .transform((val) => (val ? val.replace(/\/+$/, "") : undefined)),

  // --- TLS ---
  // When both are set, the server terminates HTTPS itself.
  TLS_KEY_FILE: z.string().optional(),
  TLS_CERT_FILE: z.string().optional(),
  // Optional CA bundle for intermediate certificate chains.
  TLS_CA_FILE: z.string().optional(),

  // Trust X-Forwarded-* headers. Enable ONLY when a proxy you control sits in
  // front, since these headers are client-controlled otherwise.
  TRUST_PROXY: z
    .string()
    .optional()
    .default("false")
    .transform((val) => val.toLowerCase() === "true"),

  // Comma-separated allowlists used for DNS-rebinding protection on HTTP.
  MCP_ALLOWED_HOSTS: z
    .string()
    .optional()
    .transform((val) =>
      val ? val.split(",").map((s) => s.trim()).filter(Boolean) : undefined
    ),
  MCP_ALLOWED_ORIGINS: z
    .string()
    .optional()
    .transform((val) =>
      val ? val.split(",").map((s) => s.trim()).filter(Boolean) : undefined
    ),

  READ_ONLY: z
    .string()
    .optional()
    .default("true")
    .transform((val) => val.toLowerCase() === "true")
    .describe("When true, only allows read-only operations (default: true)"),
});

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "::1", "localhost"]);

/**
 * Cross-field rules. These only apply to the HTTP transport -- stdio runs as a
 * local subprocess and has no network surface to secure.
 *
 * These are hard errors rather than warnings: a misconfigured auth or TLS
 * setting silently exposes the SendGrid account behind this server, so the
 * server refuses to start rather than come up in a weaker mode than intended.
 */
const EnvSchemaChecked = EnvSchema.superRefine((env, ctx) => {
  if (env.MCP_TRANSPORT !== "http") return;

  const isLoopback = LOOPBACK_HOSTS.has(env.MCP_HTTP_HOST);
  const hasTls = Boolean(env.TLS_KEY_FILE && env.TLS_CERT_FILE);

  const fail = (path: string, message: string) =>
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

  // --- TLS ---
  if (Boolean(env.TLS_KEY_FILE) !== Boolean(env.TLS_CERT_FILE)) {
    fail("TLS_KEY_FILE", "TLS_KEY_FILE and TLS_CERT_FILE must be set together");
  }

  if (!isLoopback && !hasTls && !env.TRUST_PROXY) {
    fail(
      "TLS_CERT_FILE",
      `Refusing to serve plaintext HTTP on non-loopback address ${env.MCP_HTTP_HOST}. ` +
        "Either set TLS_KEY_FILE/TLS_CERT_FILE, or set TRUST_PROXY=true if a TLS-terminating proxy sits in front."
    );
  }

  // --- Public URL ---
  if (env.MCP_PUBLIC_URL && env.MCP_PUBLIC_URL.startsWith("http://")) {
    const host = new URL(env.MCP_PUBLIC_URL).hostname;
    if (!LOOPBACK_HOSTS.has(host)) {
      fail("MCP_PUBLIC_URL", "MCP_PUBLIC_URL must use https:// (http:// is only allowed for loopback)");
    }
  }

  // --- Auth ---
  switch (env.MCP_AUTH_MODE) {
    case "oauth": {
      if (!env.MCP_OAUTH_ISSUER) {
        fail("MCP_OAUTH_ISSUER", "MCP_OAUTH_ISSUER is required when MCP_AUTH_MODE=oauth");
      }
      if (!env.MCP_OAUTH_AUDIENCE && !env.MCP_PUBLIC_URL) {
        fail(
          "MCP_OAUTH_AUDIENCE",
          "Set MCP_OAUTH_AUDIENCE (or MCP_PUBLIC_URL) when MCP_AUTH_MODE=oauth -- it is this server's resource identifier and must match the token audience"
        );
      }
      if (env.TRUST_PROXY && !env.MCP_PUBLIC_URL) {
        fail(
          "MCP_PUBLIC_URL",
          "MCP_PUBLIC_URL is required when TRUST_PROXY=true and MCP_AUTH_MODE=oauth so OAuth discovery URLs are externally reachable"
        );
      }
      break;
    }
    case "token": {
      if (!env.MCP_AUTH_TOKEN) {
        fail("MCP_AUTH_TOKEN", "MCP_AUTH_TOKEN is required when MCP_AUTH_MODE=token");
      } else if (env.MCP_AUTH_TOKEN.length < 16) {
        fail("MCP_AUTH_TOKEN", "MCP_AUTH_TOKEN must be at least 16 characters; generate one with: openssl rand -hex 32");
      }
      break;
    }
    case "none": {
      if (!isLoopback) {
        fail(
          "MCP_AUTH_MODE",
          `MCP_AUTH_MODE=none is only permitted on a loopback bind, but MCP_HTTP_HOST is ${env.MCP_HTTP_HOST}. ` +
            "An unauthenticated public endpoint would let anyone send email through your SendGrid account."
        );
      }
      break;
    }
  }
});

export type Environment = z.infer<typeof EnvSchemaChecked>;

let _env: Environment | null = null;

export function validateEnvironment(): Environment {
  if (_env) {
    return _env;
  }
  return parseFresh();
}

/**
 * Parse process.env without consulting the cache. The test harness uses this
 * to pick up env vars that changed between sequential tests sharing the same
 * module instance.
 */
export function parseFresh(): Environment {
  try {
    _env = EnvSchemaChecked.parse(process.env);
    return _env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err) => {
        const path = err.path.join(".");
        return `${path}: ${err.message}`;
      });

      throw new Error(
        `Environment validation failed:\n${errorMessages.join("\n")}\n\n` +
          `Please check your .env file and ensure all required variables are set.\n` +
          `See .env.example for reference.`
      );
    }
    throw error;
  }
}

export function getEnv(): Environment {
  if (!_env) {
    throw new Error("Environment not validated. Call validateEnvironment() first.");
  }
  return _env;
}

// Helper function to check if API key is valid format
export function isValidSendGridApiKey(apiKey: string): boolean {
  return apiKey.startsWith("SG.") && apiKey.length > 20;
}

// Helper to get safe environment info for logging
export function getSafeEnvInfo(): Record<string, any> {
  const env = getEnv();
  return {
    serverName: env.MCP_SERVER_NAME,
    serverVersion: env.MCP_SERVER_VERSION,
    logLevel: env.LOG_LEVEL,
    requestTimeout: env.REQUEST_TIMEOUT,
    readOnly: env.READ_ONLY,
    transport: env.MCP_TRANSPORT,
    authMode: env.MCP_AUTH_MODE,
    oauthIssuer: env.MCP_OAUTH_ISSUER,
    publicUrl: env.MCP_PUBLIC_URL,
    tls: Boolean(env.TLS_KEY_FILE && env.TLS_CERT_FILE) ? "in-process" : env.TRUST_PROXY ? "proxy-terminated" : "none",
    hasAuthToken: !!env.MCP_AUTH_TOKEN,
    hasApiKey: !!env.SENDGRID_API_KEY,
    apiKeyValid: isValidSendGridApiKey(env.SENDGRID_API_KEY),
  };
}

// Helper to check if READ_ONLY mode blocks the operation
export function checkReadOnlyMode(): { blocked: boolean; message?: string } {
  const env = getEnv();
  if (env.READ_ONLY) {
    return {
      blocked: true,
      message: "❌ Operation blocked: Server is running in READ_ONLY mode. Set READ_ONLY=false in your environment to enable write operations."
    };
  }
  return { blocked: false };
}