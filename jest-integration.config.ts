import type { Config } from 'jest';
import baseConfig from './jest.config';

const config: Config = {
  ...baseConfig,
  testRegex: '\\.integration\\.spec\\.ts$',
  testPathIgnorePatterns: ['/node_modules/'],
  testTimeout: 180000,
  maxWorkers: 1,
};

export default config;
