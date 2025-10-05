/**
 * Інтеграційні тести
 * Перевіряємо взаємодію між різними компонентами додатку
 */

// Імпортуємо класи для тестування
// Оскільки класи експортуються як глобальні змінні, використовуємо їх напряму

describe('Інтеграційні тести', () => {
    let app;
    let fileHandler;
    let wasmLoader;

    beforeEach(() => {
        app = new PhotoSorterApp();
        fileHandler = new FileHandler();
        wasmLoader = new WasmLoader();
    });

    describe('Повний цикл обробки фото', () => {
        test('має правильно обробляти фото від початку до кінця', async () => {
            // Імітуємо завантаження WASM
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

            // Імітуємо файл
            const mockFile = {
                name: 'test.jpg',
                size: 1024 * 1024,
                type: 'image/jpeg'
            };

            // Імітуємо FileReader
            global.FileReader = jest.fn().mockImplementation(() => ({
                readAsArrayBuffer: jest.fn(),
                onload: null,
                onerror: null,
                result: new ArrayBuffer(1024)
            }));

            // Валідуємо файл
            expect(fileHandler.validateFile(mockFile)).toBe(true);

            // Обробляємо файл
            const result = await wasmLoader.processImage(new ArrayBuffer(1024));
            expect(result).toBeDefined();

            // Оновлюємо статистику
            app.addToStats('processed', 1);
            expect(app.getStats().processed).toBe(1);
        });

        test('має правильно обробляти помилки в повному циклі', async () => {
            // Імітуємо помилку WASM
            wasmLoader.wasmInstance = {
                exports: {
                    processImage: jest.fn().mockImplementation(() => {
                        throw new Error('WASM processing failed');
                    })
                }
            };
            wasmLoader.isLoaded = true;

            const mockFile = {
                name: 'test.jpg',
                size: 1024 * 1024,
                type: 'image/jpeg'
            };

            // Валідуємо файл
            expect(fileHandler.validateFile(mockFile)).toBe(true);

            // Обробляємо помилку
            try {
                await wasmLoader.processImage(new ArrayBuffer(1024));
            } catch (error) {
                app.addToStats('errors', 1);
                expect(app.getStats().errors).toBe(1);
            }
        });
    });

    describe('Взаємодія між компонентами', () => {
        test('має правильно передавати налаштування між компонентами', () => {
            // Оновлюємо налаштування в додатку
            app.updateSettings({ maxFileSize: 200 });

            // Передаємо налаштування в fileHandler
            fileHandler.maxFileSize = app.currentSettings.maxFileSize * 1024 * 1024;

            expect(fileHandler.maxFileSize).toBe(200 * 1024 * 1024);
        });

        test('має правильно синхронізувати стан між компонентами', () => {
            // Встановлюємо стан обробки
            app.isProcessing = true;
            fileHandler.isProcessing = true;

            expect(app.isProcessing).toBe(true);
            expect(fileHandler.isProcessing).toBe(true);

            // Скидаємо стан
            app.isProcessing = false;
            fileHandler.isProcessing = false;

            expect(app.isProcessing).toBe(false);
            expect(fileHandler.isProcessing).toBe(false);
        });
    });

    describe('Обробка великих обсягів даних', () => {
        test('має правильно обробляти багато файлів', () => {
            const files = Array.from({ length: 100 }, (_, i) => ({
                name: `photo${i}.jpg`,
                size: 1024 * 1024,
                type: 'image/jpeg'
            }));

            let processedCount = 0;
            let errorCount = 0;

            files.forEach(file => {
                if (fileHandler.validateFile(file)) {
                    processedCount++;
                } else {
                    errorCount++;
                }
            });

            expect(processedCount).toBe(100);
            expect(errorCount).toBe(0);
        });

        test('має правильно обробляти файли різних розмірів', () => {
            const files = [
                { name: 'small.jpg', size: 1024, type: 'image/jpeg' },
                { name: 'medium.jpg', size: 10 * 1024 * 1024, type: 'image/jpeg' },
                { name: 'large.jpg', size: 100 * 1024 * 1024, type: 'image/jpeg' },
                { name: 'huge.jpg', size: 200 * 1024 * 1024, type: 'image/jpeg' }
            ];

            const results = files.map(file => ({
                name: file.name,
                valid: fileHandler.validateFile(file),
                sizeValid: fileHandler.isFileSizeValid(file)
            }));

            expect(results[0].valid).toBe(true);
            expect(results[0].sizeValid).toBe(true);
            expect(results[1].valid).toBe(true);
            expect(results[1].sizeValid).toBe(true);
            expect(results[2].valid).toBe(true);
            expect(results[2].sizeValid).toBe(true);
            expect(results[3].valid).toBe(true);
            expect(results[3].sizeValid).toBe(false);
        });
    });

    describe('Обробка помилок в інтеграції', () => {
        test('має правильно обробляти каскадні помилки', async () => {
            // Імітуємо помилку в WASM
            wasmLoader.wasmInstance = {
                exports: {
                    processImage: jest.fn().mockImplementation(() => {
                        throw new Error('WASM error');
                    })
                }
            };
            wasmLoader.isLoaded = true;

            const mockFile = {
                name: 'test.jpg',
                size: 1024 * 1024,
                type: 'image/jpeg'
            };

            // Валідуємо файл
            expect(fileHandler.validateFile(mockFile)).toBe(true);

            // Обробляємо помилку
            try {
                await wasmLoader.processImage(new ArrayBuffer(1024));
            } catch (error) {
                // Логуємо помилку
                app.logError('Processing failed', error);
                
                // Оновлюємо статистику
                app.addToStats('errors', 1);
                
                expect(app.getStats().errors).toBe(1);
            }
        });

        test('має правильно відновлюватися після помилок', async () => {
            // Імітуємо помилку завантаження WASM
            wasmLoader.load = jest.fn().mockRejectedValue(new Error('Load failed'));

            try {
                await wasmLoader.load();
            } catch (error) {
                // Скидаємо стан
                wasmLoader.isLoaded = false;
                wasmLoader.loadError = error.message;
            }

            expect(wasmLoader.isLoaded).toBe(false);
            expect(wasmLoader.loadError).toBe('Load failed');

            // Спробуємо завантажити знову
            wasmLoader.load = jest.fn().mockResolvedValue(true);
            await wasmLoader.load();

            expect(wasmLoader.isLoaded).toBe(true);
            expect(wasmLoader.loadError).toBe(null);
        });
    });

    describe('Продуктивність інтеграції', () => {
        test('має правильно обробляти файли в реальному часі', () => {
            const startTime = Date.now();
            
            // Імітуємо обробку 1000 файлів
            for (let i = 0; i < 1000; i++) {
                const file = {
                    name: `photo${i}.jpg`,
                    size: 1024 * 1024,
                    type: 'image/jpeg'
                };
                
                fileHandler.validateFile(file);
                app.updateProgress(i, 1000);
            }
            
            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(1000); // Менше 1 секунди
        });

        test('має правильно обмежувати використання ресурсів', () => {
            const maxMemory = 100 * 1024 * 1024; // 100MB
            const largeFile = { size: 150 * 1024 * 1024 }; // 150MB

            expect(fileHandler.isFileSizeValid(largeFile)).toBe(false);
            expect(app.isFileSizeValid(largeFile)).toBe(false);
        });
    });

    describe('Безпека інтеграції', () => {
        test('має правильно валідувати всі вхідні дані', () => {
            const maliciousInputs = [
                '<script>alert("xss")</script>',
                "'; DROP TABLE photos; --",
                '../../../etc/passwd',
                'file:///etc/passwd'
            ];

            maliciousInputs.forEach(input => {
                expect(app.validateInput(input)).toBe(false);
                expect(fileHandler.sanitizeInput(input)).not.toContain('<script>');
                expect(fileHandler.sanitizeInput(input)).not.toContain('DROP TABLE');
            });
        });

        test('має правильно обробляти неочікувані типи даних', () => {
            const invalidInputs = [
                null,
                undefined,
                {},
                [],
                123,
                true
            ];

            invalidInputs.forEach(input => {
                expect(() => fileHandler.validateFile(input)).toThrow();
                expect(() => app.validateInput(input)).toThrow();
            });
        });
    });
});
