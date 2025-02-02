import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // ... Specify options here.
    env: {
      TABLE_NAME: "test-table-name",
    },
  },
  resolve: {
    alias: { "@": "/src" },
  },
});
