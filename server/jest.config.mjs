/** @type {import('jest').Config} */
const config = {
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
    '!src/models/**',        // Mongoose schema definitions — no logic to unit test
    '!src/utils/**',         // simple utility classes
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

  // Only treat *.test.js files as test suites (excludes helpers living in __tests__ dirs)
  testMatch: ['**/*.test.js'],

  // Verbose output so each test name is printed
  verbose: true,

  // Integration suites spin up an in-memory MongoDB replica set in beforeAll;
  // the default 5s hook timeout is too tight for replica-set startup.
  testTimeout: 30000,
};

export default config;
