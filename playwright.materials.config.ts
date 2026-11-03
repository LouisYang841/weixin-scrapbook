import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: 'materials.spec.ts', workers: 1,
  timeout: 90000, reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173', headless: true,
    viewport: {width:1280,height:1000},
    launchOptions: {args:['--enable-unsafe-swiftshader']},
    screenshot: 'only-on-failure', trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI,
  },
});
