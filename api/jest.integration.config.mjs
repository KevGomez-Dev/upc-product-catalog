import unit from './jest.config.mjs';

const config = {
  ...unit,
  testMatch: ['<rootDir>/test/*.integration.cjs'],
  testTimeout: 30000,
};

export default config;
