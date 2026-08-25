import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { ToolResult } from "../shared/types.js";

export const statsTools = {
  get_global_stats: {
    config: {
      title: "Get Global Email Statistics",
      description: "Retrieve global email statistics for your SendGrid account",
      inputSchema: {
        start_date: z.string().describe("Start date in YYYY-MM-DD format"),
        end_date: z.string().optional().describe("End date in YYYY-MM-DD format (defaults to today)"),
        aggregated_by: z.enum(["day", "week", "month"]).optional().default("day").describe("How to group the statistics"),
      },
    },
    handler: async ({ start_date, end_date, aggregated_by }: { start_date: string; end_date?: string; aggregated_by?: string }): Promise<ToolResult> => {
      let url = `https://api.sendgrid.com/v3/stats?start_date=${start_date}`;
      if (end_date) url += `&end_date=${end_date}`;
      if (aggregated_by) url += `&aggregated_by=${aggregated_by}`;
      
      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_stats_by_browser: {
    config: {
      title: "Get Email Statistics by Browser",
      description: "Retrieve email statistics grouped by browser type. Only clicks and unique_clicks metrics are available.",
      inputSchema: {
        start_date: z.string().describe("Start date in YYYY-MM-DD format"),
        end_date: z.string().optional().describe("End date in YYYY-MM-DD format (defaults to today)"),
        aggregated_by: z.enum(["day", "week", "month"]).optional().default("day").describe("How to group the statistics"),
        browsers: z.string().optional().describe("Comma-separated list of browsers to filter by"),
        limit: z.number().int().optional().describe("Number of results to return per page (SendGrid defaults to 500)"),
        offset: z.number().int().optional().describe("Number of results to skip for pagination"),
      },
    },
    handler: async ({ start_date, end_date, aggregated_by, browsers, limit, offset }: { start_date: string; end_date?: string; aggregated_by?: string; browsers?: string; limit?: number; offset?: number }): Promise<ToolResult> => {
      let url = `https://api.sendgrid.com/v3/browsers/stats?start_date=${start_date}`;
      if (end_date) url += `&end_date=${end_date}`;
      if (aggregated_by) url += `&aggregated_by=${aggregated_by}`;
      if (browsers) url += `&browsers=${encodeURIComponent(browsers)}`;
      if (limit !== undefined) url += `&limit=${limit}`;
      if (offset !== undefined) url += `&offset=${offset}`;

      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_stats_by_client_type: {
    config: {
      title: "Get Email Statistics by Client Type",
      description: "Retrieve email statistics grouped by email client type (desktop, mobile, webmail). Only opens and unique_opens metrics are available. This endpoint does not support filtering or pagination.",
      inputSchema: {
        start_date: z.string().describe("Start date in YYYY-MM-DD format"),
        end_date: z.string().optional().describe("End date in YYYY-MM-DD format (defaults to today)"),
        aggregated_by: z.enum(["day", "week", "month"]).optional().default("day").describe("How to group the statistics"),
      },
    },
    handler: async ({ start_date, end_date, aggregated_by }: { start_date: string; end_date?: string; aggregated_by?: string }): Promise<ToolResult> => {
      let url = `https://api.sendgrid.com/v3/clients/stats?start_date=${start_date}`;
      if (end_date) url += `&end_date=${end_date}`;
      if (aggregated_by) url += `&aggregated_by=${aggregated_by}`;

      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_stats_by_device_type: {
    config: {
      title: "Get Email Statistics by Device Type",
      description: "Retrieve email statistics grouped by device type (desktop, mobile, tablet). Only opens and unique_opens metrics are available.",
      inputSchema: {
        start_date: z.string().describe("Start date in YYYY-MM-DD format"),
        end_date: z.string().optional().describe("End date in YYYY-MM-DD format (defaults to today)"),
        aggregated_by: z.enum(["day", "week", "month"]).optional().default("day").describe("How to group the statistics"),
        limit: z.number().int().optional().describe("Number of results to return per page (SendGrid defaults to 500)"),
        offset: z.number().int().optional().describe("Number of results to skip for pagination"),
      },
    },
    handler: async ({ start_date, end_date, aggregated_by, limit, offset }: { start_date: string; end_date?: string; aggregated_by?: string; limit?: number; offset?: number }): Promise<ToolResult> => {
      let url = `https://api.sendgrid.com/v3/devices/stats?start_date=${start_date}`;
      if (end_date) url += `&end_date=${end_date}`;
      if (aggregated_by) url += `&aggregated_by=${aggregated_by}`;
      if (limit !== undefined) url += `&limit=${limit}`;
      if (offset !== undefined) url += `&offset=${offset}`;

      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_stats_by_country: {
    config: {
      title: "Get Email Statistics by Country",
      description: "Retrieve email statistics grouped by country. Only clicks, unique_clicks, opens, and unique_opens metrics are available. Filtering is by country only (no state/province filter exists).",
      inputSchema: {
        start_date: z.string().describe("Start date in YYYY-MM-DD format"),
        end_date: z.string().optional().describe("End date in YYYY-MM-DD format (defaults to today)"),
        aggregated_by: z.enum(["day", "week", "month"]).optional().default("day").describe("How to group the statistics"),
        country: z.string().optional().describe("ISO 3166-1 alpha-2 country code to filter by"),
        limit: z.number().int().optional().describe("Number of results to return per page (SendGrid defaults to 500)"),
        offset: z.number().int().optional().describe("Number of results to skip for pagination"),
      },
    },
    handler: async ({ start_date, end_date, aggregated_by, country, limit, offset }: { start_date: string; end_date?: string; aggregated_by?: string; country?: string; limit?: number; offset?: number }): Promise<ToolResult> => {
      let url = `https://api.sendgrid.com/v3/geo/stats?start_date=${start_date}`;
      if (end_date) url += `&end_date=${end_date}`;
      if (aggregated_by) url += `&aggregated_by=${aggregated_by}`;
      if (country) url += `&country=${encodeURIComponent(country)}`;
      if (limit !== undefined) url += `&limit=${limit}`;
      if (offset !== undefined) url += `&offset=${offset}`;

      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_stats_by_mailbox_provider: {
    config: {
      title: "Get Email Statistics by Mailbox Provider",
      description: "Retrieve email statistics grouped by mailbox provider (Gmail, Outlook, Yahoo, etc.). Broadest metric set of all stats breakdowns: blocks, bounces, clicks, deferred, delivered, drops, opens, processed, requests, spam_reports, unique_clicks, unique_opens. Note: no unsubscribes metric.",
      inputSchema: {
        start_date: z.string().describe("Start date in YYYY-MM-DD format"),
        end_date: z.string().optional().describe("End date in YYYY-MM-DD format (defaults to today)"),
        aggregated_by: z.enum(["day", "week", "month"]).optional().default("day").describe("How to group the statistics"),
        mailbox_providers: z.string().optional().describe("Comma-separated list of mailbox providers to filter by"),
        limit: z.number().int().optional().describe("Number of results to return per page (SendGrid defaults to 500)"),
        offset: z.number().int().optional().describe("Number of results to skip for pagination"),
      },
    },
    handler: async ({ start_date, end_date, aggregated_by, mailbox_providers, limit, offset }: { start_date: string; end_date?: string; aggregated_by?: string; mailbox_providers?: string; limit?: number; offset?: number }): Promise<ToolResult> => {
      let url = `https://api.sendgrid.com/v3/mailbox_providers/stats?start_date=${start_date}`;
      if (end_date) url += `&end_date=${end_date}`;
      if (aggregated_by) url += `&aggregated_by=${aggregated_by}`;
      if (mailbox_providers) url += `&mailbox_providers=${encodeURIComponent(mailbox_providers)}`;
      if (limit !== undefined) url += `&limit=${limit}`;
      if (offset !== undefined) url += `&offset=${offset}`;

      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_category_stats: {
    config: {
      title: "Get Email Statistics by Category",
      description: "Retrieve email statistics for specific categories (available for previous 13 months only)",
      inputSchema: {
        categories: z.string().describe("Comma-separated list of categories to retrieve stats for"),
        start_date: z.string().describe("Start date in YYYY-MM-DD format"),
        end_date: z.string().optional().describe("End date in YYYY-MM-DD format (defaults to today)"),
        aggregated_by: z.enum(["day", "week", "month"]).optional().default("day").describe("How to group the statistics"),
      },
    },
    handler: async ({ categories, start_date, end_date, aggregated_by }: { categories: string; start_date: string; end_date?: string; aggregated_by?: string }): Promise<ToolResult> => {
      let url = `https://api.sendgrid.com/v3/categories/stats?categories=${encodeURIComponent(categories)}&start_date=${start_date}`;
      if (end_date) url += `&end_date=${end_date}`;
      if (aggregated_by) url += `&aggregated_by=${aggregated_by}`;
      
      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_subuser_stats: {
    config: {
      title: "Get Email Statistics by Subuser",
      description: "Retrieve email statistics for specific subusers",
      inputSchema: {
        subusers: z.string().describe("Comma-separated list of subuser names to retrieve stats for"),
        start_date: z.string().describe("Start date in YYYY-MM-DD format"),
        end_date: z.string().optional().describe("End date in YYYY-MM-DD format (defaults to today)"),
        aggregated_by: z.enum(["day", "week", "month"]).optional().default("day").describe("How to group the statistics"),
      },
    },
    handler: async ({ subusers, start_date, end_date, aggregated_by }: { subusers: string; start_date: string; end_date?: string; aggregated_by?: string }): Promise<ToolResult> => {
      let url = `https://api.sendgrid.com/v3/subusers/stats?subusers=${encodeURIComponent(subusers)}&start_date=${start_date}`;
      if (end_date) url += `&end_date=${end_date}`;
      if (aggregated_by) url += `&aggregated_by=${aggregated_by}`;
      
      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_stats_overview: {
    config: {
      title: "Get Statistics Overview",
      description: "Get a comprehensive overview of email statistics across multiple dimensions",
      inputSchema: {
        start_date: z.string().describe("Start date in YYYY-MM-DD format"),
        end_date: z.string().optional().describe("End date in YYYY-MM-DD format (defaults to today)"),
        aggregated_by: z.enum(["day", "week", "month"]).optional().default("day").describe("How to group the statistics"),
        include_subusers: z.boolean().optional().default(false).describe("Include subuser statistics in the overview"),
      },
    },
    handler: async ({ start_date, end_date, aggregated_by, include_subusers }: { start_date: string; end_date?: string; aggregated_by?: string; include_subusers?: boolean }): Promise<ToolResult> => {
      const baseParams = `start_date=${start_date}${end_date ? `&end_date=${end_date}` : ''}${aggregated_by ? `&aggregated_by=${aggregated_by}` : ''}`;
      
      // Fetch multiple stats in parallel for comprehensive overview
      const [globalStats, browserStats, clientStats, geoStats, providerStats] = await Promise.all([
        makeRequest(`https://api.sendgrid.com/v3/stats?${baseParams}`),
        makeRequest(`https://api.sendgrid.com/v3/browsers/stats?${baseParams}`),
        makeRequest(`https://api.sendgrid.com/v3/clients/stats?${baseParams}`),
        makeRequest(`https://api.sendgrid.com/v3/geo/stats?${baseParams}`),
        makeRequest(`https://api.sendgrid.com/v3/mailbox_providers/stats?${baseParams}`)
      ]);

      const overview = {
        period: {
          start_date,
          end_date: end_date || new Date().toISOString().split('T')[0],
          aggregated_by: aggregated_by || 'day'
        },
        global_statistics: globalStats,
        browser_statistics: browserStats,
        client_statistics: clientStats, 
        geographic_statistics: geoStats,
        mailbox_provider_statistics: providerStats
      };

      return { content: [{ type: "text", text: JSON.stringify(overview, null, 2) }] };
    },
  },
};