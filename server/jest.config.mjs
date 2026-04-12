/** @type {import('jest').Config} */
const config = {
  // Treat .js files as ESM (required for "type": "module" projects)
  extensionsToTreatAsEsm: ['.js'],

  // Test environment
  testEnvironment: 'node',

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Coverage collection
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',        // entry point — not unit-testable
    '!src/config/**',        // DB connection bootstrapping
  ],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      lines: 70,
      functions: 70,
    },
  },

  // Only scan src for tests
  roots: ['<rootDir>/src'],

  // Verbose output so each test name is printed
  verbose: true,
};

export default config;
