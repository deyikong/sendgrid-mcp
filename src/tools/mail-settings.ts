import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { ToolResult, jsonToolResult, PassthroughObjectSchema } from "../shared/types.js";
import { checkReadOnlyMode } from "../shared/env.js";

export const mailSettingsTools = {
  get_all_mail_settings: {
    config: {
      title: "Get All Mail Settings",
      description: "Retrieve all mail settings (address whitelist, bounce purge, footer, forward bounce, forward spam, etc.) in one call",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/mail_settings");
      return jsonToolResult(result);
    },
  },

  get_address_whitelist_settings: {
    config: {
      title: "Get Address Whitelist Settings",
      description: "Retrieve the current address whitelist mail setting, which controls which email addresses or domains bypass all suppression lists",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/mail_settings/address_whitelist");
      return jsonToolResult(result);
    },
  },

  update_address_whitelist_settings: {
    config: {
      title: "Update Address Whitelist Settings",
      description: "Update the address whitelist setting that controls which email addresses or domains bypass all suppression lists",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        enabled: z.boolean().optional().describe("Whether the address whitelist setting is enabled"),
        list: z.array(z.string()).optional().describe("Array of email addresses or domains to whitelist"),
      },
    },
    handler: async ({ enabled, list }: { enabled?: boolean; list?: string[] }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const updateData: Record<string, any> = {};

      if (enabled !== undefined) {
        updateData.enabled = enabled;
      }

      if (list !== undefined) {
        updateData.list = list;
      }

      if (Object.keys(updateData).length === 0) {
        return {
          content: [{
            type: "text",
            text: "No updates specified. Please provide at least one field to update (enabled or list)."
          }]
        };
      }

      const result = await makeRequest("https://api.sendgrid.com/v3/mail_settings/address_whitelist", {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
      return jsonToolResult(result);
    },
  },

  get_bounce_purge_settings: {
    config: {
      title: "Get Bounce Purge Settings",
      description: "Retrieve the current bounce purge mail setting, which automatically purges old bounce records after a configured number of days",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/mail_settings/bounce_purge");
      return jsonToolResult(result);
    },
  },

  update_bounce_purge_settings: {
    config: {
      title: "Update Bounce Purge Settings",
      description: "Update the bounce purge setting that automatically purges old bounce records after a configured number of days",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        enabled: z.boolean().optional().describe("Whether the bounce purge setting is enabled"),
        soft_bounces: z.number().optional().describe("Number of days after which soft bounce records are purged"),
        hard_bounces: z.number().optional().describe("Number of days after which hard bounce records are purged"),
      },
    },
    handler: async ({
      enabled,
      soft_bounces,
      hard_bounces
    }: {
      enabled?: boolean;
      soft_bounces?: number;
      hard_bounces?: number;
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const updateData: Record<string, any> = {};

      if (enabled !== undefined) {
        updateData.enabled = enabled;
      }

      if (soft_bounces !== undefined) {
        updateData.soft_bounces = soft_bounces;
      }

      if (hard_bounces !== undefined) {
        updateData.hard_bounces = hard_bounces;
      }

      if (Object.keys(updateData).length === 0) {
        return {
          content: [{
            type: "text",
            text: "No updates specified. Please provide at least one field to update (enabled, soft_bounces, or hard_bounces)."
          }]
        };
      }

      const result = await makeRequest("https://api.sendgrid.com/v3/mail_settings/bounce_purge", {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
      return jsonToolResult(result);
    },
  },

  get_footer_settings: {
    config: {
      title: "Get Footer Settings",
      description: "Retrieve the current footer mail setting, which appends a footer to every outgoing email",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/mail_settings/footer");
      return jsonToolResult(result);
    },
  },

  update_footer_settings: {
    config: {
      title: "Update Footer Settings",
      description: "Update the footer setting that appends a footer to every outgoing email",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        enabled: z.boolean().optional().describe("Whether the footer setting is enabled"),
        html_content: z.string().optional().describe("HTML content to append as the footer"),
        plain_content: z.string().optional().describe("Plain text content to append as the footer"),
      },
    },
    handler: async ({
      enabled,
      html_content,
      plain_content
    }: {
      enabled?: boolean;
      html_content?: string;
      plain_content?: string;
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

      if (Object.keys(updateData).length === 0) {
        return {
          content: [{
            type: "text",
            text: "No updates specified. Please provide at least one field to update (enabled, html_content, or plain_content)."
          }]
        };
      }

      const result = await makeRequest("https://api.sendgrid.com/v3/mail_settings/footer", {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
      return jsonToolResult(result);
    },
  },

  get_forward_bounce_settings: {
    config: {
      title: "Get Forward Bounce Settings",
      description: "Retrieve the current forward bounce mail setting, which forwards bounce notifications to a given email address",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/mail_settings/forward_bounce");
      return jsonToolResult(result);
    },
  },

  update_forward_bounce_settings: {
    config: {
      title: "Update Forward Bounce Settings",
      description: "Update the forward bounce setting that forwards bounce notifications to a given email address",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        enabled: z.boolean().optional().describe("Whether the forward bounce setting is enabled"),
        email: z.string().optional().describe("Email address to forward bounce notifications to"),
      },
    },
    handler: async ({ enabled, email }: { enabled?: boolean; email?: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const updateData: Record<string, any> = {};

      if (enabled !== undefined) {
        updateData.enabled = enabled;
      }

      if (email !== undefined) {
        updateData.email = email;
      }

      if (Object.keys(updateData).length === 0) {
        return {
          content: [{
            type: "text",
            text: "No updates specified. Please provide at least one field to update (enabled or email)."
          }]
        };
      }

      const result = await makeRequest("https://api.sendgrid.com/v3/mail_settings/forward_bounce", {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
      return jsonToolResult(result);
    },
  },

  get_forward_spam_settings: {
    config: {
      title: "Get Forward Spam Settings",
      description: "Retrieve the current forward spam mail setting, which forwards spam report notifications to a given email address",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/mail_settings/forward_spam");
      return jsonToolResult(result);
    },
  },

  update_forward_spam_settings: {
    config: {
      title: "Update Forward Spam Settings",
      description: "Update the forward spam setting that forwards spam report notifications to a given email address",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        enabled: z.boolean().optional().describe("Whether the forward spam setting is enabled"),
        email: z.string().optional().describe("Email address to forward spam report notifications to"),
      },
    },
    handler: async ({ enabled, email }: { enabled?: boolean; email?: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const updateData: Record<string, any> = {};

      if (enabled !== undefined) {
        updateData.enabled = enabled;
      }

      if (email !== undefined) {
        updateData.email = email;
      }

      if (Object.keys(updateData).length === 0) {
        return {
          content: [{
            type: "text",
            text: "No updates specified. Please provide at least one field to update (enabled or email)."
          }]
        };
      }

      const result = await makeRequest("https://api.sendgrid.com/v3/mail_settings/forward_spam", {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
      return jsonToolResult(result);
    },
  },
};
