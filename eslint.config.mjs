// Lints with the rules Obsidian's community review uses
// (https://github.com/obsidianmd/eslint-plugin).
import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  {
    ignores: ["main.js", "dist-test/**", "node_modules/**", "tests/**"],
  },
  ...obsidianmd.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.mjs", "esbuild.config.mjs"],
        },
      },
    },
    rules: {
      "obsidianmd/ui/sentence-case": ["warn", {
        acronyms: ["CRM", "ISO", "BRL", "USD", "EUR"],
        brands: ["Markdown"],
        // Locale codes (pt-BR) and "+ Add ..." buttons are not sentences.
        ignoreRegex: ["\\b[a-z]{2}-[A-Z]{2}\\b", "^\\+ "],
      }],
      // getSettingDefinitions() needs Obsidian 1.13; the plugin supports 1.5+.
      "obsidianmd/settings-tab/prefer-setting-definitions": "off",
    },
  },
  {
    // Build scripts run in Node, not inside Obsidian.
    files: ["*.mjs"],
    rules: {
      "obsidianmd/no-nodejs-modules": "off",
    },
  },
]);
