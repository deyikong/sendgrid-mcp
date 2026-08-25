import assert from "node:assert/strict";
import test from "node:test";

// READ_ONLY is deliberately left unset here, so the env schema's default
// ("true") applies -- this file verifies that default actually blocks writes.
// Other test files that need to exercise write-handler request building set
// READ_ONLY=false explicitly at their own top, before any tool import.
process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";

const { validateEnvironment } = await import("../build/shared/env.js");
const { contactTools } = await import("../build/tools/contacts.js");
const { templateTools } = await import("../build/tools/templates.js");

validateEnvironment();

function mockFetch() {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(String(url)), init });
    return new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } });
  };
  return calls;
}

test("READ_ONLY default blocks create_email_list without calling fetch", async () => {
  const calls = mockFetch();

  const result = await contactTools.create_email_list.handler({ name: "test list" });

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /read_only/i);
});

test("READ_ONLY default blocks create_template without calling fetch", async () => {
  const calls = mockFetch();

  const result = await templateTools.create_template.handler({ name: "test template" });

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /read_only/i);
});
