import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";
process.env.READ_ONLY = "false";

const { validateEnvironment } = await import("../build/shared/env.js");
const { mailTools } = await import("../build/tools/mail.js");

validateEnvironment();

const sendMailFixture = { message: "success" };

function mockFetch(body, status = 200) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(String(url)), init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  };
  return calls;
}

test("send_mail sends a POST to /v3/mail/send with the full mail payload", async () => {
  const calls = mockFetch(sendMailFixture, 202);

  const mailData = {
    personalizations: [
      { to: [{ email: "recipient@example.com", name: "Recipient" }], subject: "Personalized Subject" },
    ],
    from: { email: "sender@example.com", name: "Sender" },
    subject: "Default Subject",
    content: [{ type: "text/plain", value: "Hello world" }],
  };

  const result = await mailTools.send_mail.handler(mailData);

  assert.equal(calls[0].url.pathname, "/v3/mail/send");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), mailData);
  assert.ok(result.content[0].text.includes("Email sent successfully"));
  assert.ok(result.content[0].text.includes(JSON.stringify(sendMailFixture, null, 2)));
});

test("send_mail passes through cc, bcc, substitutions, and reply_to when provided", async () => {
  const calls = mockFetch(sendMailFixture, 202);

  const mailData = {
    personalizations: [
      {
        to: [{ email: "to@example.com" }],
        cc: [{ email: "cc@example.com" }],
        bcc: [{ email: "bcc@example.com" }],
        substitutions: { "-name-": "Alice" },
      },
    ],
    from: { email: "sender@example.com" },
    content: [
      { type: "text/plain", value: "Plain body" },
      { type: "text/html", value: "<p>HTML body</p>" },
    ],
    reply_to: { email: "reply@example.com", name: "Reply Person" },
  };

  await mailTools.send_mail.handler(mailData);

  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(body.personalizations[0].cc, [{ email: "cc@example.com" }]);
  assert.deepEqual(body.personalizations[0].bcc, [{ email: "bcc@example.com" }]);
  assert.deepEqual(body.personalizations[0].substitutions, { "-name-": "Alice" });
  assert.deepEqual(body.reply_to, { email: "reply@example.com", name: "Reply Person" });
  assert.equal(body.content.length, 2);
});

test("send_mail omits subject, cc, bcc, substitutions, and reply_to when not provided", async () => {
  const calls = mockFetch(sendMailFixture, 202);

  const mailData = {
    personalizations: [{ to: [{ email: "to@example.com" }] }],
    from: { email: "sender@example.com" },
    content: [{ type: "text/plain", value: "Hi" }],
  };

  await mailTools.send_mail.handler(mailData);

  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(body, mailData);
  assert.equal(body.subject, undefined);
  assert.equal(body.reply_to, undefined);
  assert.equal(body.personalizations[0].cc, undefined);
  assert.equal(body.personalizations[0].bcc, undefined);
});

test("send_mail returns the fixture payload embedded in the success message", async () => {
  mockFetch(sendMailFixture, 202);

  const result = await mailTools.send_mail.handler({
    personalizations: [{ to: [{ email: "to@example.com" }] }],
    from: { email: "sender@example.com" },
    content: [{ type: "text/plain", value: "Hi" }],
  });

  assert.equal(
    result.content[0].text,
    `Email sent successfully. Response: ${JSON.stringify(sendMailFixture, null, 2)}`
  );
});
