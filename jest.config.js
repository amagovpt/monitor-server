module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.spec.ts$',
  testPathIgnorePatterns: ['/node_modules/', '\\.integration\\.spec\\.ts$', '\\.e2e-spec\\.ts$'],
  transform: {
    '^.+\\.(t|j)s$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
          baseUrl: '.',
          paths: {
            'src/*': ['./src/*'],
            'test/*': ['./test/*'],
            '@factories/*': ['./test/factories/*'],
            '@domains/*': ['./src/domains/*'],
            '@common/*': ['./src/common/*'],
            '@core/*': ['./src/core/*'],
          },
        },
      },
    ],
  },
  transformIgnorePatterns: ['/node_modules/(?!uuid)/'],
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!main.(t|j)s',
    '!**/*.module.(t|j)s',
    '!**/*.dto.(t|j)s',
    '!**/*.entity.(t|j)s',
    '!**/*.args.(t|j)s',
    '!**/*.types.(t|j)s',
    '!**/node_modules/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@factories/(.*)$': '<rootDir>/test/factories/$1',
    '^@domains/(.*)$': '<rootDir>/src/domains/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^test/(.*)$': '<rootDir>/test/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};
