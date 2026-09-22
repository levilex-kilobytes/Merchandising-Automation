module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  passWithNoTests: true,
  moduleNameMapper: {
    '^@mfa/errors$': '<rootDir>/../../packages/errors/src',
    '^@mfa/logger$': '<rootDir>/../../packages/logger/src',
    '^@mfa/event-bus$': '<rootDir>/../../packages/event-bus/src',
    '^@mfa/shared-types$': '<rootDir>/../../packages/shared-types/src'
  }
};
