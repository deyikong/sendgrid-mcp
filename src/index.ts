#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { startHttpTransport } from "./http.js";
import { validateEnvironment, getSafeEnvInfo } from "./shared/env.js";

async function main() {
  try {
    // Validate environment variables before anything reads them
    const env = validateEnvironment();
    const envInfo = getSafeEnvInfo();

    console.error(`Starting ${envInfo.serverName} v${envInfo.serverVersion}`);
    console.error(`Environment: ${JSON.stringify(envInfo, null, 2)}`);

    if (env.MCP_TRANSPORT === "http") {
      await startHttpTransport();
      return;
    }

    const server = createServer();
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
