import { defineConfig } from '@playwright/test'
import * as dotenv from 'dotenv'
dotenv.config()

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.VITE_BASE_URL || 'http://localhost:5174',
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
})
