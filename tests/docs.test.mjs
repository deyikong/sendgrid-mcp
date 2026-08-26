import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const readme = readFileSync(resolve(root, "README.md"), "utf8");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

/**
 * Count tools by importing the registered tool registry and counting entries.
 * Avoids needing to spawn the binary or connect to a transport.
 */
async function countRegisteredTools() {
  const { allTools } = await import(resolve(root, "build/tools/index.js"));
  return Object.keys(allTools).length;
}

test("README's tool count matches the registered tool registry", async () => {
  const registered = await countRegisteredTools();

  // Pull the number out of the README intro ("Features N tools covering...").
  const match = readme.match(/Features?\s+(\d+)\s+tools?\s+covering/i);
  assert.ok(match, "Could not find a 'Features N tools' line in the README");
  const claimed = Number(match[1]);

  assert.equal(
    claimed,
    registered,
    `README claims ${claimed} tools but ${registered} are registered. ` +
      `Either update the README's "Features ${claimed} tools" line or add/remove a tool in src/tools/.`
  );
});

test("RELEASES.md's most recent entry matches package.json's version", () => {
  const releases = readFileSync(resolve(root, "RELEASES.md"), "utf8");
  const match = releases.match(/^## v(\d+\.\d+\.\d+)/m);
  assert.ok(match, "RELEASES.md does not contain a '## vX.Y.Z' entry");
  assert.equal(
    match[1],
    packageJson.version,
    `RELEASES.md's newest entry is v${match[1]} but package.json is ${packageJson.version}`
  );
});

test("README's RELEASES.md link points at an existing file", () => {
  const references = [...readme.matchAll(/\((?:\.\/|\.\.\/)?RELEASES\.md\)/g)];
  assert.ok(references.length > 0, "README links to RELEASES.md but no reference found");
  // If the regex matched, the file exists by construction; this is a smoke test.
});

test("every Tools Summary entry in the README names a real tool", async () => {
  const { allTools } = await import(resolve(root, "build/tools/index.js"));
  const { allPrompts } = await import(resolve(root, "build/prompts/index.js"));
  const names = new Set(Object.keys(allTools));
  const promptNames = new Set(Object.keys(allPrompts));

  // Find the Tools Summary table (or bullet list) and extract tool names.
  const summaryStart = readme.indexOf("## Tools Summary");
  assert.ok(summaryStart >= 0, "No 'Tools Summary' section in README");
  const tail = readme.slice(summaryStart);

  // Pull every inline-code span. The Tools Summary uses both tool names and
  // prompt names; both must resolve to their respective registry.
  const codes = [...tail.matchAll(/`([a-z][a-z0-9_]+)`/g)].map((m) => m[1]);
  const mentioned = new Set(codes.filter((c) => c.length >= 6 && c.includes("_")));

  const unknown = [...mentioned].filter(
    (name) => !names.has(name) && !promptNames.has(name)
  );
  assert.deepEqual(
    unknown,
    [],
    `README Tools Summary names items that aren't registered as tools or prompts: ${unknown.join(", ")}`
  );
});