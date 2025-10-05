module.exports = {
  // Тестове середовище для браузера
  testEnvironment: 'jsdom',
  
  // Папки з тестами
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Папки для ігнорування
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/emsdk/'
  ],
  
  // Налаштування для модулів
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/js/$1',
    '^@css/(.*)$': '<rootDir>/css/$1'
  },
  
  // Збірка покриття коду
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/locales/**',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  
  // Пороги покриття
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Налаштування для браузерних API
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Таймаут для тестів
  testTimeout: 10000,
  
  // Вербальність виводу
  verbose: true
};