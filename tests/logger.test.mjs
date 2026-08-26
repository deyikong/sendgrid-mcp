import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";
process.env.LOG_LEVEL = "warn";

const { logger } = await import("../build/shared/logger.js");

function captureConsoleError(fn) {
  const calls = [];
  const original = console.error;
  console.error = (...args) => calls.push(args[0]);
  try {
    fn();
  } finally {
    console.error = original;
  }
  return calls;
}

// node:test defers every test() body until after the whole module (including
// later top-level awaits) finishes running, so the pre-validation state has
// to be captured here, synchronously, before validateEnvironment() runs below.
const preValidationCalls = captureConsoleError(() => {
  logger.debug("debug message");
  logger.info("info message");
  logger.error("error message");
});

const { validateEnvironment } = await import("../build/shared/env.js");
validateEnvironment();

test("before validateEnvironment() has run, logger falls back to the schema's 'info' default threshold", () => {
  assert.deepEqual(preValidationCalls, ["info message", "error message"]);
});

test("logger respects a configured LOG_LEVEL=warn: debug/info suppressed, warn/error shown", () => {
  const calls = captureConsoleError(() => {
    logger.debug("debug message");
    logger.info("info message");
    logger.warn("warn message");
    logger.error("error message");
  });
  assert.deepEqual(calls, ["warn message", "error message"]);
});
