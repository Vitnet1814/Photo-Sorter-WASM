/**
 * File Handler
 * Обробляє файли та папки через File System Access API
 */

class FileHandler {
    constructor() {
        this.inputFolderHandle = null;
        this.outputFolderHandle = null;
        this.supportedFormats = [
            'jpg', 'jpeg', 'png', 'tiff', 'tif', 'heic', 'webp', 
            'bmp', 'gif', 'cr2', 'nef', 'arw', 'dng'
        ];
        this.maxFileSize = 100 * 1024 * 1024; // 100MB
        this.isProcessing = false;
        this.processedFiles = 0;
        this.totalFiles = 0;
        this.errors = 0;
        this.skipped = 0;
    }

    /**
     * Перевіряє підтримку File System Access API
     * @returns {boolean} Чи підтримується API
     */
    isSupported() {
        return 'showDirectoryPicker' in window;
    }

    /**
     * Вибір вхідної папки
     * @returns {Promise<FileSystemDirectoryHandle>} Handle папки
     */
    async selectInputFolder() {
        try {
            if (!this.isSupported()) {
                throw new Error('File System Access API не підтримується в цьому браузері');
            }

            this.inputFolderHandle = await window.showDirectoryPicker({
                mode: 'read'
            });

            console.log('📁 Вхідна папка вибрана:', this.inputFolderHandle.name);
            return this.inputFolderHandle;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Вибір папки скасовано');
                return null;
            }
            console.error('Помилка вибору вхідної папки:', error);
            throw error;
        }
    }

    /**
     * Вибір вихідної папки
     * @returns {Promise<FileSystemDirectoryHandle>} Handle папки
     */
    async selectOutputFolder() {
        try {
            if (!this.isSupported()) {
                throw new Error('File System Access API не підтримується в цьому браузері');
            }

            this.outputFolderHandle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });

            console.log('📁 Вихідна папка вибрана:', this.outputFolderHandle.name);
            return this.outputFolderHandle;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Вибір папки скасовано');
                return null;
            }
            console.error('Помилка вибору вихідної папки:', error);
            throw error;
        }
    }

    /**
     * Отримує інформацію про папку
     * @param {FileSystemDirectoryHandle} folderHandle - Handle папки
     * @returns {Promise<Object>} Інформація про папку
     */
    async getFolderInfo(folderHandle) {
        try {
            const files = await this.getImageFiles(folderHandle);
            const totalSize = files.reduce((sum, fileObj) => sum + fileObj.file.size, 0);
            
            return {
                name: folderHandle.name,
                fileCount: files.length,
                totalSize: totalSize,
                formattedSize: this.formatFileSize(totalSize)
            };
        } catch (error) {
            console.error('Помилка отримання інформації про папку:', error);
            return {
                name: folderHandle.name,
                fileCount: 0,
                totalSize: 0,
                formattedSize: '0 B'
            };
        }
    }

    /**
     * Отримує всі зображення з папки
     * @param {FileSystemDirectoryHandle} folderHandle - Handle папки
     * @param {FileSystemDirectoryHandle} parentHandle - Handle батьківської папки
     * @returns {Promise<Array>} Масив об'єктів {file, handle, parentHandle}
     */
    async getImageFiles(folderHandle, parentHandle = null) {
        const files = [];
        
        try {
            for await (const [name, handle] of folderHandle.entries()) {
                if (handle.kind === 'file') {
                    const extension = name.split('.').pop().toLowerCase();
                    if (this.supportedFormats.includes(extension)) {
                        try {
                            const file = await handle.getFile();
                            files.push({ file, handle, parentHandle: folderHandle });
                        } catch (error) {
                            console.warn(`Не вдалося прочитати файл ${name}:`, error);
                        }
                    }
                } else if (handle.kind === 'directory') {
                    // Рекурсивно обробляємо підпапки
                    const subFiles = await this.getImageFiles(handle, folderHandle);
                    files.push(...subFiles);
                }
            }
        } catch (error) {
            console.error('Помилка читання папки:', error);
        }

        return files;
    }

    /**
     * Перевіряє чи є файл зображенням
     * @param {string} filename - Назва файлу
     * @returns {boolean} Чи є файл зображенням
     */
    isImageFile(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        return this.supportedFormats.includes(extension);
    }

    /**
     * Форматує розмір файлу
     * @param {number} bytes - Розмір в байтах
     * @returns {string} Відформатований розмір
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Читає EXIF дані з файлу
     * @param {File} file - Файл
     * @returns {Promise<Object>} EXIF дані
     */
    async readExifData(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Використовуємо WASM модуль для читання EXIF
            if (window.wasmLoader && window.wasmLoader.isModuleLoaded()) {
                const readerPtr = window.wasmLoader.createExifReader(uint8Array);
                
                if (readerPtr) {
                    const exifData = {
                        dateTaken: window.wasmLoader.readExifDate(readerPtr),
                        cameraMake: window.wasmLoader.readCameraMake(readerPtr),
                        cameraModel: window.wasmLoader.readCameraModel(readerPtr),
                        width: window.wasmLoader.readImageWidth(readerPtr),
                        height: window.wasmLoader.readImageHeight(readerPtr),
                        hasExif: window.wasmLoader.hasExifData(readerPtr)
                    };
                    
                    window.wasmLoader.destroyExifReader(readerPtr);
                    return exifData;
                }
            }
            
            // Fallback: повертаємо базові дані
            return {
                dateTaken: '',
                cameraMake: '',
                cameraModel: '',
                width: 0,
                height: 0,
                hasExif: false
            };
        } catch (error) {
            console.error('Помилка читання EXIF даних:', error);
            return {
                dateTaken: '',
                cameraMake: '',
                cameraModel: '',
                width: 0,
                height: 0,
                hasExif: false
            };
        }
    }

    /**
     * Обробляє один файл
     * @param {File} file - Файл для обробки
     * @param {Object} options - Опції обробки
     * @returns {Promise<Object>} Результат обробки
     */
    async processFile(file, options = {}) {
        try {
            // Перевіряємо розмір файлу
            if (file.size > this.maxFileSize) {
                throw new Error(`Файл занадто великий: ${this.formatFileSize(file.size)}`);
            }

            // Читаємо EXIF дані
            const exifData = await this.readExifData(file);
            
            // Читаємо файл як Uint8Array для WASM
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Обробляємо через WASM модуль
            if (window.wasmLoader && window.wasmLoader.isModuleLoaded()) {
                window.wasmLoader.processPhoto(
                    file.name,
                    uint8Array,
                    exifData.dateTaken,
                    new Date(file.lastModified).toISOString().split('T')[0],
                    exifData.cameraMake,
                    exifData.cameraModel,
                    '', // location
                    file.size,
                    exifData.width,
                    exifData.height
                );
            }

            this.processedFiles++;
            
            return {
                success: true,
                filename: file.name,
                size: file.size,
                exifData: exifData
            };
        } catch (error) {
            this.errors++;
            console.error(`Помилка обробки файлу ${file.name}:`, error);
            
            return {
                success: false,
                filename: file.name,
                error: error.message
            };
        }
    }

    /**
     * Обробляє всі файли в папці
     * @param {Object} options - Опції обробки
     * @param {Function} progressCallback - Callback для прогресу
     * @returns {Promise<Object>} Результат обробки
     */
    async processAllFiles(options = {}, progressCallback = null) {
        if (!this.inputFolderHandle) {
            throw new Error('Вхідна папка не вибрана');
        }

        if (!this.outputFolderHandle) {
            throw new Error('Вихідна папка не вибрана');
        }

        this.isProcessing = true;
        this.processedFiles = 0;
        this.errors = 0;
        this.skipped = 0;

        try {
            const files = await this.getImageFiles(this.inputFolderHandle);
            this.totalFiles = files.length;

            if (files.length === 0) {
                throw new Error('В папці не знайдено зображень');
            }

            console.log(`📊 Знайдено ${files.length} зображень для обробки`);
            
            // Діагностична інформація для мобільних пристроїв
            if (/Android|iPhone|iPad|BlackBerry|Windows Phone/.test(navigator.userAgent)) {
                console.log('📱 Мобільний режим: увімкнено пококращене логування');
                console.log('📱 User Agent:', navigator.userAgent);
            }

            // Обробляємо файли по одному
            for (let i = 0; i < files.length; i++) {
                if (!this.isProcessing) {
                    break; // Скасовано користувачем
                }

                const fileObj = files[i];
                const file = fileObj.file;
                const fileHandle = fileObj.handle;
                const parentHandle = fileObj.parentHandle;
                const result = await this.processFile(file, options);

                // Копіюємо або переміщуємо файл
                await this.copyOrMoveFile(file, options.processingMode || 'copy', fileHandle, parentHandle);

                // Викликаємо callback прогресу
                if (progressCallback) {
                    progressCallback({
                        current: i + 1,
                        total: files.length,
                        processed: this.processedFiles,
                        errors: this.errors,
                        skipped: this.skipped,
                        currentFile: file.name,
                        result: result
                    });
                }

                // Невелика затримка для UI
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            return {
                success: true,
                total: files.length,
                processed: this.processedFiles,
                errors: this.errors,
                skipped: this.skipped
            };
        } catch (error) {
            console.error('Помилка обробки файлів:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Копіює або переміщує файл у відповідну папку
     * @param {File} file - Файл для обробки
     * @param {string} mode - Режим: 'copy' або 'move'
     * @param {FileSystemFileHandle} originalFileHandle - Handle оригінального файлу (для переміщення)
     * @param {FileSystemDirectoryHandle} parentHandle - Handle батьківської папки оригінального файлу
     */
    async copyOrMoveFile(file, mode = 'copy', originalFileHandle = null, parentHandle = null) {
        try {
            // Отримуємо метадані з WASM
            const metadata = this.getFileMetadata(file);
            
            // Створюємо структуру папок
            const folderPath = this.createFolderStructure(metadata);
            
            // Створюємо папки
            const targetFolderHandle = await this.createFolders(folderPath);
            
            // Копіюємо або переміщуємо файл
            if (mode === 'copy') {
                await this.copyFileToFolder(file, targetFolderHandle);
                console.log(`📋 Скопійовано: ${file.name} -> ${folderPath}`);
            } else {
                await this.moveFileToFolder(file, targetFolderHandle, originalFileHandle, parentHandle);
                console.log(`📦 Переміщено: ${file.name} -> ${folderPath}`);
            }
            
            this.processedFiles++;
            
        } catch (error) {
            console.error(`Помилка обробки файлу ${file.name}:`, error);
            this.errors++;
        }
    }

    /**
     * Отримує метадані файлу з WASM
     * @param {File} file - Файл
     * @returns {Object} Метадані
     */
    getFileMetadata(file) {
        // Симуляція метаданих для тестування
        const date = new Date(file.lastModified);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return {
            dateTaken: `${year}-${month}-${day}`,
            cameraMake: 'Test Camera',
            cameraModel: 'Test Model',
            fileSize: file.size,
            format: file.name.split('.').pop().toLowerCase()
        };
    }

    /**
     * Створює структуру папок для файлу
     * @param {Object} metadata - Метадані файлу
     * @returns {string} Шлях до папки
     */
    createFolderStructure(metadata) {
        const basePath = this.outputFolderHandle.name;
        
        if (!metadata.dateTaken) {
            return `${basePath}/Без дати`;
        }
        
        const [year, month, day] = metadata.dateTaken.split('-');
        
        // Мапи місяців українською
        const monthNames = {
            '01': '01_січень', '02': '02_лютий', '03': '03_березень',
            '04': '04_квітень', '05': '05_травень', '06': '06_червень',
            '07': '07_липень', '08': '08_серпень', '09': '09_вересень',
            '10': '10_жовтень', '11': '11_листопад', '12': '12_грудень'
        };
        
        const monthName = monthNames[month] || month;
        
        return `${basePath}/${year}/${monthName}/${day}`;
    }

    /**
     * Створює папки в файловій системі
     * @param {string} folderPath - Шлях до папки
     */
    async createFolders(folderPath) {
        try {
            const parts = folderPath.split('/').filter(part => part && part !== this.outputFolderHandle.name);
            let currentHandle = this.outputFolderHandle;
            
            for (const part of parts) {
                try {
                    currentHandle = await currentHandle.getDirectoryHandle(part);
                } catch (error) {
                    if (error.name === 'NotFoundError') {
                        currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
                        console.log(`📁 Створено папку: ${part}`);
                    } else {
                        throw error;
                    }
                }
            }
            
            return currentHandle;
        } catch (error) {
            console.error('Помилка створення папок:', error);
            throw error;
        }
    }

    /**
     * Копіює файл у папку
     * @param {File} file - Файл для копіювання
     * @param {FileSystemDirectoryHandle} targetFolderHandle - Handle папки призначення
     */
    async copyFileToFolder(file, targetFolderHandle) {
        try {
            // Створюємо новий файл у цільовій папці
            const fileName = file.name;
            const newFileHandle = await targetFolderHandle.getFileHandle(fileName, { create: true });
            const writable = await newFileHandle.createWritable();
            
            // Для місткості з мобільними пристроями використовуємо Blob замість Uint8Array
            await writable.write(file);
            
            // Переконуємося, що дані записані повністю
            await writable.close();
            
            console.log(`✅ Записано файл: ${fileName} (${file.size} байт)`);
            
        } catch (error) {
            console.error('Помилка копіювання файлу:', error);
            
            // Якщо записи Blob не працює, пробуємо через ArrayBuffer
            try {
                const arrayBuffer = await file.arrayBuffer();
                const newFileHandle = await targetFolderHandle.getFileHandle(file.name, { create: true });
                const writable = await newFileHandle.createWritable();
                
                // Записуємо по чанках для мобільних пристроїв
                await this.writeInChunks(writable, arrayBuffer);
                await writable.close();
                
                console.log(`✅ Записано файл (через fallback): ${file.name} (${file.size} байт)`);
                
            } catch (fallbackError) {
                console.error('Помилка fallback запису:', fallbackError);
                throw fallbackError;
            }
        }
    }
    
    /**
     * Записує дані по чанках для кращої сумісності з мобільними пристроями
     * @param {FileSystemWritableFileTransform} writable - Writable поток
     * @param {ArrayBuffer} arrayBuffer - Дані для запису
     */
    async writeInChunks(writable, arrayBuffer) {
        const chunkSize = 1024 * 1024; // 1MB чанки
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let offset = 0; offset < uint8Array.length; offset += chunkSize) {
            const chunk = uint8Array.slice(offset, offset + chunkSize);
            await writable.write({
                type: 'write',
                data: chunk
            });
            
            // Невелика пауза між чанками для UI
            if (offset % (chunkSize * 10) === 0) {
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }
    }

    /**
     * Переміщує файл у папку
     * @param {File} file - Файл для переміщення
     * @param {FileSystemDirectoryHandle} targetFolderHandle - Handle папки призначення
     * @param {FileSystemFileHandle} originalFileHandle - Handle оригінального файлу (для видалення)
     * @param {FileSystemDirectoryHandle} parentHandle - Handle батьківської папки оригінального файлу
    async moveFileToFolder(file, targetFolderHandle, originalFileHandle = null, parentHandle = null) {
        try {
            // Спочатку копіюємо
            await this.copyFileToFolder(file, targetFolderHandle);
            
            // Потім видаляємо оригінальний файл (якщо є handle)
            if (originalFileHandle && parentHandle) {
                try {
                    // Видаляємо оригінальний файл
                    await parentHandle.removeEntry(originalFileHandle.name);
                    console.log(`🗑️ Видалено оригінал: ${file.name}`);
                } catch (deleteError) {
                    console.warn('Не вдалося видалити оригінальний файл:', deleteError);
                    console.log('⚠️ Файл скопійовано, але оригінал залишився');
                }
            } else {
                console.log('⚠️ Переміщення: немає доступу до оригінального файлу для видалення');
            }
            
        } catch (error) {
            console.error('Помилка переміщення файлу:', error);
            throw error;
        }
    }

    /**
     * Скасовує обробку
     */
    cancelProcessing() {
        this.isProcessing = false;
        console.log('⏹️ Обробка скасована');
    }

    /**
     * Отримує поточний прогрес
     * @returns {Object} Поточний прогрес
     */
    getProgress() {
        return {
            isProcessing: this.isProcessing,
            processed: this.processedFiles,
            total: this.totalFiles,
            errors: this.errors,
            skipped: this.skipped,
            percentage: this.totalFiles > 0 ? Math.round((this.processedFiles / this.totalFiles) * 100) : 0
        };
    }

    /**
     * Отримує статистику
     * @returns {Object} Статистика
     */
    getStatistics() {
        if (window.wasmLoader && window.wasmLoader.isModuleLoaded()) {
            return window.wasmLoader.getStatistics();
        }

        return {
            total_photos: this.processedFiles,
            valid_photos: this.processedFiles - this.errors,
            with_exif: 0,
            large_files: 0,
            total_size: 0,
            errors: this.errors
        };
    }

    /**
     * Очищає дані
     */
    clear() {
        this.processedFiles = 0;
        this.totalFiles = 0;
        this.errors = 0;
        this.skipped = 0;
        this.isProcessing = false;

        if (window.wasmLoader && window.wasmLoader.isModuleLoaded()) {
            window.wasmLoader.clearMetadata();
        }
    }

    /**
     * Встановлює максимальний розмір файлу
     * @param {number} sizeInMB - Розмір в мегабайтах
     */
    setMaxFileSize(sizeInMB) {
        this.maxFileSize = sizeInMB * 1024 * 1024;
    }

    /**
     * Отримує підтримувані формати
     * @returns {Array} Масив форматів
     */
    getSupportedFormats() {
        return [...this.supportedFormats];
    }

    /**
     * Додає новий формат
     * @param {string} format - Формат файлу
     */
    addSupportedFormat(format) {
        if (!this.supportedFormats.includes(format.toLowerCase())) {
            this.supportedFormats.push(format.toLowerCase());
        }
    }

    /**
     * Видаляє формат
     * @param {string} format - Формат файлу
     */
    removeSupportedFormat(format) {
        const index = this.supportedFormats.indexOf(format.toLowerCase());
        if (index > -1) {
            this.supportedFormats.splice(index, 1);
        }
    }
}

// Створюємо глобальний екземпляр
window.fileHandler = new FileHandler();

// Експортуємо для використання в інших модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileHandler;
}
