module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^uuid$': '<rootDir>/src/tests/uuidMock.ts',
    '^@xenova/transformers$': '<rootDir>/src/tests/transformersMock.ts',
  },
};
