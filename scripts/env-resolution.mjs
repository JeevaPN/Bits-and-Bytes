import fs from "node:fs";
import path from "node:path";

export const ENV_FILES = [".env.local", ".env"];

function parseFile(file) {
  if (!fs.existsSync(file)) return {};
  const parsed = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match) parsed[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return parsed;
}

/** Resolve effective configuration without logging any values.
 * @param {string} root
 * @param {Record<string, string | undefined>} processEnvironment
 * @returns {Record<string, string>}
 */
export function loadEffectiveEnvironment(root = process.cwd(), processEnvironment = process.env) {
  const values = {};
  for (const [name, value] of Object.entries(processEnvironment)) {
    if (value !== undefined) values[name] = value;
  }
  for (const fileName of ENV_FILES) {
    const fileValues = parseFile(path.join(root, fileName));
    for (const [name, value] of Object.entries(fileValues)) {
      if (values[name] === undefined) values[name] = value;
    }
  }
  return values;
}

export function detectedEnvironmentFiles(root = process.cwd()) {
  return ENV_FILES.filter((file) => fs.existsSync(path.join(root, file)));
}
