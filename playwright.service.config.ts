/**
 * TOPIC: E2E Playwright DevOps using Azure Cloud Parallel hosting
 *
 * Instead of running browsers on your own machine or the GitHub runner,
 * this config points Playwright at Microsoft's Azure-hosted browsers so
 * many tests run in parallel across the cloud instead of one-by-one.
 *
 * Requires env vars (set as GitHub Secrets in CI, or a local .env file):
 *   PLAYWRIGHT_SERVICE_ACCESS_TOKEN
 *   PLAYWRIGHT_SERVICE_URL
 *   PLAYWRIGHT_SERVICE_RUN_ID   (shared across shards so results merge)
 *
 * Note: Microsoft's standalone "Playwright Testing" service has been
 * folded into the newer "Azure App Testing" product. The concept below
 * (cloud-hosted parallel workers) is unchanged; check the current Azure
 * docs for the latest package name / setup steps before running this
 * against a live Azure workspace.
 */
import { defineConfig } from '@playwright/test';
import config from './playwright.config';

export default defineConfig(config, {
  workers: 20, // Azure can spin up to this many parallel remote browser workers
  use: {
    ...config.use,
    // In a real setup this connects to the Azure endpoint, e.g.:
    // connectOptions: {
    //   wsEndpoint: `${process.env.PLAYWRIGHT_SERVICE_URL}?cap=${encodeURIComponent(
    //     JSON.stringify({ os: 'linux', runId: process.env.PLAYWRIGHT_SERVICE_RUN_ID })
    //   )}`,
    // },
  },
});
