module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
  watchman: false,
};
