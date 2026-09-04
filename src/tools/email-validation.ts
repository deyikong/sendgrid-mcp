import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { ToolResult, jsonToolResult, PassthroughObjectSchema } from "../shared/types.js";
import { checkReadOnlyMode } from "../shared/env.js";

export const emailValidationTools = {
  validate_email: {
    config: {
      title: "Validate Email",
      description: "Check whether an email address is valid and likely to be deliverable, using SendGrid's Email Address Validation API (consumes a billed validation credit per call).",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        email: z.string().describe("The email address to validate"),
        source: z.string().optional().describe("A label describing where this validation is coming from, e.g. 'signup_form'"),
      },
    },
    handler: async ({ email, source }: { email: string; source?: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const requestBody: Record<string, any> = { email };
      if (source !== undefined) {
        requestBody.source = source;
      }

      const result = await makeRequest("https://api.sendgrid.com/v3/validations/email", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      return jsonToolResult(result);
    },
  },
};
