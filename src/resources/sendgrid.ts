import { makeRequest } from "../shared/api.js";

export const sendgridResources = {
  "sendgrid://automations": {
    config: {
      name: "Marketing Automations",
      description: "List and manage SendGrid marketing automations",
      mimeType: "application/json",
    },
    handler: async () => {
      const automations = await makeRequest("https://api.sendgrid.com/v3/marketing/automations?offset=0&limit=50");
      return {
        contents: [
          {
            uri: "sendgrid://automations",
            mimeType: "application/json",
            text: JSON.stringify(automations, null, 2),
          },
        ],
      };
    },
  },

  "sendgrid://singlesends": {
    config: {
      name: "Single Sends",
      description: "List and manage SendGrid single send campaigns",
      mimeType: "application/json",
    },
    handler: async () => {
      const singleSends = await makeRequest("https://api.sendgrid.com/v3/marketing/singlesends/search?page_size=50");
      return {
        contents: [
          {
            uri: "sendgrid://singlesends",
            mimeType: "application/json",
            text: JSON.stringify(singleSends, null, 2),
          },
        ],
      };
    },
  },

  "sendgrid://lists": {
    config: {
      name: "Email Lists",
      description: "Manage email lists and segments",
      mimeType: "application/json",
    },
    handler: async () => {
      const lists = await makeRequest("https://api.sendgrid.com/v3/marketing/lists?page_size=1000");
      return {
        contents: [
          {
            uri: "sendgrid://lists",
            mimeType: "application/json",
            text: JSON.stringify(lists, null, 2),
          },
        ],
      };
    },
  },

  "sendgrid://contacts": {
    config: {
      name: "Contacts",
      description: "Manage marketing contacts",
      mimeType: "application/json",
    },
    handler: async () => {
      const segments = await makeRequest("https://api.sendgrid.com/v3/marketing/segments");
      return {
        contents: [
          {
            uri: "sendgrid://contacts",
            mimeType: "application/json",
            text: JSON.stringify(segments, null, 2),
          },
        ],
      };
    },
  },

  "sendgrid://suppressions": {
    config: {
      name: "Suppressions",
      description: "View suppression lists (bounces, spam reports, unsubscribes)",
      mimeType: "application/json",
    },
    handler: async () => {
      const [bounces, spamReports, blocks, invalidEmails, globalUnsubscribes] = await Promise.all([
        makeRequest("https://api.sendgrid.com/v3/suppression/bounces?offset=0&limit=50"),
        makeRequest("https://api.sendgrid.com/v3/suppression/spam_reports?offset=0&limit=50"),
        makeRequest("https://api.sendgrid.com/v3/suppression/blocks?offset=0&limit=50"),
        makeRequest("https://api.sendgrid.com/v3/suppression/invalid_emails?offset=0&limit=50"),
        makeRequest("https://api.sendgrid.com/v3/suppression/unsubscribes?offset=0&limit=50"),
      ]);
      return {
        contents: [
          {
            uri: "sendgrid://suppressions",
            mimeType: "application/json",
            text: JSON.stringify({ bounces, spamReports, blocks, invalidEmails, globalUnsubscribes }, null, 2),
          },
        ],
      };
    },
  },

  "sendgrid://account": {
    config: {
      name: "Account Settings",
      description: "Account profile and settings information",
      mimeType: "application/json",
    },
    handler: async () => {
      const account = await makeRequest("https://api.sendgrid.com/v3/account/profile_v2");
      return {
        contents: [
          {
            uri: "sendgrid://account",
            mimeType: "application/json",
            text: JSON.stringify(account, null, 2),
          },
        ],
      };
    },
  },
};