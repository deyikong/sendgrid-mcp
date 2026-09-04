import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { ToolResult, jsonToolResult, PassthroughObjectSchema } from "../shared/types.js";

export const ipTools = {
  list_ip_addresses: {
    config: {
      title: "List IP Addresses",
      description: "List all IP addresses assigned to the account",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/ips");
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_ip_address: {
    config: {
      title: "Get IP Address",
      description: "Get details for a specific IP address, including its warmup status and assigned subusers",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        ip_address: z.string().describe("The IP address to retrieve"),
      },
    },
    handler: async ({ ip_address }: { ip_address: string }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/ips/${encodeURIComponent(ip_address)}`);
      return jsonToolResult(result);
    },
  },

  list_assigned_ips: {
    config: {
      title: "List Assigned IP Addresses",
      description: "List all IP addresses that are currently assigned to a subuser",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/ips/assigned");
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  list_ip_pools: {
    config: {
      title: "List IP Pools",
      description: "List all IP pools on the account",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/ips/pools");
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_ip_pool: {
    config: {
      title: "Get IP Pool",
      description: "Get details for a specific IP pool, including the IP addresses it contains",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        pool_name: z.string().describe("Name of the IP pool to retrieve"),
      },
    },
    handler: async ({ pool_name }: { pool_name: string }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/ips/pools/${encodeURIComponent(pool_name)}`);
      return jsonToolResult(result);
    },
  },

  get_remaining_ips: {
    config: {
      title: "Get Remaining IPs",
      description: "Get the count and cost of additional dedicated IP addresses available for purchase",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/ips/remaining");
      return jsonToolResult(result);
    },
  },

  list_ip_warmups: {
    config: {
      title: "List IP Warmups",
      description: "List all IP addresses currently in the warmup process",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/ips/warmup");
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_ip_warmup_status: {
    config: {
      title: "Get IP Warmup Status",
      description: "Get the warmup status for a specific IP address",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        ip_address: z.string().describe("The IP address to check warmup status for"),
      },
    },
    handler: async ({ ip_address }: { ip_address: string }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/ips/warmup/${encodeURIComponent(ip_address)}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  list_allowed_ips: {
    config: {
      title: "List Allowed IPs",
      description: "List IP addresses allowed to access the account via the API/UI (the access allowlist)",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/access_settings/whitelist");
      return jsonToolResult(result);
    },
  },

  get_allowed_ip: {
    config: {
      title: "Get Allowed IP",
      description: "Get details for a specific entry in the access allowlist",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        rule_id: z.number().describe("ID of the allowlist rule to retrieve"),
      },
    },
    handler: async ({ rule_id }: { rule_id: number }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/access_settings/whitelist/${rule_id}`);
      return jsonToolResult(result);
    },
  },

  list_access_activity: {
    config: {
      title: "List Access Activity",
      description: "List recent account access attempts (successful and blocked logins/API calls)",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        limit: z.number().optional().describe("Number of access activity entries to return"),
      },
    },
    handler: async ({ limit }: { limit?: number }): Promise<ToolResult> => {
      let url = "https://api.sendgrid.com/v3/access_settings/activity";
      if (limit !== undefined) url += `?limit=${limit}`;
      const result = await makeRequest(url);
      return jsonToolResult(result);
    },
  },
};
