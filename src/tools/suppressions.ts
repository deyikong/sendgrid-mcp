import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { ToolResult, jsonToolResult, PassthroughObjectSchema } from "../shared/types.js";
import { checkReadOnlyMode } from "../shared/env.js";

export const suppressionTools = {
  list_suppression_groups: {
    config: {
      title: "List Suppression Groups",
      description: "List all unsubscribe (suppression) groups on the account",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/asm/groups");
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  create_suppression_group: {
    config: {
      title: "Create Suppression Group",
      description: "Create a new unsubscribe (suppression) group",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        name: z.string().describe("Name of the suppression group"),
        description: z.string().optional().describe("Description of the suppression group"),
        is_default: z.boolean().optional().describe("Whether this group is the default unsubscribe group"),
      },
    },
    handler: async ({
      name,
      description,
      is_default,
    }: {
      name: string;
      description?: string;
      is_default?: boolean;
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const body: Record<string, any> = { name };
      if (description !== undefined) body.description = description;
      if (is_default !== undefined) body.is_default = is_default;

      const result = await makeRequest("https://api.sendgrid.com/v3/asm/groups", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return jsonToolResult(result);
    },
  },

  get_suppression_group: {
    config: {
      title: "Get Suppression Group",
      description: "Get details about a specific unsubscribe (suppression) group",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        group_id: z.number().describe("The suppression group ID to retrieve"),
      },
    },
    handler: async ({ group_id }: { group_id: number }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/asm/groups/${group_id}`);
      return jsonToolResult(result);
    },
  },

  update_suppression_group: {
    config: {
      title: "Update Suppression Group",
      description: "Update the name, description, or default status of an existing suppression group",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        group_id: z.number().describe("The suppression group ID to update"),
        name: z.string().optional().describe("New name for the suppression group"),
        description: z.string().optional().describe("New description for the suppression group"),
        is_default: z.boolean().optional().describe("Whether this group should be the default unsubscribe group"),
      },
    },
    handler: async ({
      group_id,
      name,
      description,
      is_default,
    }: {
      group_id: number;
      name?: string;
      description?: string;
      is_default?: boolean;
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const updateData: Record<string, any> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (is_default !== undefined) updateData.is_default = is_default;

      if (Object.keys(updateData).length === 0) {
        return {
          content: [{
            type: "text",
            text: "No updates specified. Please provide at least one field to update (name, description, or is_default)."
          }]
        };
      }

      const result = await makeRequest(`https://api.sendgrid.com/v3/asm/groups/${group_id}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
      return jsonToolResult(result);
    },
  },

  delete_suppression_group: {
    config: {
      title: "Delete Suppression Group",
      description: "Permanently delete an unsubscribe (suppression) group. This action cannot be undone.",
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        group_id: z.number().describe("The suppression group ID to delete"),
      },
    },
    handler: async ({ group_id }: { group_id: number }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      await makeRequest(`https://api.sendgrid.com/v3/asm/groups/${group_id}`, {
        method: "DELETE",
      });

      return {
        content: [{
          type: "text",
          text: `Suppression group ${group_id} deleted successfully.`
        }]
      };
    },
  },

  list_group_suppressions: {
    config: {
      title: "List Group Suppressions",
      description: "List all email addresses that are unsubscribed from a specific suppression group",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        group_id: z.number().describe("The suppression group ID"),
      },
    },
    handler: async ({ group_id }: { group_id: number }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/asm/groups/${group_id}/suppressions`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  add_group_suppressions: {
    config: {
      title: "Add Group Suppressions",
      description: "Add one or more email addresses to a specific suppression group's unsubscribe list",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        group_id: z.number().describe("The suppression group ID"),
        recipient_emails: z.array(z.string()).describe("Array of email addresses to add to the suppression group"),
      },
    },
    handler: async ({
      group_id,
      recipient_emails,
    }: {
      group_id: number;
      recipient_emails: string[];
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const result = await makeRequest(`https://api.sendgrid.com/v3/asm/groups/${group_id}/suppressions`, {
        method: "POST",
        body: JSON.stringify({ recipient_emails }),
      });
      return jsonToolResult(result);
    },
  },

  remove_group_suppression: {
    config: {
      title: "Remove Group Suppression",
      description: "Remove a single email address from a specific suppression group's unsubscribe list. This only re-permits mail assigned to this group's category -- it is not a global resubscribe.",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        group_id: z.number().describe("The suppression group ID"),
        email: z.string().describe("The email address to remove from the group's suppressions"),
      },
    },
    handler: async ({ group_id, email }: { group_id: number; email: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      await makeRequest(`https://api.sendgrid.com/v3/asm/groups/${group_id}/suppressions/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });

      return {
        content: [{
          type: "text",
          text: `${email} removed from suppression group ${group_id} successfully. Note: this only removes the address from this group's unsubscribe list, not from any other group or the global suppression list.`
        }]
      };
    },
  },

  list_global_suppressions: {
    config: {
      title: "List Global Suppressions",
      description: "List email addresses on the account-wide global unsubscribe list, optionally filtered by a time range",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        start_time: z.number().optional().describe("Unix timestamp for the start of the search range"),
        end_time: z.number().optional().describe("Unix timestamp for the end of the search range"),
      },
    },
    handler: async ({ start_time, end_time }: { start_time?: number; end_time?: number }): Promise<ToolResult> => {
      let url = "https://api.sendgrid.com/v3/suppression/unsubscribes";
      const params: string[] = [];
      if (start_time !== undefined) params.push(`start_time=${start_time}`);
      if (end_time !== undefined) params.push(`end_time=${end_time}`);
      if (params.length > 0) url += `?${params.join("&")}`;

      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  add_global_suppression: {
    config: {
      title: "Add Global Suppression",
      description: "Add recipients to the account-wide global unsubscribe list -- they will stop receiving all non-transactional mail from this account",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        recipient_emails: z.array(z.string()).describe("Array of email addresses to add to the global suppression list"),
      },
    },
    handler: async ({ recipient_emails }: { recipient_emails: string[] }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const result = await makeRequest("https://api.sendgrid.com/v3/asm/suppressions/global", {
        method: "POST",
        body: JSON.stringify({ recipient_emails }),
      });
      return jsonToolResult(result);
    },
  },

  get_global_suppression: {
    config: {
      title: "Get Global Suppression",
      description: "Check whether a specific email address is on the account-wide global unsubscribe list",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        email: z.string().describe("The email address to check"),
      },
    },
    handler: async ({ email }: { email: string }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/asm/suppressions/global/${encodeURIComponent(email)}`);
      return jsonToolResult(result);
    },
  },

  delete_global_suppression: {
    config: {
      title: "Delete Global Suppression",
      description: "Remove an email address from the account-wide global suppression list, effectively resubscribing them to non-transactional mail",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        email: z.string().describe("The email address to remove from the global suppression list"),
      },
    },
    handler: async ({ email }: { email: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      await makeRequest(`https://api.sendgrid.com/v3/asm/suppressions/global/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });

      return {
        content: [{
          type: "text",
          text: `${email} removed from the global suppression list successfully.`
        }]
      };
    },
  },

  list_bounces: {
    config: {
      title: "List Bounces",
      description: "List all email addresses that have bounced, optionally filtered by a time range",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        start_time: z.number().optional().describe("Unix timestamp for the start of the search range"),
        end_time: z.number().optional().describe("Unix timestamp for the end of the search range"),
      },
    },
    handler: async ({ start_time, end_time }: { start_time?: number; end_time?: number }): Promise<ToolResult> => {
      let url = "https://api.sendgrid.com/v3/suppression/bounces";
      const params: string[] = [];
      if (start_time !== undefined) params.push(`start_time=${start_time}`);
      if (end_time !== undefined) params.push(`end_time=${end_time}`);
      if (params.length > 0) url += `?${params.join("&")}`;

      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_bounce: {
    config: {
      title: "Get Bounce",
      description: "Get bounce event(s) recorded for a specific email address",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        email: z.string().describe("The email address to look up"),
      },
    },
    handler: async ({ email }: { email: string }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/suppression/bounces/${encodeURIComponent(email)}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  delete_bounce: {
    config: {
      title: "Delete Bounce",
      description: "Remove a bounce record for an email address so this address can receive mail again",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        email: z.string().describe("The email address to remove from the bounce list"),
      },
    },
    handler: async ({ email }: { email: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      await makeRequest(`https://api.sendgrid.com/v3/suppression/bounces/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });

      return {
        content: [{
          type: "text",
          text: `Bounce record for ${email} deleted successfully. This address can receive mail again.`
        }]
      };
    },
  },

  list_blocks: {
    config: {
      title: "List Blocks",
      description: "List all email addresses currently on the blocks list, optionally filtered by a time range",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        start_time: z.number().optional().describe("Unix timestamp for the start of the search range"),
        end_time: z.number().optional().describe("Unix timestamp for the end of the search range"),
      },
    },
    handler: async ({ start_time, end_time }: { start_time?: number; end_time?: number }): Promise<ToolResult> => {
      let url = "https://api.sendgrid.com/v3/suppression/blocks";
      const params: string[] = [];
      if (start_time !== undefined) params.push(`start_time=${start_time}`);
      if (end_time !== undefined) params.push(`end_time=${end_time}`);
      if (params.length > 0) url += `?${params.join("&")}`;

      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  delete_block: {
    config: {
      title: "Delete Block",
      description: "Remove an email address from the blocks list so this address can receive mail again",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        email: z.string().describe("The email address to remove from the blocks list"),
      },
    },
    handler: async ({ email }: { email: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      await makeRequest(`https://api.sendgrid.com/v3/suppression/blocks/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });

      return {
        content: [{
          type: "text",
          text: `Block record for ${email} deleted successfully. This address can receive mail again.`
        }]
      };
    },
  },

  list_spam_reports: {
    config: {
      title: "List Spam Reports",
      description: "List all email addresses that have reported mail as spam, optionally filtered by a time range",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        start_time: z.number().optional().describe("Unix timestamp for the start of the search range"),
        end_time: z.number().optional().describe("Unix timestamp for the end of the search range"),
      },
    },
    handler: async ({ start_time, end_time }: { start_time?: number; end_time?: number }): Promise<ToolResult> => {
      let url = "https://api.sendgrid.com/v3/suppression/spam_reports";
      const params: string[] = [];
      if (start_time !== undefined) params.push(`start_time=${start_time}`);
      if (end_time !== undefined) params.push(`end_time=${end_time}`);
      if (params.length > 0) url += `?${params.join("&")}`;

      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  delete_spam_report: {
    config: {
      title: "Delete Spam Report",
      description: "Remove an email address from the spam reports list so this address can receive mail again",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        email: z.string().describe("The email address to remove from the spam reports list"),
      },
    },
    handler: async ({ email }: { email: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      await makeRequest(`https://api.sendgrid.com/v3/suppression/spam_reports/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });

      return {
        content: [{
          type: "text",
          text: `Spam report for ${email} deleted successfully. This address can receive mail again.`
        }]
      };
    },
  },

  list_invalid_emails: {
    config: {
      title: "List Invalid Emails",
      description: "List all email addresses that have been marked invalid, optionally filtered by a time range",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        start_time: z.number().optional().describe("Unix timestamp for the start of the search range"),
        end_time: z.number().optional().describe("Unix timestamp for the end of the search range"),
      },
    },
    handler: async ({ start_time, end_time }: { start_time?: number; end_time?: number }): Promise<ToolResult> => {
      let url = "https://api.sendgrid.com/v3/suppression/invalid_emails";
      const params: string[] = [];
      if (start_time !== undefined) params.push(`start_time=${start_time}`);
      if (end_time !== undefined) params.push(`end_time=${end_time}`);
      if (params.length > 0) url += `?${params.join("&")}`;

      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  delete_invalid_email: {
    config: {
      title: "Delete Invalid Email",
      description: "Remove an email address from the invalid emails list so this address can receive mail again",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        email: z.string().describe("The email address to remove from the invalid emails list"),
      },
    },
    handler: async ({ email }: { email: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      await makeRequest(`https://api.sendgrid.com/v3/suppression/invalid_emails/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });

      return {
        content: [{
          type: "text",
          text: `Invalid email record for ${email} deleted successfully. This address can receive mail again.`
        }]
      };
    },
  },
};
