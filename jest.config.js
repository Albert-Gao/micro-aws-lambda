module.exports = {
  transform: {
    '.ts':
      '/Users/AlbertGao/codes/teamingCloud/micro-aws-lambda/node_modules/ts-jest/dist/index.js',
  },
  transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverageFrom: ['src/**/*.ts'],
  testMatch: ['<rootDir>/**/*.(spec|test).ts'],
  testURL: 'http://localhost',
  rootDir: '/Users/AlbertGao/codes/teamingCloud/micro-aws-lambda',
  watchPlugins: [
    '/Users/AlbertGao/codes/teamingCloud/micro-aws-lambda/node_modules/jest-watch-typeahead/filename.js',
    '/Users/AlbertGao/codes/teamingCloud/micro-aws-lambda/node_modules/jest-watch-typeahead/testname.js',
  ],
};
