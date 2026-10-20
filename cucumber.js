module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: ['src/support/**/*.ts', 'src/steps/**/*.ts'],
    format: [
      'summary',
      'progress-bar',
      'html:test-results/reports/cucumber-report.html',
      './src/report/execution-summary-json-formatter.js:test-results/reports/execution-summary.json'
    ],
    paths: ['features/**/*.feature'],
    publishQuiet: true,
  },

};
