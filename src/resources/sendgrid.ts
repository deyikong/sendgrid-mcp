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

  "sendgrid://stats": {
    config: {
      name: "Email Statistics",
      description: "Global email statistics and performance metrics",
      mimeType: "application/json",
    },
    handler: async () => {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
      
      const [globalStats, browserStats, geoStats, providerStats] = await Promise.all([
        makeRequest(`https://api.sendgrid.com/v3/stats?start_date=${startDate}&end_date=${endDate}&aggregated_by=day`),
        makeRequest(`https://api.sendgrid.com/v3/browsers/stats?start_date=${startDate}&end_date=${endDate}&aggregated_by=day`),
        makeRequest(`https://api.sendgrid.com/v3/geo/stats?start_date=${startDate}&end_date=${endDate}&aggregated_by=day`),
        makeRequest(`https://api.sendgrid.com/v3/mailbox_providers/stats?start_date=${startDate}&end_date=${endDate}&aggregated_by=day`)
      ]);

      const statsOverview = {
        period: { start_date: startDate, end_date: endDate },
        global_stats: globalStats,
        browser_stats: browserStats,
        geographic_stats: geoStats,
        mailbox_provider_stats: providerStats
      };

      return {
        contents: [
          {
            uri: "sendgrid://stats",
            mimeType: "application/json",
            text: JSON.stringify(statsOverview, null, 2),
          },
        ],
      };
    },
  },

  "sendgrid://stats/browsers": {
    config: {
      name: "Email Statistics by Browser",
      description: "Email performance metrics broken down by browser type",
      mimeType: "application/json",
    },
    handler: async () => {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days ago
      
      const browserStats = await makeRequest(`https://api.sendgrid.com/v3/browsers/stats?start_date=${startDate}&end_date=${endDate}&aggregated_by=day`);
      
      return {
        contents: [
          {
            uri: "sendgrid://stats/browsers",
            mimeType: "application/json",
            text: JSON.stringify(browserStats, null, 2),
          },
        ],
      };
    },
  },

  "sendgrid://stats/devices": {
    config: {
      name: "Email Statistics by Device Type",
      description: "Email performance metrics broken down by device type (desktop, mobile, tablet)",
      mimeType: "application/json",
    },
    handler: async () => {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days ago
      
      const deviceStats = await makeRequest(`https://api.sendgrid.com/v3/clients/stats?start_date=${startDate}&end_date=${endDate}&aggregated_by=day`);
      
      return {
        contents: [
          {
            uri: "sendgrid://stats/devices",
            mimeType: "application/json",
            text: JSON.stringify(deviceStats, null, 2),
          },
        ],
      };
    },
  },

  "sendgrid://stats/geography": {
    config: {
      name: "Email Statistics by Geography",
      description: "Email performance metrics broken down by country and region",
      mimeType: "application/json",
    },
    handler: async () => {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days ago
      
      const geoStats = await makeRequest(`https://api.sendgrid.com/v3/geo/stats?start_date=${startDate}&end_date=${endDate}&aggregated_by=day`);
      
      return {
        contents: [
          {
            uri: "sendgrid://stats/geography",
            mimeType: "application/json",
            text: JSON.stringify(geoStats, null, 2),
          },
        ],
      };
    },
  },

  "sendgrid://stats/providers": {
    config: {
      name: "Email Statistics by Mailbox Provider",
      description: "Email performance metrics broken down by mailbox provider (Gmail, Outlook, Yahoo, etc.)",
      mimeType: "application/json",
    },
    handler: async () => {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days ago
      
      const providerStats = await makeRequest(`https://api.sendgrid.com/v3/mailbox_providers/stats?start_date=${startDate}&end_date=${endDate}&aggregated_by=day`);
      
      return {
        contents: [
          {
            uri: "sendgrid://stats/providers",
            mimeType: "application/json",
            text: JSON.stringify(providerStats, null, 2),
          },
        ],
      };
    },
  },
};