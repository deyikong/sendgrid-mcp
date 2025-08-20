#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { allTools } from "./tools/index.js";
import { allResources } from "./resources/index.js";
import { allPrompts } from "./prompts/index.js";
import { validateEnvironment, getSafeEnvInfo } from "./shared/env.js";

const server = new McpServer({
  name: "sendgrid-mcp",
  version: "1.0.0",
});

// Register all resources
for (const [uri, resource] of Object.entries(allResources)) {
  server.registerResource(uri, uri, resource.config, resource.handler);
}

// Register all tools
for (const [name, tool] of Object.entries(allTools)) {
  server.registerTool(name, tool.config as any, tool.handler as any);
}

// Register all prompts
for (const [name, prompt] of Object.entries(allPrompts)) {
  server.registerPrompt(name, prompt.config as any, prompt.handler as any);
}

async function main() {
  try {
    // Validate environment variables
    const env = validateEnvironment();
    const envInfo = getSafeEnvInfo();
    
    console.error(`Starting ${envInfo.serverName} v${envInfo.serverVersion}`);
    console.error(`Environment: ${JSON.stringify(envInfo, null, 2)}`);
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("SendGrid MCP Server running on stdio");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});