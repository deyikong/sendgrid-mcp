import { z } from "zod";

export const USER_AGENT = "sendgrid-mcp/1.0";

// Output schema for tools whose SendGrid response is a confirmed plain
// object, but whose exact fields vary too much (or aren't fully documented)
// to enumerate. `.passthrough()` matters here, not just an empty z.object({})
// -- the SDK converts an empty raw shape to a JSON Schema with
// `additionalProperties: false`, which would falsely advertise that these
// tools return an empty object when they actually return the full SendGrid
// response. `.passthrough()` converts to `additionalProperties: {}`, an
// honest "any additional properties allowed".
export const PassthroughObjectSchema = z.object({}).passthrough();

// Common Zod schemas
export const ContactSchema = z.object({
  email: z.string().describe("Contact email address"),
  first_name: z.string().optional().describe("First name"),
  last_name: z.string().optional().describe("Last name"),
  custom_fields: z.record(z.string(), z.any()).optional().describe("Custom field values"),
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
  structuredContent?: Record<string, unknown>;
}

/**
 * Wraps a plain-object SendGrid API response as both the text content
 * (matching the existing JSON.stringify(..., null, 2) convention) and MCP
 * structuredContent, so clients can consume it as typed JSON instead of
 * re-parsing text. Only use this for responses confirmed (against SendGrid's
 * public OpenAPI spec) to be plain JSON objects -- arrays fail MCP's
 * outputSchema validation, which is constrained to `type: "object"`.
 */
export function jsonToolResult(data: Record<string, unknown>): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

// Tool metadata for read-only filtering
export interface ToolMetadata {
  readonly: boolean;
}

// Extended tool definition with metadata
export interface ToolDefinition {
  config: any;
  handler: any;
  metadata: ToolMetadata;
}