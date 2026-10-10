import fs from "node:fs";
import path from "node:path";

const directory = path.join(process.cwd(), "supabase", "migrations");
const files = fs.readdirSync(directory).filter((file) => file.endsWith(".sql")).sort();
const versions = files.map((file) => file.match(/^(\d+)_/)?.[1]).filter(Boolean);
const duplicates = versions.filter((version, index) => versions.indexOf(version) !== index);
const nonIncreasing = files.some((file, index) => index > 0 && file <= files[index - 1]);
if (duplicates.length || nonIncreasing || versions.length !== new Set(versions).size) {
  console.error(JSON.stringify({ files, duplicates, nonIncreasing }, null, 2));
  process.exit(1);
}
for (const file of files) {
  const sql = fs.readFileSync(path.join(directory, file), "utf8");
  if (!sql.trim()) { console.error(`Empty migration: ${file}`); process.exit(1); }
}
console.log(`Migration filename/order validation passed for ${files.length} migrations.`);
