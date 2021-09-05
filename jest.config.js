const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/', '<rootDir>/test/'],
  testRegex: '\\.(spec|e2e-spec)\\.ts$',
  testPathIgnorePatterns: ['/node_modules/'],
  testTimeout: 20000,
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  coveragePathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/test/'],
  coverageDirectory: '<rootDir>/test/.coverage',
  reporters: ['default'],
};
