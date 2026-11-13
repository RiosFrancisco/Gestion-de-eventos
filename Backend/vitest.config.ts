import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
    test: {
        include: [
            "src/**/*.test.ts"
        ],
        exclude: [
            ...configDefaults.exclude,
            "src/**/*.integration.test.ts"
        ]
    }
});