import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/.tsbuild/**", "**/node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // páginas estáticas do site rodam no navegador, sem bundler
    files: ["apps/powerpoint/public/**/*.js"],
    languageOptions: { sourceType: "script", globals: { document: "readonly", localStorage: "readonly", location: "readonly" } },
  },
  {
    // scripts de build rodam no Node
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: { URL: "readonly", process: "readonly", console: "readonly" } },
  },
);
