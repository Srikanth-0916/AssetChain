import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000, // 60s timeout for network & async tests
    hookTimeout: 60000,
    pool: 'forks', // Use forks for process isolation
    setupFiles: ['./tests/setup.ts'],
  },
});
