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
    hasApiKey: !!env.SENDGRID_API_KEY,
    apiKeyValid: isValidSendGridApiKey(env.SENDGRID_API_KEY),
  };
}