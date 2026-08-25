import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";
process.env.READ_ONLY = "false";

const { validateEnvironment } = await import("../build/shared/env.js");
const { automationTools } = await import("../build/tools/automations.js");

validateEnvironment();

const automationFixture = {
  id: "ONBOARD123",
  status: "active",
  title: "Onboarding Automation",
};

const automationsListFixture = {
  result: [automationFixture],
  _metadata: { count: 1 },
};

// Stubs global fetch and records every call as { url: URL, init }.
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

test("list_automations hits GET /v3/marketing/automations with offset and limit query params", async () => {
  const calls = mockFetch(automationsListFixture);

  const result = await automationTools.list_automations.handler({
    offset: 0,
    limit: 50,
  });

  assert.equal(calls[0].url.pathname, "/v3/marketing/automations");
  assert.equal(calls[0].url.searchParams.get("offset"), "0");
  assert.equal(calls[0].url.searchParams.get("limit"), "50");
  assert.deepEqual(JSON.parse(result.content[0].text), automationsListFixture);
});

test("list_automations reflects whatever offset/limit values are passed in", async () => {
  const calls = mockFetch(automationsListFixture);

  await automationTools.list_automations.handler({ offset: 100, limit: 25 });

  assert.equal(calls[0].url.searchParams.get("offset"), "100");
  assert.equal(calls[0].url.searchParams.get("limit"), "25");
});

test("get_automation hits GET /v3/marketing/automations/:automation_id", async () => {
  const calls = mockFetch(automationFixture);

  const result = await automationTools.get_automation.handler({
    automation_id: "ONBOARD123",
  });

  assert.equal(calls[0].url.pathname, "/v3/marketing/automations/ONBOARD123");
  assert.deepEqual(JSON.parse(result.content[0].text), automationFixture);
});

test("update_automation_settings sends a PATCH to /v3/marketing/automations/:automation_id with title and status", async () => {
  const calls = mockFetch(automationFixture);

  const result = await automationTools.update_automation_settings.handler({
    automation_id: "ONBOARD123",
    title: "New Title",
    status: "paused",
  });

  assert.equal(calls[0].url.pathname, "/v3/marketing/automations/ONBOARD123");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[0].init.body), { title: "New Title", status: "paused" });
  assert.match(result.content[0].text, /updated successfully/);
  assert.ok(result.content[0].text.includes(JSON.stringify(automationFixture, null, 2)));
});

test("update_automation_settings only includes fields that were provided", async () => {
  const calls = mockFetch(automationFixture);

  await automationTools.update_automation_settings.handler({
    automation_id: "ONBOARD123",
    status: "active",
  });

  assert.deepEqual(JSON.parse(calls[0].init.body), { status: "active" });
});

test("update_automation_settings does not call fetch and returns a message when no fields are provided", async () => {
  const calls = mockFetch(automationFixture);

  const result = await automationTools.update_automation_settings.handler({
    automation_id: "ONBOARD123",
  });

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /No updates specified/);
});

test("update_automation_step sends a PATCH to /v3/marketing/automations/:automation_id/steps/:step_id with step_status and wait_time", async () => {
  const calls = mockFetch(automationFixture);

  const result = await automationTools.update_automation_step.handler({
    automation_id: "ONBOARD123",
    step_id: "STEP1",
    step_status: "active",
    wait_time: 30,
  });

  assert.equal(calls[0].url.pathname, "/v3/marketing/automations/ONBOARD123/steps/STEP1");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[0].init.body), { step_status: "active", wait_time: 30 });
  assert.match(result.content[0].text, /updated successfully/);
});

test("update_automation_step only includes fields that were provided", async () => {
  const calls = mockFetch(automationFixture);

  await automationTools.update_automation_step.handler({
    automation_id: "ONBOARD123",
    step_id: "STEP1",
    wait_time: 15,
  });

  assert.deepEqual(JSON.parse(calls[0].init.body), { wait_time: 15 });
});

test("update_automation_step does not call fetch and returns a message when no fields are provided", async () => {
  const calls = mockFetch(automationFixture);

  const result = await automationTools.update_automation_step.handler({
    automation_id: "ONBOARD123",
    step_id: "STEP1",
  });

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /No updates specified/);
});

test("delete_automation sends a DELETE to /v3/marketing/automations/:automation_id", async () => {
  const calls = mockFetch({});

  const result = await automationTools.delete_automation.handler({
    automation_id: "ONBOARD123",
  });

  assert.equal(calls[0].url.pathname, "/v3/marketing/automations/ONBOARD123");
  assert.equal(calls[0].init.method, "DELETE");
  assert.match(result.content[0].text, /deleted successfully/);
});

test("open_automation_creator does not call fetch and returns the creator URL", async () => {
  const calls = mockFetch({});

  const result = await automationTools.open_automation_creator.handler();

  assert.equal(calls.length, 0);
  assert.ok(result.content[0].text.includes("https://mc.sendgrid.com/automations/choose"));
});

test("open_automation_editor does not call fetch and returns the editor URL for the given automation_id", async () => {
  const calls = mockFetch({});

  const result = await automationTools.open_automation_editor.handler({
    automation_id: "ONBOARD123",
  });

  assert.equal(calls.length, 0);
  assert.ok(
    result.content[0].text.includes("https://mc.sendgrid.com/automations/ONBOARD123/detail"),
  );
});
