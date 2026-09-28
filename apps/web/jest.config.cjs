module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/test/**/*.spec.ts?(x)'],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'CommonJS', jsx: 'react-jsx', esModuleInterop: true } }] },
  moduleNameMapper: { '\\.css$': '<rootDir>/test/style-stub.cjs' },
  clearMocks: true,
};
