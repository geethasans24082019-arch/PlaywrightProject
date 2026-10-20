const { spawn } = require('node:child_process');
const path = require('node:path');
const mergeExecutionSummary = require('./merge-execution-summary');

const cucumberCli = path.join(process.cwd(), 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js');
const args = [cucumberCli, '--config', 'cucumber.js', ...process.argv.slice(2)];
const cucumber = spawn(process.execPath, args, { cwd: process.cwd(), env: process.env, stdio: 'inherit' });

cucumber.on('error', (error) => {
  console.error(`Failed to start Cucumber: ${error.message}`);
  process.exitCode = 1;
});

cucumber.on('close', async (exitCode) => {
  try {
    await mergeExecutionSummary();
    console.log('Execution summary merged into test-results/reports/cucumber-report.html');
  } catch (error) {
    console.error(`Failed to merge the execution summary: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  process.exitCode = exitCode ?? 1;
});