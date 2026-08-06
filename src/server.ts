import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { allTools } from "./tools/index.js";
import { allResources } from "./resources/index.js";
import { allPrompts } from "./prompts/index.js";
import { getEnv } from "./shared/env.js";

/**
 * Builds a fully-configured MCP server instance.
 *
 * A new instance is created per call because the Streamable HTTP transport in
 * stateless mode needs an isolated server per request.
 */
export function createServer(): McpServer {
  const env = getEnv();

  const server = new McpServer({
    name: env.MCP_SERVER_NAME,
    version: env.MCP_SERVER_VERSION,
  });

  for (const [uri, resource] of Object.entries(allResources)) {
    server.registerResource(uri, uri, resource.config, resource.handler);
  }

  for (const [name, tool] of Object.entries(allTools)) {
    server.registerTool(name, tool.config as any, tool.handler as any);
  }

  for (const [name, prompt] of Object.entries(allPrompts)) {
    server.registerPrompt(name, prompt.config as any, prompt.handler as any);
  }

  return server;
}
