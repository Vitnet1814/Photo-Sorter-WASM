/**
 * Тести для PhotoSorterApp класу
 * Перевіряємо основну функціональність додатку
 */

// Імпортуємо клас для тестування
// Оскільки класи експортуються як глобальні змінні, використовуємо їх напряму

describe('PhotoSorterApp', () => {
    let app;

    beforeEach(() => {
        // Створюємо новий екземпляр для кожного тесту
        app = new PhotoSorterApp();
    });

    describe('Ініціалізація', () => {
        test('має правильно ініціалізуватися з налаштуваннями за замовчуванням', () => {
            expect(app.currentSettings.language).toBe('uk');
            expect(app.currentSettings.folderFormat).toBe('monthNames');
            expect(app.currentSettings.maxFileSize).toBe(100);
            expect(app.currentSettings.processingMode).toBe('copy');
            expect(app.currentSettings.createSubfolders).toBe(false);
            expect(app.currentSettings.handleDuplicates).toBe(false);
        });

        test('має правильно встановлювати початковий стан', () => {
            expect(app.isInitialized).toBe(false);
            expect(app.isProcessing).toBe(false);
            expect(app.progressInterval).toBe(null);
        });
    });

    describe('Детекція середовища', () => {
        test('має правильно визначати операційну систему', () => {
            // Імітуємо різні user agent
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                configurable: true
            });

            const envInfo = app.getEnvironmentInfo();
            expect(envInfo.os).toBe('Windows 11');
        });

        test('має правильно визначати браузер', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                configurable: true
            });

            const envInfo = app.getEnvironmentInfo();
            expect(envInfo.browser).toBe('Chrome');
            expect(envInfo.os).toContain('macOS');
        });

        test('має правильно визначати мобільні пристрої', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
                configurable: true
            });

            const envInfo = app.getEnvironmentInfo();
            expect(envInfo.os).toBe('iOS iPhone');
            expect(envInfo.isMobile).toBe(true);
        });
    });

    describe('Управління налаштуваннями', () => {
        test('має правильно зберігати налаштування', () => {
            const newSettings = {
                language: 'en',
                folderFormat: 'numbers',
                maxFileSize: 200
            };

            app.updateSettings(newSettings);

            expect(app.currentSettings.language).toBe('en');
            expect(app.currentSettings.folderFormat).toBe('numbers');
            expect(app.currentSettings.maxFileSize).toBe(200);
        });

        test('має правильно валідувати налаштування', () => {
            const invalidSettings = {
                language: 'invalid',
                maxFileSize: -1
            };

            app.updateSettings(invalidSettings);

            // Налаштування мають залишитися валідними
            expect(app.currentSettings.language).toBe('uk');
            expect(app.currentSettings.maxFileSize).toBe(100);
        });

        test('має правильно скидати налаштування до за замовчуванням', () => {
            app.updateSettings({ language: 'en', maxFileSize: 200 });
            app.resetSettings();

            expect(app.currentSettings.language).toBe('uk');
            expect(app.currentSettings.maxFileSize).toBe(100);
        });
    });

    describe('Обробка помилок', () => {
        test('має правильно обробляти помилки ініціалізації', async () => {
            // Імітуємо помилку завантаження WASM
            app.wasmLoader = {
                load: jest.fn().mockRejectedValue(new Error('WASM load failed'))
            };

            await expect(app.initialize()).rejects.toThrow('WASM load failed');
        });

        test('має правильно обробляти помилки обробки файлів', () => {
            const errorHandler = jest.fn();
            app.onError = errorHandler;

            app.handleError('Test error', new Error('Test details'));

            expect(errorHandler).toHaveBeenCalledWith('Test error', expect.any(Error));
        });

        test('має правильно логувати помилки', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            app.logError('Test error message');

            expect(consoleSpy).toHaveBeenCalledWith('Test error message');

            consoleSpy.mockRestore();
        });
    });

    describe('Прогрес обробки', () => {
        test('має правильно оновлювати прогрес', () => {
            app.updateProgress(50, 100);

            expect(app.currentProgress).toBe(50);
            expect(app.totalItems).toBe(100);
        });

        test('має правильно обчислювати відсоток прогресу', () => {
            app.updateProgress(25, 100);
            expect(app.getProgressPercentage()).toBe(25);

            app.updateProgress(75, 100);
            expect(app.getProgressPercentage()).toBe(75);
        });

        test('має правильно обробляти нульові значення', () => {
            app.updateProgress(0, 0);
            expect(app.getProgressPercentage()).toBe(0);
        });
    });

    describe('Статистика', () => {
        test('має правильно збирати статистику обробки', () => {
            app.addToStats('processed', 10);
            app.addToStats('errors', 2);
            app.addToStats('skipped', 1);

            const stats = app.getStats();
            expect(stats.processed).toBe(10);
            expect(stats.errors).toBe(2);
            expect(stats.skipped).toBe(1);
        });

        test('має правильно скидати статистику', () => {
            app.addToStats('processed', 10);
            app.resetStats();

            const stats = app.getStats();
            expect(stats.processed).toBe(0);
            expect(stats.errors).toBe(0);
            expect(stats.skipped).toBe(0);
        });
    });

    describe('Інтернаціоналізація', () => {
        test('має правильно змінювати мову', () => {
            app.setLanguage('en');
            expect(app.currentSettings.language).toBe('en');

            app.setLanguage('uk');
            expect(app.currentSettings.language).toBe('uk');
        });

        test('має правильно валідувати мови', () => {
            app.setLanguage('invalid');
            expect(app.currentSettings.language).toBe('uk');
        });

        test('має правильно завантажувати локалізацію', async () => {
            // Імітуємо завантаження локалізації
            global.fetch = jest.fn().mockResolvedValue({
                json: () => Promise.resolve({ 'test.key': 'Test Value' })
            });

            await app.loadLocalization('en');
            expect(global.fetch).toHaveBeenCalledWith('/js/locales/en.json');
        });
    });

    describe('Продуктивність', () => {
        test('має правильно обробляти велику кількість файлів', () => {
            const startTime = Date.now();
            
            // Імітуємо обробку 1000 файлів
            for (let i = 0; i < 1000; i++) {
                app.updateProgress(i, 1000);
            }
            
            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(100); // Менше 100мс
        });

        test('має правильно обмежувати пам\'ять', () => {
            // Імітуємо обробку великих файлів
            const largeFile = { size: 50 * 1024 * 1024 }; // 50MB
            
            expect(app.isFileSizeValid(largeFile)).toBe(true);
            expect(app.isFileSizeValid({ ...largeFile, size: 150 * 1024 * 1024 })).toBe(false);
        });
    });

    describe('Безпека', () => {
        test('має правильно валідувати вхідні дані', () => {
            expect(app.validateInput('')).toBe(false);
            expect(app.validateInput(null)).toBe(false);
            expect(app.validateInput(undefined)).toBe(false);
            expect(app.validateInput('valid input')).toBe(true);
        });

        test('має правильно санітизувати дані', () => {
            const maliciousInput = '<script>alert("xss")</script>';
            const sanitized = app.sanitizeInput(maliciousInput);
            
            expect(sanitized).not.toContain('<script>');
            expect(sanitized).not.toContain('alert');
        });

        test('має правильно обробляти SQL ін\'єкції', () => {
            const sqlInjection = "'; DROP TABLE users; --";
            const sanitized = app.sanitizeInput(sqlInjection);
            
            expect(sanitized).not.toContain('DROP TABLE');
            expect(sanitized).not.toContain('--');
        });
    });

    describe('Інтеграція з WASM', () => {
        test('має правильно ініціалізувати WASM модуль', async () => {
            // Імітуємо успішне завантаження WASM
            app.wasmLoader = {
                load: jest.fn().mockResolvedValue(true),
                isLoaded: jest.fn().mockReturnValue(true)
            };

            await app.initialize();
            expect(app.isInitialized).toBe(true);
        });

        test('має правильно обробляти помилки WASM', async () => {
            // Імітуємо помилку завантаження WASM
            app.wasmLoader = {
                load: jest.fn().mockRejectedValue(new Error('WASM failed'))
            };

            await expect(app.initialize()).rejects.toThrow('WASM failed');
            expect(app.isInitialized).toBe(false);
        });
    });
});
