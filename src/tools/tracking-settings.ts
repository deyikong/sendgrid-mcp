import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { ToolResult, jsonToolResult, PassthroughObjectSchema } from "../shared/types.js";
import { checkReadOnlyMode } from "../shared/env.js";

export const trackingSettingsTools = {
  get_tracking_settings: {
    config: {
      title: "Get All Tracking Settings",
      description: "Retrieve all tracking settings (click, open, subscription, Google Analytics) in one call",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/tracking_settings");
      return jsonToolResult(result);
    },
  },

  get_click_tracking_settings: {
    config: {
      title: "Get Click Tracking Settings",
      description: "Retrieve the current click tracking setting",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/tracking_settings/click");
      return jsonToolResult(result);
    },
  },

  update_click_tracking_settings: {
    config: {
      title: "Update Click Tracking Settings",
      description: "Enable or disable click tracking on links within emails",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        enabled: z.boolean().describe("Whether click tracking should be enabled"),
      },
    },
    handler: async ({ enabled }: { enabled: boolean }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const result = await makeRequest("https://api.sendgrid.com/v3/tracking_settings/click", {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      });
      return jsonToolResult(result);
    },
  },

  get_google_analytics_settings: {
    config: {
      title: "Get Google Analytics Settings",
      description: "Retrieve the current Google Analytics tracking settings",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/tracking_settings/google_analytics");
      return jsonToolResult(result);
    },
  },

  update_google_analytics_settings: {
    config: {
      title: "Update Google Analytics Settings",
      description: "Update Google Analytics tracking settings, including UTM campaign, content, medium, source, and term values",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        enabled: z.boolean().optional().describe("Whether Google Analytics tracking should be enabled"),
        utm_campaign: z.string().optional().describe("Name of the individual campaign"),
        utm_content: z.string().optional().describe("Used to differentiate ads or links that point to the same URL"),
        utm_medium: z.string().optional().describe("Name of the marketing medium (e.g. 'email')"),
        utm_source: z.string().optional().describe("Name of the referrer source (e.g. 'sendgrid.com')"),
        utm_term: z.string().optional().describe("Identifies search terms"),
      },
    },
    handler: async ({
      enabled,
      utm_campaign,
      utm_content,
      utm_medium,
      utm_source,
      utm_term,
    }: {
      enabled?: boolean;
      utm_campaign?: string;
      utm_content?: string;
      utm_medium?: string;
      utm_source?: string;
      utm_term?: string;
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const updateData: Record<string, any> = {};

      if (enabled !== undefined) {
        updateData.enabled = enabled;
      }
      if (utm_campaign !== undefined) {
        updateData.utm_campaign = utm_campaign;
      }
      if (utm_content !== undefined) {
        updateData.utm_content = utm_content;
      }
      if (utm_medium !== undefined) {
        updateData.utm_medium = utm_medium;
      }
      if (utm_source !== undefined) {
        updateData.utm_source = utm_source;
      }
      if (utm_term !== undefined) {
        updateData.utm_term = utm_term;
      }

      if (Object.keys(updateData).length === 0) {
        return {
          content: [{
            type: "text",
            text: "No updates specified. Please provide at least one field to update (enabled, utm_campaign, utm_content, utm_medium, utm_source, or utm_term)."
          }]
        };
      }

      const result = await makeRequest("https://api.sendgrid.com/v3/tracking_settings/google_analytics", {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
      return jsonToolResult(result);
    },
  },

  get_open_tracking_settings: {
    config: {
      title: "Get Open Tracking Settings",
      description: "Retrieve the current open tracking setting",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/tracking_settings/open");
      return jsonToolResult(result);
    },
  },

  update_open_tracking_settings: {
    config: {
      title: "Update Open Tracking Settings",
      description: "Enable or disable open tracking, which inserts an invisible pixel to record when an email is opened",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        enabled: z.boolean().describe("Whether open tracking should be enabled"),
      },
    },
    handler: async ({ enabled }: { enabled: boolean }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const result = await makeRequest("https://api.sendgrid.com/v3/tracking_settings/open", {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      });
      return jsonToolResult(result);
    },
  },

  get_subscription_tracking_settings: {
    config: {
      title: "Get Subscription Tracking Settings",
      description: "Retrieve the current subscription tracking settings",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/tracking_settings/subscription");
      return jsonToolResult(result);
    },
  },

  update_subscription_tracking_settings: {
    config: {
      title: "Update Subscription Tracking Settings",
      description: "Update subscription tracking settings, including the unsubscribe link content, landing page, URL, and replacement tag",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        enabled: z.boolean().optional().describe("Whether subscription tracking should be enabled"),
        html_content: z.string().optional().describe("HTML to be appended to the email with the unsubscribe link"),
        plain_content: z.string().optional().describe("Text to be appended to the plain text email with the unsubscribe link"),
        landing: z.string().optional().describe("Landing page HTML shown after a recipient unsubscribes"),
        url: z.string().optional().describe("URL to which the recipient is redirected after unsubscribing"),
        replace: z.string().optional().describe("Tag in the email content that is replaced with the unsubscribe link"),
      },
    },
    handler: async ({
      enabled,
      html_content,
      plain_content,
      landing,
      url,
      replace,
    }: {
      enabled?: boolean;
      html_content?: string;
      plain_content?: string;
      landing?: string;
      url?: string;
      replace?: string;
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const updateData: Record<string, any> = {};

      if (enabled !== undefined) {
        updateData.enabled = enabled;
      }
      if (html_content !== undefined) {
        updateData.html_content = html_content;
      }
      if (plain_content !== undefined) {
        updateData.plain_content = plain_content;
      }
      if (landing !== undefined) {
        updateData.landing = landing;
      }
      if (url !== undefined) {
        updateData.url = url;
      }
      if (replace !== undefined) {
        updateData.replace = replace;
      }

      if (Object.keys(updateData).length === 0) {
        return {
          content: [{
            type: "text",
            text: "No updates specified. Please provide at least one field to update (enabled, html_content, plain_content, landing, url, or replace)."
          }]
        };
      }

      const result = await makeRequest("https://api.sendgrid.com/v3/tracking_settings/subscription", {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
      return jsonToolResult(result);
    },
  },
};
