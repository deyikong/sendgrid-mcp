import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { ToolResult, jsonToolResult, PassthroughObjectSchema } from "../shared/types.js";
import { checkReadOnlyMode } from "../shared/env.js";

export const domainAuthTools = {
  list_authenticated_domains: {
    config: {
      title: "List Authenticated Domains",
      description: "List all authenticated (whitelabel) domains configured for sending mail",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/whitelabel/domains");
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_authenticated_domain: {
    config: {
      title: "Get Authenticated Domain",
      description: "Get detailed information about a specific authenticated domain, including its DNS records",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        domain_id: z.number().describe("The ID of the authenticated domain to retrieve"),
      },
    },
    handler: async ({ domain_id }: { domain_id: number }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/whitelabel/domains/${domain_id}`);
      return jsonToolResult(result);
    },
  },

  create_authenticated_domain: {
    config: {
      title: "Create Authenticated Domain",
      description: "Set up domain authentication (SPF/DKIM) for sending mail from a custom domain",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        domain: z.string().describe("The domain to authenticate (e.g. example.com)"),
        subdomain: z.string().optional().describe("The subdomain to use for the authenticated domain's DNS records"),
        custom_spf: z.boolean().optional().describe("Whether to use a custom SPF record instead of the default"),
        default: z.boolean().optional().describe("Whether to make this the default domain for sending"),
        automatic_security: z.boolean().optional().describe("Whether to enable automated security (DKIM signing via CNAMEs)"),
      },
    },
    handler: async ({
      domain,
      subdomain,
      custom_spf,
      default: isDefault,
      automatic_security,
    }: {
      domain: string;
      subdomain?: string;
      custom_spf?: boolean;
      default?: boolean;
      automatic_security?: boolean;
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const requestBody: Record<string, any> = { domain };
      if (subdomain !== undefined) requestBody.subdomain = subdomain;
      if (custom_spf !== undefined) requestBody.custom_spf = custom_spf;
      if (isDefault !== undefined) requestBody.default = isDefault;
      if (automatic_security !== undefined) requestBody.automatic_security = automatic_security;

      const result = await makeRequest("https://api.sendgrid.com/v3/whitelabel/domains", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      return jsonToolResult(result);
    },
  },

  update_authenticated_domain: {
    config: {
      title: "Update Authenticated Domain",
      description: "Update the custom SPF or default settings of an existing authenticated domain",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        domain_id: z.number().describe("The ID of the authenticated domain to update"),
        custom_spf: z.boolean().optional().describe("Whether to use a custom SPF record instead of the default"),
        default: z.boolean().optional().describe("Whether to make this the default domain for sending"),
      },
    },
    handler: async ({
      domain_id,
      custom_spf,
      default: isDefault,
    }: {
      domain_id: number;
      custom_spf?: boolean;
      default?: boolean;
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const updateData: Record<string, any> = {};
      if (custom_spf !== undefined) updateData.custom_spf = custom_spf;
      if (isDefault !== undefined) updateData.default = isDefault;

      if (Object.keys(updateData).length === 0) {
        return {
          content: [{
            type: "text",
            text: "No updates specified. Please provide at least one field to update (custom_spf or default)."
          }]
        };
      }

      const result = await makeRequest(
        `https://api.sendgrid.com/v3/whitelabel/domains/${domain_id}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );
      return jsonToolResult(result);
    },
  },

  delete_authenticated_domain: {
    config: {
      title: "Delete Authenticated Domain",
      description: "Permanently delete an authenticated domain. This action cannot be undone.",
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        domain_id: z.number().describe("The ID of the authenticated domain to delete"),
      },
    },
    handler: async ({ domain_id }: { domain_id: number }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      await makeRequest(
        `https://api.sendgrid.com/v3/whitelabel/domains/${domain_id}`,
        {
          method: "DELETE",
        }
      );

      return {
        content: [{
          type: "text",
          text: `Authenticated domain ${domain_id} deleted successfully.`
        }]
      };
    },
  },

  validate_authenticated_domain: {
    config: {
      title: "Validate Authenticated Domain",
      description: "Check whether the domain's DNS records are correctly configured for authentication",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        id: z.number().describe("The ID of the authenticated domain to validate"),
      },
    },
    handler: async ({ id }: { id: number }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const result = await makeRequest(
        `https://api.sendgrid.com/v3/whitelabel/domains/${id}/validate`,
        {
          method: "POST",
        }
      );
      return jsonToolResult(result);
    },
  },

  get_default_authenticated_domain: {
    config: {
      title: "Get Default Authenticated Domain",
      description: "Get the authenticated domain currently set as the default for sending mail",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/whitelabel/domains/default");
      return jsonToolResult(result);
    },
  },

  list_branded_links: {
    config: {
      title: "List Branded Links",
      description: "List all branded links (link whitelabels) configured for click tracking",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/whitelabel/links");
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_branded_link: {
    config: {
      title: "Get Branded Link",
      description: "Get detailed information about a specific branded link, including its DNS records",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        id: z.number().describe("The ID of the branded link to retrieve"),
      },
    },
    handler: async ({ id }: { id: number }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/whitelabel/links/${id}`);
      return jsonToolResult(result);
    },
  },

  create_branded_link: {
    config: {
      title: "Create Branded Link",
      description: "Set up branded link tracking (click tracking through the sender's own domain instead of sendgrid.net)",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        domain: z.string().describe("The domain to use for branded links (e.g. example.com)"),
        subdomain: z.string().optional().describe("The subdomain to use for the branded link's DNS records"),
        default: z.boolean().optional().describe("Whether to make this the default branded link"),
      },
    },
    handler: async ({
      domain,
      subdomain,
      default: isDefault,
    }: {
      domain: string;
      subdomain?: string;
      default?: boolean;
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const requestBody: Record<string, any> = { domain };
      if (subdomain !== undefined) requestBody.subdomain = subdomain;
      if (isDefault !== undefined) requestBody.default = isDefault;

      const result = await makeRequest("https://api.sendgrid.com/v3/whitelabel/links", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      return jsonToolResult(result);
    },
  },

  update_branded_link: {
    config: {
      title: "Update Branded Link",
      description: "Update the default setting of an existing branded link",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        id: z.number().describe("The ID of the branded link to update"),
        default: z.boolean().optional().describe("Whether to make this the default branded link"),
      },
    },
    handler: async ({
      id,
      default: isDefault,
    }: {
      id: number;
      default?: boolean;
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const updateData: Record<string, any> = {};
      if (isDefault !== undefined) updateData.default = isDefault;

      if (Object.keys(updateData).length === 0) {
        return {
          content: [{
            type: "text",
            text: "No updates specified. Please provide at least one field to update (default)."
          }]
        };
      }

      const result = await makeRequest(
        `https://api.sendgrid.com/v3/whitelabel/links/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );
      return jsonToolResult(result);
    },
  },

  delete_branded_link: {
    config: {
      title: "Delete Branded Link",
      description: "Permanently delete a branded link. This action cannot be undone.",
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe("The ID of the branded link to delete"),
      },
    },
    handler: async ({ id }: { id: number }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      await makeRequest(
        `https://api.sendgrid.com/v3/whitelabel/links/${id}`,
        {
          method: "DELETE",
        }
      );

      return {
        content: [{
          type: "text",
          text: `Branded link ${id} deleted successfully.`
        }]
      };
    },
  },

  validate_branded_link: {
    config: {
      title: "Validate Branded Link",
      description: "Check whether the branded link's DNS records are correctly configured",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        id: z.number().describe("The ID of the branded link to validate"),
      },
    },
    handler: async ({ id }: { id: number }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const result = await makeRequest(
        `https://api.sendgrid.com/v3/whitelabel/links/${id}/validate`,
        {
          method: "POST",
        }
      );
      return jsonToolResult(result);
    },
  },
};
