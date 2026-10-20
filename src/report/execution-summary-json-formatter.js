const { Formatter } = require('@cucumber/cucumber');
const { runMetadata } = require('./run-metadata');

function getScenarioSummary(attempts) {
  const latestAttemptByScenario = new Map();
  for (const attempt of attempts) {
    latestAttemptByScenario.set(attempt.pickle.id, attempt);
  }

  const counts = { passed: 0, failed: 0, skipped: 0 };
  const featureUris = new Set();
  for (const attempt of latestAttemptByScenario.values()) {
    featureUris.add(attempt.pickle.uri);
    if (attempt.worstTestStepResult.status === 'PASSED') {
      counts.passed += 1;
    } else if (attempt.worstTestStepResult.status === 'SKIPPED') {
      counts.skipped += 1;
    } else {
      counts.failed += 1;
    }
  }

  return { counts, featureCount: featureUris.size };
}

class ExecutionSummaryJsonFormatter extends Formatter {
  static documentation = 'Writes structured execution metadata for the merged Cucumber report.';

  constructor(options) {
    super(options);
    let startedAt;
    options.eventBroadcaster.on('envelope', (envelope) => {
      if (envelope.testRunStarted?.timestamp) {
        startedAt = envelope.testRunStarted.timestamp;
      }
      if (!envelope.testRunFinished) {
        return;
      }

      const finishedAt = envelope.testRunFinished.timestamp;
      const durationSeconds = startedAt && finishedAt
        ? Math.max(0, Math.floor(
          (finishedAt.seconds - startedAt.seconds)
          + (finishedAt.nanos - startedAt.nanos) / 1_000_000_000
        ))
        : 0;
      const summary = getScenarioSummary(this.eventDataCollector.getTestCaseAttempts());

      this.stream.write(JSON.stringify({
        executionDate: startedAt
          ? new Date(startedAt.seconds * 1000 + startedAt.nanos / 1_000_000).toISOString()
          : null,
        browserName: runMetadata.browserName,
        browserVersion: runMetadata.browserVersion,
        platform: runMetadata.platform,
        durationSeconds,
        featureCount: summary.featureCount,
        counts: summary.counts
      }));
    });
  }
}

module.exports = ExecutionSummaryJsonFormatter;