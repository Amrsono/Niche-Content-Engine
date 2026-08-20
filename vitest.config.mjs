import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'lib/**/*.ts',
        'app/api/**/*.ts',
        'app/hooks/**/*.ts',
        'app/components/AdminGuard.tsx',
        'app/components/IndexingStatusCard.tsx',
        'app/components/FloatingNav.tsx',
        'app/components/SmartImage.tsx',
        'app/components/AdSenseDisplay.tsx',
        'app/components/BentoBox.tsx',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/__mocks__/**',
        'node_modules/**',
        '.next/**',
      ],
      thresholds: {
        lines: 70,
        branches: 55,
        functions: 70,
        statements: 70,
      },
    },
  },
});
