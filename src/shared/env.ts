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

  // Bearer token required on every HTTP request. Strongly recommended whenever
  // the server is reachable from anything other than localhost.
  MCP_AUTH_TOKEN: z.string().optional(),

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

export type Environment = z.infer<typeof EnvSchema>;

let _env: Environment | null = null;

export function validateEnvironment(): Environment {
  if (_env) {
    return _env;
  }

  try {
    _env = EnvSchema.parse(process.env);
    return _env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => {
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