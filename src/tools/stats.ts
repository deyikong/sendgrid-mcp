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
      description: "Retrieve email statistics grouped by browser type",
      inputSchema: {
        start_date: z.string().describe("Start date in YYYY-MM-DD format"),
        end_date: z.string().optional().describe("End date in YYYY-MM-DD format (defaults to today)"),
        aggregated_by: z.enum(["day", "week", "month"]).optional().default("day").describe("How to group the statistics"),
        browsers: z.string().optional().describe("Comma-separated list of browsers to filter by"),
      },
    },
    handler: async ({ start_date, end_date, aggregated_by, browsers }: { start_date: string; end_date?: string; aggregated_by?: string; browsers?: string }): Promise<ToolResult> => {
      let url = `https://api.sendgrid.com/v3/browsers/stats?start_date=${start_date}`;
      if (end_date) url += `&end_date=${end_date}`;
      if (aggregated_by) url += `&aggregated_by=${aggregated_by}`;
      if (browsers) url += `&browsers=${encodeURIComponent(browsers)}`;
      
      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_stats_by_client_type: {
    config: {
      title: "Get Email Statistics by Client Type",
      description: "Retrieve email statistics grouped by email client type",
      inputSchema: {
        start_date: z.string().describe("Start date in YYYY-MM-DD format"),
        end_date: z.string().optional().describe("End date in YYYY-MM-DD format (defaults to today)"),
        aggregated_by: z.enum(["day", "week", "month"]).optional().default("day").describe("How to group the statistics"),
        client_type: z.string().optional().describe("Comma-separated list of client types to filter by"),
      },
    },
    handler: async ({ start_date, end_date, aggregated_by, client_type }: { start_date: string; end_date?: string; aggregated_by?: string; client_type?: string }): Promise<ToolResult> => {
      let url = `https://api.sendgrid.com/v3/clients/stats?start_date=${start_date}`;
      if (end_date) url += `&end_date=${end_date}`;
      if (aggregated_by) url += `&aggregated_by=${aggregated_by}`;
      if (client_type) url += `&client_type=${encodeURIComponent(client_type)}`;
      
      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_stats_by_device_type: {
    config: {
      title: "Get Email Statistics by Device Type",
      description: "Retrieve email statistics grouped by device type (desktop, mobile, tablet)",
      inputSchema: {
        start_date: z.string().describe("Start date in YYYY-MM-DD format"),
        end_date: z.string().optional().describe("End date in YYYY-MM-DD format (defaults to today)"),
        aggregated_by: z.enum(["day", "week", "month"]).optional().default("day").describe("How to group the statistics"),
        device_type: z.string().optional().describe("Comma-separated list of device types to filter by"),
      },
    },
    handler: async ({ start_date, end_date, aggregated_by, device_type }: { start_date: string; end_date?: string; aggregated_by?: string; device_type?: string }): Promise<ToolResult> => {
      let url = `https://api.sendgrid.com/v3/clients/stats?start_date=${start_date}`;
      if (end_date) url += `&end_date=${end_date}`;
      if (aggregated_by) url += `&aggregated_by=${aggregated_by}`;
      if (device_type) url += `&device_type=${encodeURIComponent(device_type)}`;
      
      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_stats_by_country: {
    config: {
      title: "Get Email Statistics by Country and State/Province",
      description: "Retrieve email statistics grouped by geographic location",
      inputSchema: {
        start_date: z.string().describe("Start date in YYYY-MM-DD format"),
        end_date: z.string().optional().describe("End date in YYYY-MM-DD format (defaults to today)"),
        aggregated_by: z.enum(["day", "week", "month"]).optional().default("day").describe("How to group the statistics"),
        country: z.string().optional().describe("ISO 3166-1 alpha-2 country code to filter by"),
        state: z.string().optional().describe("State or province to filter by"),
      },
    },
    handler: async ({ start_date, end_date, aggregated_by, country, state }: { start_date: string; end_date?: string; aggregated_by?: string; country?: string; state?: string }): Promise<ToolResult> => {
      let url = `https://api.sendgrid.com/v3/geo/stats?start_date=${start_date}`;
      if (end_date) url += `&end_date=${end_date}`;
      if (aggregated_by) url += `&aggregated_by=${aggregated_by}`;
      if (country) url += `&country=${encodeURIComponent(country)}`;
      if (state) url += `&state=${encodeURIComponent(state)}`;
      
      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_stats_by_mailbox_provider: {
    config: {
      title: "Get Email Statistics by Mailbox Provider",
      description: "Retrieve email statistics grouped by mailbox provider (Gmail, Outlook, Yahoo, etc.)",
      inputSchema: {
        start_date: z.string().describe("Start date in YYYY-MM-DD format"),
        end_date: z.string().optional().describe("End date in YYYY-MM-DD format (defaults to today)"),
        aggregated_by: z.enum(["day", "week", "month"]).optional().default("day").describe("How to group the statistics"),
        mailbox_providers: z.string().optional().describe("Comma-separated list of mailbox providers to filter by"),
      },
    },
    handler: async ({ start_date, end_date, aggregated_by, mailbox_providers }: { start_date: string; end_date?: string; aggregated_by?: string; mailbox_providers?: string }): Promise<ToolResult> => {
      let url = `https://api.sendgrid.com/v3/mailbox_providers/stats?start_date=${start_date}`;
      if (end_date) url += `&end_date=${end_date}`;
      if (aggregated_by) url += `&aggregated_by=${aggregated_by}`;
      if (mailbox_providers) url += `&mailbox_providers=${encodeURIComponent(mailbox_providers)}`;
      
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