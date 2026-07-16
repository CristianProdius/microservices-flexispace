import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vitest/config";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig({
  resolve: {
    alias: {
      "@repo/db": resolve(root, "packages/db/src/index.ts"),
    },
  },
  test: {
    environment: "node",
  },
});
