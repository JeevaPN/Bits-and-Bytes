import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import { globalIgnores } from "eslint/config";
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });
export default [globalIgnores([".next/**", "out/**", "next-env.d.ts"]), ...compat.extends("next/core-web-vitals", "next/typescript")];
