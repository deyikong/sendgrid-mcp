import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";
process.env.READ_ONLY = "true";

const { validateEnvironment } = await import("../build/shared/env.js");
const { campaignTools } = await import("../build/tools/campaigns.js");

validateEnvironment();

function mockSuccessfulFetch(body = {}) {
  let requestedUrl;

  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  return () => requestedUrl;
}

test("list_single_sends uses the documented GET collection endpoint", async () => {
  const getRequestedUrl = mockSuccessfulFetch({ result: [] });

  await campaignTools.list_single_sends.handler({ page_size: 50 });

  assert.equal(
    getRequestedUrl(),
    "https://api.sendgrid.com/v3/marketing/singlesends?page_size=50",
  );
});

test("list_single_sends forwards a page token", async () => {
  const getRequestedUrl = mockSuccessfulFetch({ result: [] });

  await campaignTools.list_single_sends.handler({
    page_size: 25,
    page_token: "next page",
  });

  assert.equal(
    getRequestedUrl(),
    "https://api.sendgrid.com/v3/marketing/singlesends?page_size=25&page_token=next+page",
  );
});

test("get_single_send uses the documented detail endpoint", async () => {
  const getRequestedUrl = mockSuccessfulFetch({ id: "campaign/id" });

  await campaignTools.get_single_send.handler({
    singlesend_id: "campaign/id",
  });

  assert.equal(
    getRequestedUrl(),
    "https://api.sendgrid.com/v3/marketing/singlesends/campaign%2Fid",
  );
});
