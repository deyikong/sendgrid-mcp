#!/usr/bin/env node
// Builds a distributable MCPB bundle (sendgrid-mcp.mcpb) for submission to
// MCPB-consuming platforms (Claude Desktop, Smithery's "Local (MCPB Bundle)"
// publishing path, etc). See https://github.com/modelcontextprotocol/mcpb.
//
// The `tools` array in manifest.json is generated from the actual built tool
// registry (build/tools/index.js) rather than hand-maintained, so it can't
// drift out of sync the way other hand-written docs in this project have.
//
// Usage: npm run build:mcpb

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const stageDir = join(repoRoot, "mcpb-stage");

function run(cmd, args, cwd) {
  console.log(`+ ${cmd} ${args.join(" ")}${cwd ? ` (in ${cwd})` : ""}`);
  execFileSync(cmd, args, { cwd: cwd ?? repoRoot, stdio: "inherit" });
}

// 1. Compile TypeScript -> build/
run("npm", ["run", "build"]);

// 2. Generate manifest.json's `tools` array from the real registry, so it
//    can never drift from what the server actually exposes.
const { allTools } = await import(join(repoRoot, "build/tools/index.js"));
const tools = Object.entries(allTools).map(([name, tool]) => ({
  name,
  description: tool.config.description,
}));

const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));

const manifest = {
  manifest_version: "0.3",
  name: pkg.name,
  display_name: "SendGrid MCP Server",
  version: pkg.version,
  description: "MCP server for SendGrid's v3 API: email marketing, transactional mail, templates, and analytics.",
  long_description:
    "A Model Context Protocol (MCP) server providing comprehensive access to SendGrid's API v3 for email marketing, transactional email operations, dynamic template management, and detailed analytics. Built and maintained by a SendGrid engineer, as an independent project -- not an official SendGrid product.",
  author: {
    name: pkg.author,
    url: "https://github.com/deyikong",
  },
  repository: {
    type: "git",
    url: pkg.repository.url,
  },
  homepage: pkg.homepage,
  documentation: pkg.homepage,
  support: pkg.bugs.url,
  server: {
    type: "node",
    entry_point: "build/index.js",
    mcp_config: {
      command: "node",
      args: ["${__dirname}/build/index.js"],
      env: {
        SENDGRID_API_KEY: "${user_config.sendgrid_api_key}",
        READ_ONLY: "${user_config.read_only}",
      },
    },
  },
  tools,
  tools_generated: false,
  keywords: pkg.keywords,
  license: pkg.license,
  compatibility: {
    platforms: ["darwin", "win32", "linux"],
    runtimes: {
      node: ">=20.0.0",
    },
  },
  user_config: {
    sendgrid_api_key: {
      type: "string",
      title: "SendGrid API Key",
      description: "Your SendGrid API key (must start with 'SG.').",
      sensitive: true,
      required: true,
    },
    read_only: {
      type: "string",
      title: "Read-only mode",
      description: "When 'true' (the default), blocks all write/delete operations at runtime while keeping every tool registered and visible.",
      default: "true",
      required: false,
    },
  },
};

// 3. Stage a clean directory: build output + manifest + package files, then
//    a production-only `npm ci` so the bundle is self-contained (Node MCPB
//    bundles must include node_modules -- host apps just run `node
//    build/index.js` with no install step).
if (existsSync(stageDir)) {
  rmSync(stageDir, { recursive: true, force: true });
}
mkdirSync(stageDir);
cpSync(join(repoRoot, "build"), join(stageDir, "build"), { recursive: true });
cpSync(join(repoRoot, "package.json"), join(stageDir, "package.json"));
cpSync(join(repoRoot, "package-lock.json"), join(stageDir, "package-lock.json"));
writeFileSync(join(stageDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

run("npm", ["ci", "--omit=dev"], stageDir);

// 4. Validate, then pack.
const mcpbBin = join(repoRoot, "node_modules", ".bin", "mcpb");
run(mcpbBin, ["validate", join(stageDir, "manifest.json")]);
run(mcpbBin, ["pack", stageDir, join(repoRoot, "sendgrid-mcp.mcpb")]);

console.log(`\nBuilt sendgrid-mcp.mcpb (manifest version ${manifest.version}, ${tools.length} tools)`);
