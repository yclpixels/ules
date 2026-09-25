import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Next'in "server-only" paketi React sunucu ortamı dışında import
      // edilince hata fırlatır; testler zaten sunucu tarafında (Node) koşuyor.
      "server-only": path.resolve(__dirname, "tests/serverOnlyStub.ts"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    globalSetup: ["tests/globalSetup.ts"],
    include: ["tests/**/*.test.ts"],
    // Entegrasyon testleri aynı veritabanını paylaşır; dosyalar sırayla koşsun.
    fileParallelism: false,
  },
});
