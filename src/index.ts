#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { startHttpTransport } from "./http.js";
import { validateEnvironment, getSafeEnvInfo } from "./shared/env.js";
import { logger } from "./shared/logger.js";

async function main() {
  try {
    // Validate environment variables before anything reads them
    const env = validateEnvironment();
    const envInfo = getSafeEnvInfo();

    logger.info(`Starting ${envInfo.serverName} v${envInfo.serverVersion}`);
    logger.debug(`Environment: ${JSON.stringify(envInfo, null, 2)}`);

    if (env.MCP_TRANSPORT === "http") {
      await startHttpTransport();
      return;
    }

    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info("SendGrid MCP Server running on stdio");
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error("Server error:", error);
  process.exit(1);
});
