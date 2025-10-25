import { defineConfig, mergeCatalogRules } from "pncat";

export default defineConfig({
  catalogRules: mergeCatalogRules([
    {
      name: "utils",
      match: ["run-applescript"],
    },
  ]),
  postRun: 'eslint --fix "**/package.json" "**/pnpm-workspace.yaml"',
});
