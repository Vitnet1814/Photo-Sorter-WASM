/**
 * Тести для FileHandler класу
 * Перевіряємо критичні функції обробки файлів
 */

// Імпортуємо клас для тестування
// Оскільки класи експортуються як глобальні змінні, використовуємо їх напряму

describe('FileHandler', () => {
    let fileHandler;

    beforeEach(() => {
        // Створюємо новий екземпляр для кожного тесту
        fileHandler = new FileHandler();
    });

    describe('Підтримка форматів файлів', () => {
        test('має правильно визначати підтримувані формати зображень', () => {
            const supportedFormats = [
                'jpg', 'jpeg', 'png', 'tiff', 'tif', 'heic', 'webp', 
                'bmp', 'gif', 'cr2', 'nef', 'arw', 'dng'
            ];

            supportedFormats.forEach(format => {
                expect(fileHandler.supportedFormats).toContain(format);
            });
        });

        test('має правильно визначати формат файлу з розширення', () => {
            expect(fileHandler.isImageFile('photo.jpg')).toBe(true);
            expect(fileHandler.isImageFile('image.png')).toBe(true);
            expect(fileHandler.isImageFile('raw.CR2')).toBe(true);
            expect(fileHandler.isImageFile('document.txt')).toBe(false);
            expect(fileHandler.isImageFile('video.mp4')).toBe(false);
        });

        test('має ігнорувати регістр розширення', () => {
            expect(fileHandler.isImageFile('PHOTO.JPG')).toBe(true);
            expect(fileHandler.isImageFile('Image.PNG')).toBe(true);
            expect(fileHandler.isImageFile('RAW.cr2')).toBe(true);
        });

        test('має правильно обробляти файли з кількома крапками', () => {
            expect(fileHandler.isImageFile('photo.backup.jpg')).toBe(true);
            expect(fileHandler.isImageFile('image.copy.png')).toBe(true);
            expect(fileHandler.isImageFile('file.backup.txt')).toBe(false);
        });
    });

    describe('Перевірка розміру файлів', () => {
        test('має правильно встановлювати максимальний розмір файлу', () => {
            expect(fileHandler.maxFileSize).toBe(100 * 1024 * 1024); // 100MB
        });

        test('має правильно перевіряти розмір файлу', () => {
            const smallFile = { size: 1024 * 1024 }; // 1MB
            const largeFile = { size: 200 * 1024 * 1024 }; // 200MB

            expect(fileHandler.isFileSizeValid(smallFile)).toBe(true);
            expect(fileHandler.isFileSizeValid(largeFile)).toBe(false);
        });

        test('має правильно обробляти файли точно на межі', () => {
            const boundaryFile = { size: fileHandler.maxFileSize };
            const overBoundaryFile = { size: fileHandler.maxFileSize + 1 };

            expect(fileHandler.isFileSizeValid(boundaryFile)).toBe(true);
            expect(fileHandler.isFileSizeValid(overBoundaryFile)).toBe(false);
        });
    });

    describe('Підтримка File System Access API', () => {
        test('має правильно визначати підтримку API', () => {
            // Імітуємо підтримку API
            global.showDirectoryPicker = jest.fn();
            expect(fileHandler.isSupported()).toBe(true);

            // Імітуємо відсутність підтримки
            delete global.showDirectoryPicker;
            expect(fileHandler.isSupported()).toBe(false);
        });

        test('має правильно обробляти помилки при виборі папки', async () => {
            // Імітуємо помилку
            global.showDirectoryPicker = jest.fn().mockRejectedValue(new Error('User cancelled'));

            await expect(fileHandler.selectInputFolder()).rejects.toThrow('User cancelled');
        });
    });

    describe('Статистика обробки', () => {
        test('має правильно ініціалізувати статистику', () => {
            expect(fileHandler.processedFiles).toBe(0);
            expect(fileHandler.totalFiles).toBe(0);
            expect(fileHandler.errors).toBe(0);
            expect(fileHandler.skipped).toBe(0);
            expect(fileHandler.isProcessing).toBe(false);
        });

        test('має правильно оновлювати статистику', () => {
            fileHandler.updateStats('processed');
            expect(fileHandler.processedFiles).toBe(1);

            fileHandler.updateStats('error');
            expect(fileHandler.errors).toBe(1);

            fileHandler.updateStats('skipped');
            expect(fileHandler.skipped).toBe(1);
        });

        test('має правильно скидати статистику', () => {
            fileHandler.processedFiles = 10;
            fileHandler.errors = 2;
            fileHandler.skipped = 1;

            fileHandler.resetStats();
            expect(fileHandler.processedFiles).toBe(0);
            expect(fileHandler.errors).toBe(0);
            expect(fileHandler.skipped).toBe(0);
        });
    });

    describe('Валідація файлів', () => {
        test('має правильно валідувати файли', () => {
            const validFile = {
                name: 'photo.jpg',
                size: 1024 * 1024, // 1MB
                type: 'image/jpeg'
            };

            const invalidFile = {
                name: 'document.txt',
                size: 1024 * 1024,
                type: 'text/plain'
            };

            expect(fileHandler.validateFile(validFile)).toBe(true);
            expect(fileHandler.validateFile(invalidFile)).toBe(false);
        });

        test('має правильно обробляти файли без розширення', () => {
            const fileWithoutExtension = {
                name: 'photo',
                size: 1024 * 1024,
                type: 'image/jpeg'
            };

            expect(fileHandler.validateFile(fileWithoutExtension)).toBe(false);
        });

        test('має правильно обробляти файли з невідомим типом', () => {
            const fileWithUnknownType = {
                name: 'photo.jpg',
                size: 1024 * 1024,
                type: 'application/octet-stream'
            };

            // Файл має бути валідним, якщо розширення правильне
            expect(fileHandler.validateFile(fileWithUnknownType)).toBe(true);
        });
    });

    describe('Обробка помилок', () => {
        test('має правильно обробляти помилки читання файлів', async () => {
            const mockFile = {
                name: 'photo.jpg',
                size: 1024 * 1024,
                type: 'image/jpeg'
            };

            // Імітуємо помилку читання
            global.FileReader = jest.fn().mockImplementation(() => ({
                readAsArrayBuffer: jest.fn(),
                onerror: null,
                onload: null
            }));

            await expect(fileHandler.readFileData(mockFile)).rejects.toThrow();
        });

        test('має правильно логувати помилки', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            fileHandler.logError('Test error', new Error('Test error details'));

            expect(consoleSpy).toHaveBeenCalledWith('Test error', expect.any(Error));

            consoleSpy.mockRestore();
        });
    });

    describe('Продуктивність', () => {
        test('має правильно обробляти велику кількість файлів', () => {
            const files = Array.from({ length: 1000 }, (_, i) => ({
                name: `photo${i}.jpg`,
                size: 1024 * 1024,
                type: 'image/jpeg'
            }));

            const startTime = Date.now();
            files.forEach(file => fileHandler.validateFile(file));
            const endTime = Date.now();

            // Перевіряємо, що обробка займає менше 1 секунди
            expect(endTime - startTime).toBeLessThan(1000);
        });

        test('має правильно обмежувати пам\'ять при обробці', () => {
            // Імітуємо обробку великих файлів
            const largeFile = {
                name: 'large.jpg',
                size: 50 * 1024 * 1024, // 50MB
                type: 'image/jpeg'
            };

            expect(fileHandler.isFileSizeValid(largeFile)).toBe(true);
            expect(fileHandler.isFileSizeValid({ ...largeFile, size: 150 * 1024 * 1024 })).toBe(false);
        });
    });
});
