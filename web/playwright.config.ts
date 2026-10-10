import { defineConfig, devices } from "@playwright/test";

// The e2e server is a production build with NEXT_PUBLIC_E2E_STUBS=1, which lets the tests
// replace the camera and the MediaPipe model (see tests/e2e/stubs.ts). Normal builds drop
// that code path entirely.
const PORT = 3200;
// Locally the installed Microsoft Edge is used (Windows App Control blocks the Chromium
// that Playwright downloads); CI sets PLAYWRIGHT_CHANNEL=chromium.
const channel = process.env.PLAYWRIGHT_CHANNEL ?? "msedge";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    channel === "chromium"
      ? { name: "chromium", use: { ...devices["Desktop Chrome"] } }
      : { name: channel, use: { ...devices["Desktop Edge"], channel } },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT} --hostname 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    env: { NEXT_PUBLIC_E2E_STUBS: "1" },
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
