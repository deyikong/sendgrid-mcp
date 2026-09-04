import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { ToolResult, jsonToolResult, PassthroughObjectSchema } from "../shared/types.js";
import { checkReadOnlyMode } from "../shared/env.js";

// SendGrid's Design Library API (/v3/designs) -- visual email designs made in
// the drag-and-drop editor. This is a distinct API surface from the dynamic
// Templates API (/v3/templates, see ../tools/templates.ts); don't conflate
// the two.
const DesignEditorSchema = z.enum(["code", "design"]);

export const designTools = {
  list_designs: {
    config: {
      title: "List Designs",
      description: "List all custom email designs in the Design Library",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        page_size: z.number().optional().describe("Number of results to return per page"),
        page_token: z.string().optional().describe("Pagination token from a previous response"),
        summary: z.boolean().optional().describe("If true, return only summary fields for each design"),
      },
    },
    handler: async ({
      page_size,
      page_token,
      summary,
    }: {
      page_size?: number;
      page_token?: string;
      summary?: boolean;
    }): Promise<ToolResult> => {
      const searchParams = new URLSearchParams();
      if (page_size !== undefined) {
        searchParams.set("page_size", String(page_size));
      }
      if (page_token !== undefined) {
        searchParams.set("page_token", page_token);
      }
      if (summary !== undefined) {
        searchParams.set("summary", String(summary));
      }

      const query = searchParams.toString();
      const result = await makeRequest(`https://api.sendgrid.com/v3/designs${query ? `?${query}` : ""}`);
      return jsonToolResult(result);
    },
  },

  create_design: {
    config: {
      title: "Create Design",
      description: "Create a new custom email design in the Design Library from raw HTML",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        html_content: z.string().describe("Raw HTML content for the design"),
        name: z.string().optional().describe("Name of the design"),
        editor: DesignEditorSchema.optional().describe("Editor used to create the design: 'code' or 'design'"),
        plain_content: z.string().optional().describe("Plain-text content for the design"),
      },
    },
    handler: async ({
      html_content,
      name,
      editor,
      plain_content,
    }: {
      html_content: string;
      name?: string;
      editor?: "code" | "design";
      plain_content?: string;
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const requestBody: Record<string, any> = { html_content };
      if (name !== undefined) requestBody.name = name;
      if (editor !== undefined) requestBody.editor = editor;
      if (plain_content !== undefined) requestBody.plain_content = plain_content;

      const result = await makeRequest("https://api.sendgrid.com/v3/designs", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      return jsonToolResult(result);
    },
  },

  get_design: {
    config: {
      title: "Get Design",
      description: "Get details for a specific design in the Design Library",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        id: z.string().describe("The design ID to retrieve"),
      },
    },
    handler: async ({ id }: { id: string }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/designs/${id}`);
      return jsonToolResult(result);
    },
  },

  update_design: {
    config: {
      title: "Update Design",
      description: "Update the content or metadata of an existing design in the Design Library",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        id: z.string().describe("The design ID to update"),
        name: z.string().optional().describe("New name for the design"),
        html_content: z.string().optional().describe("New raw HTML content for the design"),
        plain_content: z.string().optional().describe("New plain-text content for the design"),
        generate_plain_content: z.boolean().optional().describe("If true, auto-generate plain-text content from the HTML content"),
        subject: z.string().optional().describe("New default subject line for the design"),
        categories: z.array(z.string()).optional().describe("New list of categories to associate with the design"),
      },
    },
    handler: async ({
      id,
      name,
      html_content,
      plain_content,
      generate_plain_content,
      subject,
      categories,
    }: {
      id: string;
      name?: string;
      html_content?: string;
      plain_content?: string;
      generate_plain_content?: boolean;
      subject?: string;
      categories?: string[];
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const updateData: Record<string, any> = {};
      if (name !== undefined) updateData.name = name;
      if (html_content !== undefined) updateData.html_content = html_content;
      if (plain_content !== undefined) updateData.plain_content = plain_content;
      if (generate_plain_content !== undefined) updateData.generate_plain_content = generate_plain_content;
      if (subject !== undefined) updateData.subject = subject;
      if (categories !== undefined) updateData.categories = categories;

      if (Object.keys(updateData).length === 0) {
        return {
          content: [{
            type: "text",
            text: "No updates specified. Please provide at least one field to update (name, html_content, plain_content, generate_plain_content, subject, or categories)."
          }]
        };
      }

      const result = await makeRequest(`https://api.sendgrid.com/v3/designs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });

      return jsonToolResult(result);
    },
  },

  delete_design: {
    config: {
      title: "Delete Design",
      description: "Permanently delete a custom design from the Design Library. This action cannot be undone.",
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        id: z.string().describe("The design ID to delete"),
      },
    },
    handler: async ({ id }: { id: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      await makeRequest(`https://api.sendgrid.com/v3/designs/${id}`, {
        method: "DELETE",
      });

      return {
        content: [{
          type: "text",
          text: `Design ${id} deleted successfully.`
        }]
      };
    },
  },

  duplicate_design: {
    config: {
      title: "Duplicate Design",
      description: "Create a copy of an existing design in the Design Library",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        id: z.string().describe("The design ID to duplicate"),
        name: z.string().optional().describe("Name for the duplicated design"),
        editor: DesignEditorSchema.optional().describe("Editor to use for the duplicated design: 'code' or 'design'"),
      },
    },
    handler: async ({
      id,
      name,
      editor,
    }: {
      id: string;
      name?: string;
      editor?: "code" | "design";
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const requestBody: Record<string, any> = {};
      if (name !== undefined) requestBody.name = name;
      if (editor !== undefined) requestBody.editor = editor;

      const result = await makeRequest(`https://api.sendgrid.com/v3/designs/${id}`, {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      return jsonToolResult(result);
    },
  },

  list_prebuilt_designs: {
    config: {
      title: "List Prebuilt Designs",
      description: "List SendGrid's built-in pre-made design templates",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        page_size: z.number().optional().describe("Number of results to return per page"),
        page_token: z.string().optional().describe("Pagination token from a previous response"),
        summary: z.boolean().optional().describe("If true, return only summary fields for each design"),
      },
    },
    handler: async ({
      page_size,
      page_token,
      summary,
    }: {
      page_size?: number;
      page_token?: string;
      summary?: boolean;
    }): Promise<ToolResult> => {
      const searchParams = new URLSearchParams();
      if (page_size !== undefined) {
        searchParams.set("page_size", String(page_size));
      }
      if (page_token !== undefined) {
        searchParams.set("page_token", page_token);
      }
      if (summary !== undefined) {
        searchParams.set("summary", String(summary));
      }

      const query = searchParams.toString();
      const result = await makeRequest(`https://api.sendgrid.com/v3/designs/pre-builts${query ? `?${query}` : ""}`);
      return jsonToolResult(result);
    },
  },

  get_prebuilt_design: {
    config: {
      title: "Get Prebuilt Design",
      description: "Get details for one of SendGrid's built-in pre-made designs",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        id: z.string().describe("The pre-built design ID to retrieve"),
      },
    },
    handler: async ({ id }: { id: string }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/designs/pre-builts/${id}`);
      return jsonToolResult(result);
    },
  },

  duplicate_prebuilt_design: {
    config: {
      title: "Duplicate Prebuilt Design",
      description: "Create an editable copy of one of SendGrid's built-in pre-made designs",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        id: z.string().describe("The pre-built design ID to duplicate"),
        name: z.string().optional().describe("Name for the duplicated design"),
        editor: DesignEditorSchema.optional().describe("Editor to use for the duplicated design: 'code' or 'design'"),
      },
    },
    handler: async ({
      id,
      name,
      editor,
    }: {
      id: string;
      name?: string;
      editor?: "code" | "design";
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const requestBody: Record<string, any> = {};
      if (name !== undefined) requestBody.name = name;
      if (editor !== undefined) requestBody.editor = editor;

      const result = await makeRequest(`https://api.sendgrid.com/v3/designs/pre-builts/${id}`, {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      return jsonToolResult(result);
    },
  },
};
