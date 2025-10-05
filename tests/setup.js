/**
 * Налаштування тестового середовища Jest
 * Імітуємо браузерні API для тестування
 */

// Імітуємо File System Access API
global.showDirectoryPicker = jest.fn();
global.showOpenFilePicker = jest.fn();
global.showSaveFilePicker = jest.fn();

// Імітуємо WebAssembly
global.WebAssembly = {
  instantiate: jest.fn(),
  instantiateStreaming: jest.fn(),
  compile: jest.fn(),
  compileStreaming: jest.fn(),
  validate: jest.fn(),
  Module: jest.fn(),
  Instance: jest.fn(),
  Memory: jest.fn(),
  Table: jest.fn(),
  CompileError: Error,
  RuntimeError: Error,
  LinkError: Error
};

// Імітуємо File API
global.File = class File {
  constructor(chunks, filename, options = {}) {
    this.name = filename;
    this.size = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
};

global.FileReader = class FileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
    this.onloadend = null;
  }
  
  readAsArrayBuffer(file) {
    setTimeout(() => {
      this.result = new ArrayBuffer(file.size);
      this.readyState = 2;
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    }, 0);
  }
  
  readAsText(file) {
    setTimeout(() => {
      this.result = 'mock file content';
      this.readyState = 2;
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    }, 0);
  }
};

// Імітуємо Blob API
global.Blob = class Blob {
  constructor(chunks, options = {}) {
    this.size = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    this.type = options.type || '';
  }
};

// Імітуємо URL API
global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn()
};

// Імітуємо console для тестів
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Імітуємо localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Імітуємо sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Імітуємо fetch API
global.fetch = jest.fn();

// Імітуємо setTimeout та setInterval
global.setTimeout = jest.fn((fn, delay) => {
  return setTimeout(fn, delay);
});

global.setInterval = jest.fn((fn, delay) => {
  return setInterval(fn, delay);
});

// Імітуємо clearTimeout та clearInterval
global.clearTimeout = jest.fn();
global.clearInterval = jest.fn();
