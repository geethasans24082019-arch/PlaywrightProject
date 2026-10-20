import { After, AfterStep, Before, setDefaultTimeout, setWorldConstructor, Status, World as CucumberWorld } from '@cucumber/cucumber';
import 'dotenv/config';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Document, HeadingLevel, ImageRun, Packer, Paragraph } from 'docx';
import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { runMetadata } from '../report/run-metadata';

type FailureDiagnostic = {
  step: string;
  locator: string;
  issue: string;
  details: string;
};

function getErrorText(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }
  return String(error ?? 'No error details were provided.');
}

function getLocatorFromError(errorText: string): string {
  const locatorLine = errorText.split(/\r?\n/).find((line) =>
    /(?:Locator:\s*|waiting for (?:getBy|locator\(|page\.))/i.test(line)
  );
  return locatorLine?.replace(/.*(?:Locator:\s*|waiting for\s+)/i, '').trim()
    || 'Not identified in the error; see Playwright details below.';
}

export class TestAutomationAcademy extends CucumberWorld {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  newPage!: Page;
  homePage!: HomePage;
  firstProductName = '';
  productRrpPrices: Record<string, number> = {};
  cartProductRrpPrices: number[] = [];
  otpRequestedAt = 0;
  invoiceReference = '';
  amountPaid = '';
  stepScreenshots: Array<{ title: string; path: string }> = [];
  failureDiagnostics: FailureDiagnostic[] = [];
  browserLogs: string[] = [];

  async startBrowser(): Promise<void> {
    this.browserLogs = [];
    this.browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
      ...(process.env.HEADLESS === 'false' ? { args: ['--start-maximized'] } : {}),
      ...(process.env.PWDEBUG === '1' ? { slowMo: 250 } : {})
    });
    runMetadata.browserName = this.browser.browserType().name();
    runMetadata.browserVersion = this.browser.version();
    this.context = await this.browser.newContext({
      ...(process.env.HEADLESS === 'false' ? { viewport: null } : {}),
      recordVideo: process.env.VIDEO === 'false'
        ? undefined
        : { dir: 'test-results/videos', size: { width: 1280, height: 720 } }
    });
    await this.context.grantPermissions(['notifications'], { origin: process.env.BASE_URL! });
    this.page = await this.context.newPage();
    this.page.on('console', (message) => {
      this.browserLogs.push(`[console:${message.type()}] ${message.text()}`);
    });
    this.page.on('pageerror', (error) => {
      this.browserLogs.push(`[pageerror] ${getErrorText(error)}`);
    });
    this.page.on('requestfailed', (request) => {
      const failure = request.failure()?.errorText ?? 'Unknown network error';
      this.browserLogs.push(`[requestfailed] ${request.method()} ${request.url()} - ${failure}`);
    });
    this.homePage = new HomePage(this.page);
  }

  async closeBrowser(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
  }
}

setWorldConstructor(TestAutomationAcademy);

setDefaultTimeout(7200000);

// Starts a fresh browser and page-object set before every Cucumber scenario.
Before(async function (this: TestAutomationAcademy) {
  await this.startBrowser();
});

// Captures the browser state after every Gherkin step for the scenario report.
AfterStep(async function (this: TestAutomationAcademy, { pickleStep, result, error }) {
  const stepLogs = this.browserLogs.splice(0);

  if (stepLogs.length > 0) {
    await this.attach([
      `BROWSER LOGS (${stepLogs.length})`,
      `Step: ${pickleStep.text}`,
      ...stepLogs
    ].join('\n'), 'text/plain');
  }

  if (result.status === Status.FAILED) {
    const details = result.message ?? getErrorText(error);
    const diagnostic: FailureDiagnostic = {
      step: pickleStep.text,
      locator: getLocatorFromError(details),
      issue: details.split(/\r?\n/, 1)[0] || 'The step failed without an error message.',
      details
    };
    this.failureDiagnostics.push(diagnostic);
    await this.attach([
      'STEP FAILURE DIAGNOSTIC',
      `Failed step: ${diagnostic.step}`,
      `Locator: ${diagnostic.locator}`,
      `Issue: ${diagnostic.issue}`,
      'Full Playwright error and call log:',
      diagnostic.details
    ].join('\n\n'), 'text/plain');
  }

  if (!this.page) {
    return;
  }

  const outputDirectory = 'test-results/step-screenshots';
  const stepNumber = this.stepScreenshots.length + 1;
  const fileName = `${String(stepNumber).padStart(2, '0')}-${pickleStep.text.replace(/\W+/g, '-').toLowerCase()}.png`;
  const screenshotPath = `${outputDirectory}/${fileName}`;
  try {
    await mkdir(outputDirectory, { recursive: true });
    await this.page.waitForTimeout(1000);
    const screenshot = await this.page.screenshot({ path: screenshotPath, fullPage: false });
    this.stepScreenshots.push({ title: pickleStep.text, path: screenshotPath });
    await this.attach(screenshot, 'image/png');
  } catch (screenshotError) {
    await this.attach([
      'STEP SCREENSHOT CAPTURE NOTE',
      `Step: ${pickleStep.text}`,
      'The step result is unchanged; its screenshot could not be captured.',
      `Capture issue: ${getErrorText(screenshotError)}`
    ].join('\n\n'), 'text/plain');
  }
});

// Creates one Word report from all step screenshots, then closes the browser.
After(async function (this: TestAutomationAcademy, scenario) {
  const shouldCaptureScreenshot = process.env.SCREENSHOT_ALWAYS === 'true'
    || scenario.result?.status === Status.FAILED;

  if (shouldCaptureScreenshot && this.page) {
    try {
      await mkdir('test-results/screenshots', { recursive: true });
      const fileName = scenario.pickle.name.replace(/\W+/g, '-').toLowerCase();
      const screenshotPath = `test-results/screenshots/${Date.now()}-${fileName}.png`;
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      await this.attach(await readFile(screenshotPath), 'image/png');
    } catch (screenshotError) {
      await this.attach(`Scenario screenshot unavailable: ${getErrorText(screenshotError)}`, 'text/plain');
    }
  }

  if (this.stepScreenshots.length > 0) {
    const documentChildren: Paragraph[] = [
      new Paragraph({ text: scenario.pickle.name, heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: `Result: ${scenario.result?.status ?? 'UNKNOWN'}` })
    ];

    if (this.failureDiagnostics.length > 0) {
      documentChildren.push(new Paragraph({ text: 'Failure diagnostics', heading: HeadingLevel.HEADING_2 }));
      for (const diagnostic of this.failureDiagnostics) {
        documentChildren.push(new Paragraph({ text: `Failed step: ${diagnostic.step}` }));
        documentChildren.push(new Paragraph({ text: `Locator: ${diagnostic.locator}` }));
        documentChildren.push(new Paragraph({ text: `Issue: ${diagnostic.issue}` }));
        documentChildren.push(new Paragraph({ text: 'Full Playwright error and call log:' }));
        for (const line of diagnostic.details.split(/\r?\n/)) {
          documentChildren.push(new Paragraph({ text: line || ' ' }));
        }
      }
    }

    for (const screenshot of this.stepScreenshots) {
      documentChildren.push(new Paragraph({ text: screenshot.title, heading: HeadingLevel.HEADING_2 }));
      documentChildren.push(new Paragraph({
        alignment: 'center',
        children: [new ImageRun({
          type: 'png',
          data: await readFile(screenshot.path),
          transformation: { width: 720, height: 405 }
        })]
      }));
    }

    const reportDirectory = 'test-results/reports';
    await mkdir(reportDirectory, { recursive: true });
    const reportPath = `${reportDirectory}/${scenario.pickle.name.replace(/\W+/g, '-').toLowerCase()}.docx`;
    const document = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 }
          }
        },
        children: documentChildren
      }]
    });
    await writeFile(reportPath, await Packer.toBuffer(document));
    console.log(`Step screenshot Word report saved to ${reportPath}`);
  }

  const video = this.page?.video();
  await this.closeBrowser();

  if (video && process.env.VIDEO !== 'false') {
    await this.attach(await readFile(await video.path()), 'video/webm');
  }
});
