import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: [
            "src/**/*.integration.test.ts"
        ],
        setupFiles: [
            "./src/tests/config.database-test.ts"
        ],
        fileParallelism: false
    }
});