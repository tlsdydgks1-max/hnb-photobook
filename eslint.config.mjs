import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist/**", "build/**", "node_modules/**"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}", "scripts/**/*.mjs", "tests/**/*.mjs"],
    languageOptions: {
      globals: {
        document: "readonly",
        event: "readonly",
        console: "readonly",
        localStorage: "readonly",
        process: "readonly",
        window: "readonly",
      },
    },
  },
]);
