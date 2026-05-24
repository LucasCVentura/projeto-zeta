import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
      exclude: [
        // clientes de serviço externo — sem lógica testável localmente
        "src/lib/auth.ts",
        "src/lib/email.ts",
        "src/lib/media-url.ts",
        "src/lib/session.ts",
        "src/lib/permissions.ts",
        "src/lib/resend.ts",
        "src/lib/stripe.ts",
        "src/lib/storage.ts",
        "src/lib/whatsapp-client.ts",
        "src/lib/config.ts",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
      reporter: ["text", "lcov"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
