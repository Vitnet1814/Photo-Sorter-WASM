/**
 * Тести для WASM лоадера
 * Перевіряємо завантаження та роботу з WebAssembly модулем
 */

// Імпортуємо клас для тестування
// Оскільки класи експортуються як глобальні змінні, використовуємо їх напряму

describe('WasmLoader', () => {
    let wasmLoader;

    beforeEach(() => {
        wasmLoader = new WasmLoader();
    });

    describe('Ініціалізація', () => {
        test('має правильно ініціалізуватися', () => {
            expect(wasmLoader.isLoaded).toBe(false);
            expect(wasmLoader.isLoading).toBe(false);
            expect(wasmLoader.loadError).toBe(null);
        });

        test('має правильно встановлювати шляхи до файлів', () => {
            expect(wasmLoader.wasmPath).toBeDefined();
            expect(wasmLoader.jsPath).toBeDefined();
        });
    });

    describe('Завантаження WASM', () => {
        test('має правильно завантажувати WASM модуль', async () => {
            // Імітуємо успішне завантаження
            global.WebAssembly.instantiateStreaming = jest.fn().mockResolvedValue({
                instance: {
                    exports: {
                        processImage: jest.fn(),
                        getImageInfo: jest.fn()
                    }
                }
            });

            global.fetch = jest.fn().mockResolvedValue({
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
            });

            await wasmLoader.load();

            expect(wasmLoader.isLoaded).toBe(true);
            expect(wasmLoader.isLoading).toBe(false);
            expect(wasmLoader.loadError).toBe(null);
        });

        test('має правильно обробляти помилки завантаження', async () => {
            // Імітуємо помилку завантаження
            global.WebAssembly.instantiateStreaming = jest.fn().mockRejectedValue(
                new Error('WASM load failed')
            );

            await expect(wasmLoader.load()).rejects.toThrow('WASM load failed');
            expect(wasmLoader.isLoaded).toBe(false);
            expect(wasmLoader.loadError).toBeDefined();
        });

        test('має правильно обробляти відсутність підтримки WebAssembly', async () => {
            // Імітуємо відсутність підтримки
            const originalWebAssembly = global.WebAssembly;
            delete global.WebAssembly;

            await expect(wasmLoader.load()).rejects.toThrow('WebAssembly не підтримується');

            // Відновлюємо WebAssembly
            global.WebAssembly = originalWebAssembly;
        });
    });

    describe('Робота з експортованими функціями', () => {
        beforeEach(async () => {
            // Імітуємо завантажений WASM модуль
            wasmLoader.wasmInstance = {
                exports: {
                    processImage: jest.fn().mockReturnValue(1),
                    getImageInfo: jest.fn().mockReturnValue({
                        width: 1920,
                        height: 1080,
                        format: 'JPEG'
                    }),
                    freeMemory: jest.fn()
                }
            };
            wasmLoader.isLoaded = true;
        });

        test('має правильно викликати функції WASM', () => {
            const result = wasmLoader.callWasmFunction('processImage', [1, 2, 3]);
            expect(result).toBe(1);
            expect(wasmLoader.wasmInstance.exports.processImage).toHaveBeenCalledWith(1, 2, 3);
        });

        test('має правильно обробляти помилки виклику функцій', () => {
            wasmLoader.wasmInstance.exports.processImage = jest.fn().mockImplementation(() => {
                throw new Error('WASM function error');
            });

            expect(() => {
                wasmLoader.callWasmFunction('processImage', [1, 2, 3]);
            }).toThrow('WASM function error');
        });

        test('має правильно перевіряти наявність функцій', () => {
            expect(wasmLoader.hasFunction('processImage')).toBe(true);
            expect(wasmLoader.hasFunction('nonExistentFunction')).toBe(false);
        });
    });

    describe('Управління пам\'яттю', () => {
        test('має правильно виділяти пам\'ять', () => {
            const size = 1024;
            const ptr = wasmLoader.allocateMemory(size);
            expect(ptr).toBeDefined();
            expect(typeof ptr).toBe('number');
        });

        test('має правильно звільняти пам\'ять', () => {
            const ptr = wasmLoader.allocateMemory(1024);
            expect(() => wasmLoader.freeMemory(ptr)).not.toThrow();
        });

        test('має правильно обробляти помилки управління пам\'яттю', () => {
            expect(() => wasmLoader.freeMemory(null)).toThrow();
            expect(() => wasmLoader.freeMemory(undefined)).toThrow();
        });
    });

    describe('Обробка зображень', () => {
        beforeEach(async () => {
            // Імітуємо завантажений WASM модуль
            wasmLoader.wasmInstance = {
                exports: {
                    processImage: jest.fn().mockReturnValue(1),
                    getImageInfo: jest.fn().mockReturnValue({
                        width: 1920,
                        height: 1080,
                        format: 'JPEG'
                    }),
                    freeMemory: jest.fn()
                }
            };
            wasmLoader.isLoaded = true;
        });

        test('має правильно обробляти зображення', async () => {
            const mockImageData = new ArrayBuffer(1024);
            const result = await wasmLoader.processImage(mockImageData);

            expect(result).toBeDefined();
            expect(wasmLoader.wasmInstance.exports.processImage).toHaveBeenCalled();
        });

        test('має правильно отримувати інформацію про зображення', () => {
            const imageInfo = wasmLoader.getImageInfo();
            
            expect(imageInfo.width).toBe(1920);
            expect(imageInfo.height).toBe(1080);
            expect(imageInfo.format).toBe('JPEG');
        });

        test('має правильно обробляти помилки обробки зображень', async () => {
            wasmLoader.wasmInstance.exports.processImage = jest.fn().mockImplementation(() => {
                throw new Error('Image processing failed');
            });

            const mockImageData = new ArrayBuffer(1024);
            await expect(wasmLoader.processImage(mockImageData)).rejects.toThrow('Image processing failed');
        });
    });

    describe('Продуктивність', () => {
        test('має правильно обробляти великі зображення', async () => {
            // Імітуємо завантажений WASM модуль
            wasmLoader.wasmInstance = {
                exports: {
                    processImage: jest.fn().mockReturnValue(1),
                    getImageInfo: jest.fn().mockReturnValue({
                        width: 4000,
                        height: 3000,
                        format: 'JPEG'
                    }),
                    freeMemory: jest.fn()
                }
            };
            wasmLoader.isLoaded = true;

            const largeImageData = new ArrayBuffer(10 * 1024 * 1024); // 10MB
            const startTime = Date.now();
            
            await wasmLoader.processImage(largeImageData);
            
            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(5000); // Менше 5 секунд
        });

        test('має правильно обмежувати використання пам\'яті', () => {
            const maxMemory = 100 * 1024 * 1024; // 100MB
            const largeSize = 200 * 1024 * 1024; // 200MB

            expect(() => wasmLoader.allocateMemory(largeSize)).toThrow('Недостатньо пам\'яті');
        });
    });

    describe('Безпека', () => {
        test('має правильно валідувати вхідні дані', () => {
            expect(() => wasmLoader.processImage(null)).toThrow();
            expect(() => wasmLoader.processImage(undefined)).toThrow();
            expect(() => wasmLoader.processImage('invalid')).toThrow();
        });

        test('має правильно санітизувати параметри', () => {
            const maliciousParams = ['<script>alert("xss")</script>'];
            const sanitized = wasmLoader.sanitizeParams(maliciousParams);
            
            expect(sanitized[0]).not.toContain('<script>');
            expect(sanitized[0]).not.toContain('alert');
        });

        test('має правильно обробляти SQL ін\'єкції в параметрах', () => {
            const sqlInjection = "'; DROP TABLE images; --";
            const sanitized = wasmLoader.sanitizeParams([sqlInjection]);
            
            expect(sanitized[0]).not.toContain('DROP TABLE');
            expect(sanitized[0]).not.toContain('--');
        });
    });

    describe('Логування та діагностика', () => {
        test('має правильно логувати події', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            wasmLoader.log('Test message');
            
            expect(consoleSpy).toHaveBeenCalledWith('WasmLoader:', 'Test message');
            
            consoleSpy.mockRestore();
        });

        test('має правильно логувати помилки', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            wasmLoader.logError('Test error', new Error('Test details'));
            
            expect(consoleSpy).toHaveBeenCalledWith('WasmLoader Error:', 'Test error', expect.any(Error));
            
            consoleSpy.mockRestore();
        });

        test('має правильно збирати діагностичну інформацію', () => {
            const diagnostics = wasmLoader.getDiagnostics();
            
            expect(diagnostics.isLoaded).toBeDefined();
            expect(diagnostics.isLoading).toBeDefined();
            expect(diagnostics.loadError).toBeDefined();
            expect(diagnostics.memoryUsage).toBeDefined();
        });
    });
});
