import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const matrixPath = path.join(root, "docs", "FEATURE_TRACEABILITY.md");
const idPattern = /\bCS-\d{3}\b/g;
const idsFrom = (text) => [...text.matchAll(idPattern)].map((match) => match[0]);
const checklistIds = idsFrom(fs.readFileSync(path.join(root, "docs", "FEATURE_CHECKLIST.md"), "utf8"));
const matrixIds = idsFrom(fs.readFileSync(path.join(root, "docs", "FEATURE_TRACEABILITY.md"), "utf8"));
const uniqueChecklistIds = [...new Set(checklistIds)];
const uniqueMatrixIds = [...new Set(matrixIds)];
const missing = uniqueChecklistIds.filter((id) => !uniqueMatrixIds.includes(id));
const duplicates = uniqueMatrixIds.filter((id) => matrixIds.filter((candidate) => candidate === id).length !== 1);
const allowedStatuses = new Set(["PASS", "PARTIAL", "NOT_IMPLEMENTED", "BLOCKED"]);
const invalidStatuses = [];
const missingEvidencePaths = [];
for (const line of fs.readFileSync(matrixPath, "utf8").split(/\r?\n/).filter((value) => /^\| CS-\d{3}\b/.test(value))) {
  const columns = line.split("|").slice(1).map((value) => value.trim());
  const [id, , status, implementation, tests] = columns;
  if (!allowedStatuses.has(status)) invalidStatuses.push(`${id}:${status}`);
  for (const field of [implementation, tests]) {
    for (const candidate of field.split(";").map((value) => value.trim())) {
      if (!/^(app|components|e2e|lib|supabase|tests|middleware\.ts|playwright\.config\.ts)/.test(candidate)) continue;
      if (!fs.existsSync(path.join(root, candidate))) missingEvidencePaths.push(`${id}:${candidate}`);
    }
  }
}

if (uniqueChecklistIds.length !== 252 || uniqueMatrixIds.length !== 252 || missing.length || duplicates.length || invalidStatuses.length || missingEvidencePaths.length) {
  console.error(JSON.stringify({ uniqueChecklistIds: uniqueChecklistIds.length, uniqueMatrixIds: uniqueMatrixIds.length, missing, duplicates, invalidStatuses, missingEvidencePaths }, null, 2));
  process.exit(1);
}

console.log("Feature traceability validated: " + uniqueChecklistIds.length + " checklist IDs represented exactly once.");
