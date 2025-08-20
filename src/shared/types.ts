import { z } from "zod";

export const USER_AGENT = "sendgrid-mcp/1.0";

// Common Zod schemas
export const ContactSchema = z.object({
  email: z.string().describe("Contact email address"),
  first_name: z.string().optional().describe("First name"),
  last_name: z.string().optional().describe("Last name"),
  custom_fields: z.record(z.any()).optional().describe("Custom field values"),
});

export const EmailAddressSchema = z.object({
  email: z.string(),
  name: z.string().optional(),
});

export const PaginationSchema = {
  offset: z.number().optional().default(0).describe("Pagination offset"),
  limit: z.number().optional().default(50).describe("Number of results to return"),
};

// Tool result type
export interface ToolResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
}