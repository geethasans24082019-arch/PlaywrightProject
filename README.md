# Playwright + TypeScript + GenAI/MCP + Cucumber BDD

This project is a **UI automation framework** built using:
- [Playwright](https://playwright.dev/) for browser automation
- [Cucumber](https://cucumber.io/) for BDD-style test writing
- [TypeScript](https://www.typescriptlang.org/) for type safety and maintainability

---

## 📦 Features
- **BDD**: Write tests in Gherkin syntax (`.feature` files)
- **Cross-browser**: Run tests on Chromium, Firefox, and WebKit
- **Parallel execution**: Faster test runs
- **Hooks**: Before/After scenarios for setup/teardown
- **Detailed HTML reports**
- **Page Object Model (POM)** for clean code structure

---

## 🛠 Prerequisites
- **Node.js** v16+  
- **npm** or **yarn**
- Git

---

## 🚀 Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/playwright-cucumber-typescript.git

cd playwright-cucumber-typescript

# Install dependencies
npm install
📂 Project Structure

## How each course topic maps to a file

| Topic | Where it lives |
|---|---|
| Intro to Playwright Automation | `playwright.config.ts`, `tests/fixtures-demo.spec.ts` |
| Playwright Fixtures & Custom Fixtures | `tests/fixtures-demo.spec.ts` (`loginPage` fixture) |
| Cucumber Framework Integration | `features/login.feature`, `src/steps`, `src/world`, `src/hooks`, `cucumber.js` |
| E2E DevOps: Azure Cloud Parallel hosting | `playwright.service.config.ts` |
| E2E DevOps: GitHub Actions | `.github/workflows/e2e-tests.yml` |
| Playwright Agents & MCP (VS Code + Copilot) | `.vscode/mcp.json` — see setup below |
| GenAI in the workflow | Copilot Agent Mode uses the MCP server above to drive real browser actions while you chat |
| TC basic functionality: Login | `features/login.feature` + `tests/fixtures-demo.spec.ts` both test the same login page |
| Git: push, pull, merge | See **Git Workflow** section at the bottom |

## 1. Install

```bash
npm install
npx playwright install
```

## 2. Run the fixtures demo (pure Playwright Test)

```bash
npm run test:fixtures
npm run report:show
```

This runs `tests/fixtures-demo.spec.ts` locally in Chromium and opens an HTML report.

## 3. Run the Cucumber BDD suite

```bash
npm run test:bdd
```

Open `test-results/reports/cucumber-report.html` for the execution summary, status chart,
step details, screenshots, and logs.

Both suites test the same target: https://practicetestautomation.com/practice-test-login/
(a public practice site with known credentials `student` / `Password123`), so you can
directly compare the "plain Playwright Test + fixtures" style against the
"Cucumber BDD" style on identical functionality.

## 4. Try Azure parallel hosting (optional, needs an Azure workspace)

Set these as GitHub Secrets (for CI) or local env vars:
```
PLAYWRIGHT_SERVICE_ACCESS_TOKEN
PLAYWRIGHT_SERVICE_URL
AZURE_CLIENT_ID / AZURE_TENANT_ID / AZURE_SUBSCRIPTION_ID
```
Then push to `main` or open a PR — `.github/workflows/e2e-tests.yml` will run
the suite across 4 parallel shards automatically.

> Note: Microsoft's standalone "Playwright Testing" preview service has since
> been folded into **Azure App Testing**. The sharding/parallel concepts here
> are unchanged, but check Azure's current docs before pointing this at a
> live workspace, as exact package/setup names may have moved.

## 5. Set up Playwright MCP + GitHub Copilot Agent Mode in VS Code

1. Open this folder in VS Code, make sure GitHub Copilot is signed in and
   Agent Mode is enabled.
2. The `.vscode/mcp.json` file already declares the Playwright MCP server —
   VS Code will prompt you to trust it the first time.
3. Open Copilot Chat, switch to **Agent** mode, and try prompting:
   > "Open the practice login page, log in with student/wrongpassword, and tell me what error appears."
4. Copilot will drive a real browser through Playwright's MCP tools, report
   back what it saw, and can even propose new step definitions or fixes.

## Git Workflow — push, pull, merge (beginner walkthrough)

```bash
# 1. Get the latest code before you start working
git pull origin main

# 2. Create a branch for your change (don't work directly on main)
git checkout -b feature/login-tests

# 3. Make your changes (e.g. edit login.feature or login.steps.ts), then stage & commit
git add .
git commit -m "Add negative login scenarios"

# 4. Push your branch up to GitHub
git push origin feature/login-tests

# 5. Open a Pull Request on GitHub targeting main
#    -> this automatically triggers .github/workflows/e2e-tests.yml
#    -> your PR shows a green check only if all shards pass

# 6. Once approved and checks pass, merge the PR (on GitHub, or locally):
git checkout main
git pull origin main
git merge feature/login-tests
git push origin main
```

**Why this order matters:** `pull` first avoids conflicts from stale code;
working on a branch (not `main`) keeps `main` always deployable; the PR is
what triggers your CI pipeline as a merge gate; `merge` only happens after
the automated E2E tests already passed on the branch.
