#!/usr/bin/env node
// Builds sendgrid-mcp-smithery.mcpb: the same bundle as `npm run build:mcpb`,
// with one difference -- each entry in manifest.json's `tools` array also
// carries a real `inputSchema`.
//
// Why this is a separate artifact: the official MCPB manifest schema
// (https://github.com/modelcontextprotocol/mcpb) declares tool entries as
// `{name, description}` with `additionalProperties: false`, so `mcpb
// validate`/`pack` reject an added `inputSchema` field outright. Smithery's
// registry, however, requires each published tool to be a full MCP Tool
// object -- `inputSchema` included -- and rejects the spec-compliant bundle
// with one "expected object, received undefined" error per tool missing it.
// There's no flag on either side to reconcile this, so we patch a copy of
// the manifest post-pack rather than let Smithery's requirement leak into
// the canonical, spec-compliant bundle every other MCPB consumer relies on.
//
// The `io: "input"` conversion mode matches what the running server actually
// reports over `tools/list` (optional/defaulted fields aren't marked
// `required`) -- see tests/structured-content.test.mjs for the equivalent
// runtime contract.
//
// Usage: npm run build:mcpb:smithery   (builds sendgrid-mcp.mcpb first)

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, cpSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const canonicalBundle = join(repoRoot, "sendgrid-mcp.mcpb");
const smitheryBundle = join(repoRoot, "sendgrid-mcp-smithery.mcpb");
const patchDir = join(repoRoot, "mcpb-stage-smithery");

function run(cmd, args, cwd) {
  console.log(`+ ${cmd} ${args.join(" ")}${cwd ? ` (in ${cwd})` : ""}`);
  execFileSync(cmd, args, { cwd: cwd ?? repoRoot, stdio: "inherit" });
}

// 1. Build the canonical, spec-compliant bundle first -- it's the base we patch.
run("npm", ["run", "build:mcpb"]);

// 2. Extract its manifest.json into a scratch directory.
if (existsSync(patchDir)) {
  rmSync(patchDir, { recursive: true, force: true });
}
mkdirSync(patchDir);
cpSync(canonicalBundle, smitheryBundle);
run("unzip", ["-q", smitheryBundle, "manifest.json", "-d", patchDir]);

// 3. Add each tool's real inputSchema, generated from the same registry
//    build-mcpb.mjs uses -- never hand-maintained, can't drift.
const manifestPath = join(patchDir, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const { allTools } = await import(join(repoRoot, "build/tools/index.js"));

manifest.tools = Object.entries(allTools).map(([name, tool]) => ({
  name,
  description: tool.config.description,
  inputSchema: z.toJSONSchema(z.object(tool.config.inputSchema ?? {}), { io: "input" }),
}));

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

// 4. Splice the patched manifest.json back into the zip in place.
run("zip", ["-q", smitheryBundle, "manifest.json"], patchDir);

console.log(`\nBuilt sendgrid-mcp-smithery.mcpb (manifest version ${manifest.version}, ${manifest.tools.length} tools with inputSchema)`);
console.log(`Publish with: smithery mcp publish ${smitheryBundle} -n deyikong/sendgrid-mcp`);
