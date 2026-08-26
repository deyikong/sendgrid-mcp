import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";
process.env.READ_ONLY = "true";

const { validateEnvironment } = await import("../build/shared/env.js");
const { allTools } = await import("../build/tools/index.js");

validateEnvironment();

const HINT_KEYS = ["readOnlyHint", "destructiveHint", "idempotentHint", "openWorldHint"];

// Every tool must declare all four MCP tool-annotation hints so clients can
// distinguish safe reads from destructive writes without guessing from the
// tool name -- see the ecosystem convention in modelcontextprotocol/servers,
// github-mcp-server, sentry-mcp, and supabase-mcp.
for (const [name, tool] of Object.entries(allTools)) {
  test(`${name} declares all four tool annotation hints`, () => {
    const annotations = tool.config?.annotations;
    assert.ok(annotations, `${name} is missing config.annotations entirely`);
    for (const key of HINT_KEYS) {
      assert.equal(
        typeof annotations[key],
        "boolean",
        `${name}.config.annotations.${key} must be a boolean, got ${typeof annotations[key]}`
      );
    }
  });
}

test("every destructive tool is also marked non-read-only", () => {
  for (const [name, tool] of Object.entries(allTools)) {
    const a = tool.config.annotations;
    if (a.destructiveHint) {
      assert.equal(a.readOnlyHint, false, `${name} is marked destructive but also readOnlyHint: true`);
    }
  }
});
