import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const idPattern = /\bCS-\d{3}\b/g;
const idsFrom = (text) => [...text.matchAll(idPattern)].map((match) => match[0]);
const checklistIds = idsFrom(fs.readFileSync(path.join(root, "docs", "FEATURE_CHECKLIST.md"), "utf8"));
const matrixIds = idsFrom(fs.readFileSync(path.join(root, "docs", "FEATURE_TRACEABILITY.md"), "utf8"));
const uniqueChecklistIds = [...new Set(checklistIds)];
const uniqueMatrixIds = [...new Set(matrixIds)];
const missing = uniqueChecklistIds.filter((id) => !uniqueMatrixIds.includes(id));
const duplicates = uniqueMatrixIds.filter((id) => matrixIds.filter((candidate) => candidate === id).length !== 1);

if (uniqueChecklistIds.length !== 252 || uniqueMatrixIds.length !== 252 || missing.length || duplicates.length) {
  console.error(JSON.stringify({ uniqueChecklistIds: uniqueChecklistIds.length, uniqueMatrixIds: uniqueMatrixIds.length, missing, duplicates }, null, 2));
  process.exit(1);
}

console.log("Feature traceability validated: " + uniqueChecklistIds.length + " checklist IDs represented exactly once.");
