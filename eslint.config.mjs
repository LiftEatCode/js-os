import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prisma 8 generated contract artifacts:
    "src/prisma/contract.d.ts",
    "src/prisma/contract.json",
    // Prisma-synced agent skills (not application code):
    ".cursor/skills/**",
    ".claude/skills/**",
    ".agents/skills/**",
    ".devin/skills/**",
  ]),
]);

export default eslintConfig;
