import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";
process.env.READ_ONLY = "false";

const { validateEnvironment } = await import("../build/shared/env.js");
const { emailValidationTools } = await import("../build/tools/email-validation.js");

validateEnvironment();

const validateEmailFixture = {
  result: {
    email: "person@example.com",
    verdict: "Valid",
    score: 0.9,
  },
};

function mockFetch(body) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(String(url)), init });
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  return calls;
}

test("validate_email sends a POST to /v3/validations/email with the email", async () => {
  const calls = mockFetch(validateEmailFixture);

  const result = await emailValidationTools.validate_email.handler({
    email: "person@example.com",
  });

  assert.equal(calls[0].url.pathname, "/v3/validations/email");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), { email: "person@example.com" });
  assert.deepEqual(JSON.parse(result.content[0].text), validateEmailFixture);
  assert.deepEqual(result.structuredContent, validateEmailFixture);
});

test("validate_email includes source only when provided", async () => {
  const calls = mockFetch(validateEmailFixture);

  await emailValidationTools.validate_email.handler({
    email: "person@example.com",
    source: "signup_form",
  });

  assert.deepEqual(JSON.parse(calls[0].init.body), {
    email: "person@example.com",
    source: "signup_form",
  });
});

test("validate_email omits source when not provided", async () => {
  const calls = mockFetch(validateEmailFixture);

  await emailValidationTools.validate_email.handler({ email: "person@example.com" });

  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.source, undefined);
  assert.deepEqual(Object.keys(body), ["email"]);
});

test("validate_email is blocked in read-only mode", async () => {
  process.env.READ_ONLY = "true";
  const { parseFresh } = await import("../build/shared/env.js");
  parseFresh();
  const calls = mockFetch(validateEmailFixture);

  const result = await emailValidationTools.validate_email.handler({
    email: "person@example.com",
  });

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /READ_ONLY mode/);

  process.env.READ_ONLY = "false";
  parseFresh();
});
