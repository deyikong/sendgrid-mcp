import { getEnv } from "./env.js";

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level = keyof typeof LEVELS;

function shouldLog(level: Level): boolean {
  let configured: Level = "info";
  try {
    configured = getEnv().LOG_LEVEL;
  } catch {
    // Environment not validated yet -- fall back to the schema default so
    // early startup messages (or validation failures) still show. Since
    // "error" is the highest level, it always passes this check regardless
    // of the configured or fallback threshold.
  }
  return LEVELS[level] >= LEVELS[configured];
}

// All output goes to stderr via console.error, never stdout -- stdout must
// stay reserved for the stdio JSON-RPC transport.
export const logger = {
  debug: (...args: unknown[]): void => {
    if (shouldLog("debug")) console.error(...args);
  },
  info: (...args: unknown[]): void => {
    if (shouldLog("info")) console.error(...args);
  },
  warn: (...args: unknown[]): void => {
    if (shouldLog("warn")) console.error(...args);
  },
  error: (...args: unknown[]): void => {
    if (shouldLog("error")) console.error(...args);
  },
};
