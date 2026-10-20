const { readFile, unlink, writeFile } = require('node:fs/promises');
const path = require('node:path');

const reportDirectory = path.join(process.cwd(), 'test-results', 'reports');
const reportPath = path.join(reportDirectory, 'cucumber-report.html');
const summaryPath = path.join(reportDirectory, 'execution-summary.json');
const summaryStart = '<!-- EXECUTION SUMMARY START -->';
const summaryEnd = '<!-- EXECUTION SUMMARY END -->';

function escapeHtml(value) {
  const replacements = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value).replace(/[&<>"']/g, (character) => replacements[character]);
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

function renderSummary(summary) {
  const { counts } = summary;
  const totalScenarios = counts.passed + counts.failed + counts.skipped;
  const passedEnd = totalScenarios ? counts.passed / totalScenarios * 100 : 0;
  const failedEnd = totalScenarios ? passedEnd + counts.failed / totalScenarios * 100 : 0;
  const chart = totalScenarios
    ? `conic-gradient(#23845d 0 ${passedEnd}%, #c84040 ${passedEnd}% ${failedEnd}%, #d49b22 ${failedEnd}% 100%)`
    : 'conic-gradient(#dfe4e8 0 100%)';
  const executionDate = summary.executionDate
    ? new Date(summary.executionDate).toLocaleString()
    : 'Unknown';

  return `${summaryStart}
<style>
  .run-summary { max-width: 1600px; margin: 0 auto 1.5rem; padding: 1rem; color: #202a33; font-family: "Segoe UI", sans-serif; }
  .run-summary * { box-sizing: border-box; }
  .run-summary-header { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
  .run-summary h1 { margin: 0; font-size: 1.35rem; }
  .run-summary-date { color: #586873; font-size: .9rem; }
  .run-summary-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: .65rem; margin-bottom: 1rem; }
  .run-summary-metric, .run-summary-results { background: #fff; border: 1px solid #d7dfe4; border-radius: 6px; }
  .run-summary-metric { min-height: 78px; padding: .75rem; }
  .run-summary-metric span { display: block; color: #586873; font-size: .78rem; }
  .run-summary-metric strong { display: block; margin-top: .5rem; font-size: 1rem; overflow-wrap: anywhere; }
  .run-summary-results { display: grid; grid-template-columns: minmax(180px, .75fr) minmax(220px, 1fr); gap: 1.5rem; align-items: center; padding: 1rem; }
  .run-summary-results h2 { margin: 0 0 .75rem; font-size: 1rem; }
  .run-summary-pie { width: 150px; aspect-ratio: 1; position: relative; margin: 0 auto; border-radius: 50%; background: ${chart}; }
  .run-summary-pie::after { content: "${totalScenarios}"; position: absolute; inset: 26%; display: grid; place-items: center; border-radius: 50%; background: #fff; font-size: 1.6rem; font-weight: 700; }
  .run-summary-legend { display: grid; gap: .65rem; margin: 0; padding: 0; list-style: none; }
  .run-summary-legend li { display: grid; grid-template-columns: 12px 1fr auto; align-items: center; gap: .6rem; }
  .run-summary-swatch { width: 12px; height: 12px; border-radius: 2px; }
  .run-summary-passed { background: #23845d; } .run-summary-failed { background: #c84040; } .run-summary-skipped { background: #d49b22; }
  @media (max-width: 560px) { .run-summary-results { grid-template-columns: 1fr; } }
</style>
<section class="run-summary" aria-label="Execution summary">
  <div class="run-summary-header"><h1>Cucumber Execution Summary</h1><span class="run-summary-date">Execution date: ${escapeHtml(executionDate)}</span></div>
  <div class="run-summary-metrics">
    <div class="run-summary-metric"><span>Browser and version</span><strong>${escapeHtml(summary.browserName)} ${escapeHtml(summary.browserVersion)}</strong></div>
    <div class="run-summary-metric"><span>Platform</span><strong>${escapeHtml(summary.platform)}</strong></div>
    <div class="run-summary-metric"><span>Total execution time</span><strong>${formatDuration(summary.durationSeconds)}</strong></div>
    <div class="run-summary-metric"><span>Total features</span><strong>${summary.featureCount}</strong></div>
    <div class="run-summary-metric"><span>Total scenarios</span><strong>${totalScenarios}</strong></div>
  </div>
  <div class="run-summary-results">
    <div><h2>Scenario status</h2><div class="run-summary-pie" role="img" aria-label="${counts.passed} passed, ${counts.failed} failed, ${counts.skipped} skipped"></div></div>
    <ul class="run-summary-legend">
      <li><span class="run-summary-swatch run-summary-passed"></span><span>Passed</span><strong>${counts.passed}</strong></li>
      <li><span class="run-summary-swatch run-summary-failed"></span><span>Failed</span><strong>${counts.failed}</strong></li>
      <li><span class="run-summary-swatch run-summary-skipped"></span><span>Skipped</span><strong>${counts.skipped}</strong></li>
    </ul>
  </div>
</section>
${summaryEnd}`;
}

async function mergeExecutionSummary() {
  let summaryJson;
  try {
    summaryJson = await readFile(summaryPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('No execution summary was produced; leaving the existing HTML report unchanged.');
      return;
    }
    throw error;
  }

  if (!summaryJson.trim()) {
    console.warn('No execution summary was produced; leaving the existing HTML report unchanged.');
    return;
  }

  let summary;
  try {
    summary = JSON.parse(summaryJson);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.warn('Execution summary data was incomplete; leaving the existing HTML report unchanged.');
      return;
    }
    throw error;
  }

  const reportHtml = await readFile(reportPath, 'utf8');
  const cleanReport = reportHtml.replace(/<!-- EXECUTION SUMMARY START -->[\s\S]*?<!-- EXECUTION SUMMARY END -->/, '');
  const contentMarker = '<div id="content">';
  if (!cleanReport.includes(contentMarker)) {
    throw new Error('Could not find the Cucumber report content container to merge the execution summary.');
  }

  const mergedReport = cleanReport.replace(contentMarker, `${renderSummary(summary)}\n${contentMarker}`);
  await writeFile(reportPath, mergedReport);
  await unlink(summaryPath);
}

module.exports = mergeExecutionSummary;