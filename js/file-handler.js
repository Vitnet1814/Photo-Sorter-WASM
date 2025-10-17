/**
 * File Handler
 * Обробляє файли та папки через File System Access API
 */

class FileHandler {
    constructor() {
        this.inputFolderHandles = []; // Масив для зберігання кількох вхідних папок
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
     * Вибір вхідної папки (додає до списку)
     * @returns {Promise<Object>} Об'єкт з handle та додатковою інформацією
     */
    async selectInputFolder() {
        try {
            if (!this.isSupported()) {
                throw new Error('File System Access API не підтримується в цьому браузері');
            }

            const folderHandle = await window.showDirectoryPicker({
                mode: 'read'
            });

            // Формуємо повний опис папки
            const fullPath = folderHandle.name;

            // Перевіряємо чи папка вже додана (за назвою)
            const existingFolder = this.inputFolderHandles.find(handle => 
                handle.name === folderHandle.name
            );
            if (existingFolder) {
                throw new Error('Ця папка вже додана до списку');
            }

            // Зберігаємо об'єкт з додатковою інформацією
            const folderData = {
                handle: folderHandle,
                name: folderHandle.name,
                path: fullPath,
                addedAt: new Date().toISOString()
            };

            this.inputFolderHandles.push(folderData);

            return folderData;
        } catch (error) {
            if (error.name === 'AbortError') {
                return null;
            }
            throw error;
        }
    }

    /**
     * Видаляє папку зі списку вхідних папок
     * @param {string} folderName - Назва папки для видалення
     */
    removeInputFolder(folderName) {
        const index = this.inputFolderHandles.findIndex(folderData => folderData.name === folderName);
        if (index > -1) {
            this.inputFolderHandles.splice(index, 1);
        }
    }

    /**
     * Очищає всі вхідні папки
     */
    clearInputFolders() {
        this.inputFolderHandles = [];
    }

    /**
     * Отримує список вхідних папок
     * @returns {Array} Масив handle папок
     */
    getInputFolders() {
        return [...this.inputFolderHandles];
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

            return this.outputFolderHandle;
        } catch (error) {
            if (error.name === 'AbortError') {
                return null;
            }
            throw error;
        }
    }

    /**
     * Отримує інформацію про вихідну папку (спрощена версія)
     * @param {FileSystemDirectoryHandle} folderHandle - Handle папки
     * @returns {Promise<Object>} Інформація про папку
     */
    async getOutputFolderInfo(folderHandle) {
        try {
            // Для вихідної папки ми просто показуємо назву папки
            // Реальну інформацію про диск браузер не може отримати з міркувань безпеки
            return {
                name: folderHandle.name,
                message: 'Папка готова для сортування'
            };
        } catch (error) {
            console.warn('Не вдалося отримати інформацію про папку:', error);
            return {
                name: folderHandle.name,
                message: 'Папка готова для сортування'
            };
        }
    }

    /**
     * Отримує інформацію про папку (для вхідних папок)
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
     * @param {Set} processedFiles - Множина вже оброблених файлів (для уникнення дублювання)
     * @param {boolean} handleDuplicates - Чи обробляти дублікати
     * @returns {Promise<Array>} Масив об'єктів {file, handle, parentHandle}
     */
    async getImageFiles(folderHandle, parentHandle = null, processedFiles = new Set(), handleDuplicates = true) {
        const files = [];
        
        try {
            for await (const [name, handle] of folderHandle.entries()) {
                if (handle.kind === 'file') {
                    const extension = name.split('.').pop().toLowerCase();
                    if (this.supportedFormats.includes(extension)) {
                        try {
                            const file = await handle.getFile();
                            
                            // Перевіряємо чи є файл дублікатом (тільки якщо увімкнено обробку дублікатів)
                            if (handleDuplicates && this.isDuplicateFile(file, name, processedFiles)) {
                                continue;
                            }
                            
                            // Додаємо файл до множини оброблених
                            const fileId = `${file.size}_${file.lastModified}`;
                            processedFiles.add(fileId);
                            
                            files.push({ file, handle, parentHandle: folderHandle });
                        } catch (error) {
                            // Продовжуємо обробку інших файлів
                        }
                    }
                } else if (handle.kind === 'directory') {
                    // Рекурсивно обробляємо підпапки
                    const subFiles = await this.getImageFiles(handle, folderHandle, processedFiles, handleDuplicates);
                    files.push(...subFiles);
                }
            }
        } catch (error) {
            // Продовжуємо обробку
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
     * Перевіряє чи є файл дублікатом
     * @param {File} file - Файл для перевірки
     * @param {string} filename - Назва файлу
     * @param {Set} processedFiles - Множина оброблених файлів
     * @returns {boolean} Чи є файл дублікатом
     */
    isDuplicateFile(file, filename, processedFiles) {
        // Основний критерій: розмір + дата модифікації
        const fileId = `${file.size}_${file.lastModified}`;
        
        if (processedFiles.has(fileId)) {
            return true;
        }
        
        // Додаткова перевірка: схожі назви файлів
        const baseName = filename.replace(/\s+\d+$/, '').toLowerCase(); // Видаляємо " 2", " 3" тощо
        
        for (const processedId of processedFiles) {
            const [size, timestamp] = processedId.split('_');
            if (size === file.size.toString() && timestamp === file.lastModified.toString()) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Отримує базову назву файлу без номерів дублікатів
     * @param {string} filename - Повна назва файлу
     * @returns {string} Базова назва
     */
    getBaseFileName(filename) {
        // Видаляємо пробіл + число в кінці (наприклад: " 2", " 3")
        return filename.replace(/\s+\d+$/, '').toLowerCase();
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
     * Форматує датні параметри для логування
     * @param {Object} exifData - EXIF дані
     * @param {File} file - Файл
     * @returns {string} Відформатовані датні параметри
     */
    formatDateInfo(exifData, file) {
        const dateInfo = [];
        
        // Дата зйомки (DateTimeOriginal)
        if (exifData.dateTaken) {
            dateInfo.push(`Дата зйомки - ${exifData.dateTaken}`);
        } else {
            dateInfo.push('Дата зйомки - не знайдено');
        }
        
        // DateTime
        if (exifData.dateTime) {
            dateInfo.push(`DateTime - ${exifData.dateTime}`);
        } else {
            dateInfo.push('DateTime - не знайдено');
        }
        
        // DateTimeDigitized
        if (exifData.dateDigitized) {
            dateInfo.push(`DateTimeDigitized - ${exifData.dateDigitized}`);
        } else {
            dateInfo.push('DateTimeDigitized - не знайдено');
        }
        
        // GPS дати
        if (exifData.gpsDateStamp) {
            dateInfo.push(`GPSDateStamp - ${exifData.gpsDateStamp}`);
        } else {
            dateInfo.push('GPSDateStamp - не знайдено');
        }
        
        if (exifData.gpsTimeStamp) {
            dateInfo.push(`GPSTimeStamp - ${exifData.gpsTimeStamp}`);
        } else {
            dateInfo.push('GPSTimeStamp - не знайдено');
        }
        
        // Дата модифікації файлу
        const fileDate = new Date(file.lastModified);
        const formattedFileDate = fileDate.toISOString().replace('T', ' ').substring(0, 19);
        dateInfo.push(`Дата модифікації файлу - ${formattedFileDate}`);
        
        return dateInfo.join(' | ');
    }

    /**
     * Форматує тільки ту дату, по якій файл був відсортований
     * @param {Object} exifData - EXIF дані
     * @param {File} file - Файл
     * @returns {string} Відформатована дата сортування
     */
    formatSortingDateInfo(exifData, file) {
        const dateInfo = [];
        
        // Знаходимо найранішу дату (як в getFileMetadata)
        const dates = [];
        
        // Дата зйомки (DateTimeOriginal)
        if (exifData.dateTaken) {
            const dateTaken = new Date(exifData.dateTaken);
            if (!isNaN(dateTaken.getTime())) {
                dates.push(dateTaken);
            }
        }
        
        // DateTime
        if (exifData.dateTime) {
            const dateTime = new Date(exifData.dateTime);
            if (!isNaN(dateTime.getTime())) {
                dates.push(dateTime);
            }
        }
        
        // DateTimeDigitized
        if (exifData.dateDigitized) {
            const dateDigitized = new Date(exifData.dateDigitized);
            if (!isNaN(dateDigitized.getTime())) {
                dates.push(dateDigitized);
            }
        }
        
        // GPS дати
        if (exifData.gpsDateStamp && exifData.gpsTimeStamp) {
            const gpsDate = new Date(`${exifData.gpsDateStamp}T${exifData.gpsTimeStamp}`);
            if (!isNaN(gpsDate.getTime())) {
                dates.push(gpsDate);
            }
        }
        
        // Дата модифікації файлу (як fallback)
        const fileDate = new Date(file.lastModified);
        dates.push(fileDate);
        
        // Знаходимо найранішу дату
        const earliestDate = dates.reduce((earliest, current) => {
            return current < earliest ? current : earliest;
        });
        
        // Форматуємо дату
        const formattedDate = earliestDate.toISOString().replace('T', ' ').substring(0, 19);
        
        // Визначаємо тип дати
        let dateType = 'Дата модифікації файлу';
        if (exifData.dateTaken && new Date(exifData.dateTaken).getTime() === earliestDate.getTime()) {
            dateType = 'Дата зйомки';
        } else if (exifData.dateTime && new Date(exifData.dateTime).getTime() === earliestDate.getTime()) {
            dateType = 'DateTime';
        } else if (exifData.dateDigitized && new Date(exifData.dateDigitized).getTime() === earliestDate.getTime()) {
            dateType = 'DateTimeDigitized';
        } else if (exifData.gpsDateStamp && exifData.gpsTimeStamp && 
                   new Date(`${exifData.gpsDateStamp}T${exifData.gpsTimeStamp}`).getTime() === earliestDate.getTime()) {
            dateType = 'GPS дата';
        }
        
        return `${dateType} - ${formattedDate}`;
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
                // Обмежуємо розмір даних для WASM (тільки перші 32KB для EXIF парсингу)
                const maxSize = 32 * 1024; // 32KB (зменшено для стабільності)
                const dataToProcess = uint8Array.length > maxSize ? uint8Array.slice(0, maxSize) : uint8Array;
                
                try {
                    const readerPtr = window.wasmLoader.createExifReader(dataToProcess);
                    
                    if (readerPtr && readerPtr !== 0) {
                        const exifData = {
                            dateTaken: window.wasmLoader.readExifDate(readerPtr),
                            dateTime: window.wasmLoader.readExifDateTime(readerPtr),
                            dateDigitized: window.wasmLoader.readExifDateTimeDigitized(readerPtr),
                            gpsDateStamp: window.wasmLoader.readExifGpsDateStamp(readerPtr),
                            gpsTimeStamp: window.wasmLoader.readExifGpsTimeStamp(readerPtr),
                            cameraMake: window.wasmLoader.readCameraMake(readerPtr),
                            cameraModel: window.wasmLoader.readCameraModel(readerPtr),
                            width: window.wasmLoader.readImageWidth(readerPtr),
                            height: window.wasmLoader.readImageHeight(readerPtr),
                            hasExif: window.wasmLoader.hasExifData(readerPtr)
                        };
                        
                        window.wasmLoader.destroyExifReader(readerPtr);
                        return exifData;
                    }
                } catch (wasmError) {
                    // Продовжуємо з fallback даними
                }
            }
            
            // Fallback: повертаємо базові дані
            return {
                dateTaken: '',
                dateTime: '',
                dateDigitized: '',
                gpsDateStamp: '',
                gpsTimeStamp: '',
                cameraMake: '',
                cameraModel: '',
                width: 0,
                height: 0,
                hasExif: false
            };
        } catch (error) {
            return {
                dateTaken: '',
                dateTime: '',
                dateDigitized: '',
                gpsDateStamp: '',
                gpsTimeStamp: '',
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
                
                try {
                    // Обмежуємо розмір даних для WASM (тільки перші 32KB для стабільності)
                    const maxSize = 32 * 1024; // 32KB
                    const dataToProcess = uint8Array.length > maxSize ? uint8Array.slice(0, maxSize) : uint8Array;
                    
                    window.wasmLoader.processPhoto(
                        file.name,
                        dataToProcess,
                        exifData.dateTaken,
                        new Date(file.lastModified).toISOString().split('T')[0],
                        exifData.cameraMake,
                        exifData.cameraModel,
                        '', // location
                        file.size,
                        exifData.width,
                        exifData.height
                    );
                } catch (wasmError) {
                    // Продовжуємо обробку без WASM
                }
            }

            this.processedFiles++;
            
            return {
                success: true,
                filename: file.name,
                size: file.size,
                exifData: exifData,
                dateInfo: this.formatSortingDateInfo(exifData, file)
            };
        } catch (error) {
            this.errors++;
            
            return {
                success: false,
                filename: file.name,
                error: error.message
            };
        }
    }

    /**
     * Обробляє всі файли в папках
     * @param {Object} options - Опції обробки
     * @param {Function} progressCallback - Callback для прогресу
     * @returns {Promise<Object>} Результат обробки
     */
    async processAllFiles(options = {}, progressCallback = null) {
        console.log('[DEBUG] processAllFiles викликано з:', { options, hasCallback: !!progressCallback });
        
        if (this.inputFolderHandles.length === 0) {
            throw new Error('Вхідні папки не вибрані');
        }

        if (!this.outputFolderHandle) {
            throw new Error('Вихідна папка не вибрана');
        }

        this.isProcessing = true;
        this.processedFiles = 0;
        this.errors = 0;
        this.skipped = 0;

        try {
            const processedFiles = new Set();
            const handleDuplicates = options.handleDuplicates !== undefined ? options.handleDuplicates : true;
            const allFiles = [];

            console.log('[DEBUG] Збираємо файли з вхідних папок...');
            // Збираємо файли з усіх вхідних папок
            for (const folderData of this.inputFolderHandles) {
                console.log('[DEBUG] Обробляємо папку:', folderData.name);
                const files = await this.getImageFiles(folderData.handle, null, processedFiles, handleDuplicates);
                allFiles.push(...files);
                console.log('[DEBUG] Знайдено файлів у папці:', files.length);
            }

            this.totalFiles = allFiles.length;
            console.log('[DEBUG] Загальна кількість файлів:', this.totalFiles);

            if (allFiles.length === 0) {
                throw new Error('В папках не знайдено зображень');
            }
            
            // Перевіряємо чи є дублікати
            const hasSameOutputFolder = this.inputFolderHandles.some(folderData => folderData.handle === this.outputFolderHandle);
            
            console.log('[DEBUG] Починаємо обробку файлів...');
            // Обробляємо файли по одному
            for (let i = 0; i < allFiles.length; i++) {
                if (!this.isProcessing) {
                    console.log('[DEBUG] Обробка скасована користувачем');
                    break; // Скасовано користувачем
                }

                const fileObj = allFiles[i];
                const file = fileObj.file;
                const fileHandle = fileObj.handle;
                const parentHandle = fileObj.parentHandle;
                
                console.log(`[DEBUG] Обробляємо файл ${i + 1}/${allFiles.length}:`, file.name);
                
                // Обробляємо файл через WASM
                const result = await this.processFile(file, options);
                console.log('[DEBUG] Результат обробки файлу:', result);

                // Копіюємо або переміщуємо файл
                await this.copyOrMoveFile(file, options.processingMode || 'copy', fileHandle, parentHandle, options, result.exifData);

                // Викликаємо callback прогресу
                if (progressCallback) {
                    const progressData = {
                        current: i + 1,
                        total: allFiles.length,
                        processed: this.processedFiles,
                        errors: this.errors,
                        skipped: this.skipped,
                        currentFile: file.name,
                        result: result
                    };
                    console.log('[DEBUG] Викликаємо callback прогресу з даними:', progressData);
                    progressCallback(progressData);
                } else {
                    console.log('[DEBUG] Callback прогресу не передано');
                }

                // Невелика затримка для UI
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            const finalResult = {
                success: true,
                total: allFiles.length,
                processed: this.processedFiles,
                errors: this.errors,
                skipped: this.skipped
            };
            
            console.log('[DEBUG] Обробка завершена з результатом:', finalResult);
            return finalResult;
        } catch (error) {
            console.error('[DEBUG] Помилка в processAllFiles:', error);
            throw error;
        } finally {
            this.isProcessing = false;
            console.log('[DEBUG] processAllFiles завершено, isProcessing = false');
        }
    }

    /**
     * Копіює або переміщує файл у відповідну папку
     * @param {File} file - Файл для обробки
     * @param {string} mode - Режим: 'copy' або 'move'
     * @param {FileSystemFileHandle} originalFileHandle - Handle оригінального файлу (для переміщення)
     * @param {FileSystemDirectoryHandle} parentHandle - Handle батьківської папки оригінального файлу
     * @param {Object} options - Опції обробки
     * @param {Object} exifData - EXIF дані файлу
     */
    async copyOrMoveFile(file, mode = 'copy', originalFileHandle = null, parentHandle = null, options = {}, exifData = {}) {
        try {
            // Отримуємо метадані з найранішою датою
            const metadata = this.getFileMetadata(file, exifData);
            
            // Створюємо структуру папок
            const createSubfolders = options.createSubfolders !== undefined ? options.createSubfolders : true;
            const folderFormat = options.folderFormat || 'monthNames';
            const currentLanguage = options.language || 'uk';
            const folderPath = this.createFolderStructure(metadata, createSubfolders, folderFormat, currentLanguage);
            
            
            // Створюємо папки
            const targetFolderHandle = await this.createFolders(folderPath);
            
            // Копіюємо або переміщуємо файл
            if (mode === 'copy') {
                await this.copyFileToFolder(file, targetFolderHandle);
            } else {
                await this.moveFileToFolder(file, targetFolderHandle, originalFileHandle, parentHandle);
            }
            
            this.processedFiles++;
            
        } catch (error) {
            this.errors++;
        }
    }

    /**
     * Отримує метадані файлу з WASM
     * @param {File} file - Файл
     * @param {Object} exifData - EXIF дані
     * @returns {Object} Метадані
     */
    getFileMetadata(file, exifData = {}) {
        // Збираємо всі можливі дати
        const dates = [];
        
        // Дата зйомки (DateTimeOriginal)
        if (exifData.dateTaken) {
            const dateTaken = new Date(exifData.dateTaken);
            if (!isNaN(dateTaken.getTime())) {
                dates.push(dateTaken);
            }
        }
        
        // DateTime
        if (exifData.dateTime) {
            const dateTime = new Date(exifData.dateTime);
            if (!isNaN(dateTime.getTime())) {
                dates.push(dateTime);
            }
        }
        
        // DateTimeDigitized
        if (exifData.dateDigitized) {
            const dateDigitized = new Date(exifData.dateDigitized);
            if (!isNaN(dateDigitized.getTime())) {
                dates.push(dateDigitized);
            }
        }
        
        // GPS дати
        if (exifData.gpsDateStamp && exifData.gpsTimeStamp) {
            const gpsDate = new Date(`${exifData.gpsDateStamp}T${exifData.gpsTimeStamp}`);
            if (!isNaN(gpsDate.getTime())) {
                dates.push(gpsDate);
            }
        }
        
        // Дата модифікації файлу (як fallback)
        const fileDate = new Date(file.lastModified);
        dates.push(fileDate);
        
        // Знаходимо найранішу дату
        const earliestDate = dates.reduce((earliest, current) => {
            return current < earliest ? current : earliest;
        });
        
        const year = earliestDate.getFullYear();
        const month = String(earliestDate.getMonth() + 1).padStart(2, '0');
        const day = String(earliestDate.getDate()).padStart(2, '0');
        
        return {
            dateTaken: `${year}-${month}-${day}`,
            earliestDate: earliestDate,
            cameraMake: exifData.cameraMake || '',
            cameraModel: exifData.cameraModel || '',
            fileSize: file.size,
            format: file.name.split('.').pop().toLowerCase()
        };
    }

    /**
     * Створює структуру папок для файлу
     * @param {Object} metadata - Метадані файлу
     * @param {boolean} createSubfolders - Чи створювати підпапки за днями
     * @param {string} folderFormat - Формат назв папок ('monthNames' або 'numbers')
     * @param {string} currentLanguage - Поточна мова інтерфейсу
     * @returns {string} Шлях до папки
     */
    createFolderStructure(metadata, createSubfolders = true, folderFormat = 'monthNames', currentLanguage = 'uk') {
        const basePath = this.outputFolderHandle.name;
        
        if (!metadata.dateTaken) {
            const noDateFolder = this.getNoDateFolderName(folderFormat, currentLanguage);
            return `${basePath}/${noDateFolder}`;
        }
        
        const [year, month, day] = metadata.dateTaken.split('-');
        
        // Отримуємо назву місяця відповідно до формату та мови
        const monthName = this.getMonthName(month, folderFormat, currentLanguage);
        
        // Різні рівні деталізації
        if (createSubfolders) {
            // Максимальна деталізація: Рік/Місяць/День
            return `${basePath}/${year}/${monthName}/${day}`;
        } else {
            // Менша деталізація: Рік/Місяць
            return `${basePath}/${year}/${monthName}`;
        }
    }

    /**
     * Отримує назву місяця відповідно до формату та поточної мови
     * @param {string} month - Номер місяця (01-12)
     * @param {string} folderFormat - Формат назв папок ('monthNames' або 'numbers')
     * @param {string} currentLanguage - Поточна мова інтерфейсу
     * @returns {string} Назва місяця
     */
    getMonthName(month, folderFormat, currentLanguage = 'uk') {
        if (folderFormat === 'numbers') {
            return month;
        }
        
        // Для 'monthNames' використовуємо назви відповідно до поточної мови
        const monthNames = this.getMonthNamesForLanguage(currentLanguage);
        return monthNames[month] || month;
    }

    /**
     * Отримує назви місяців для конкретної мови
     * @param {string} language - Код мови
     * @returns {Object} Об'єкт з назвами місяців
     */
    getMonthNamesForLanguage(language) {
        const monthNamesByLanguage = {
            'uk': {
                '01': '01_січень', '02': '02_лютий', '03': '03_березень',
                '04': '04_квітень', '05': '05_травень', '06': '06_червень',
                '07': '07_липень', '08': '08_серпень', '09': '09_вересень',
                '10': '10_жовтень', '11': '11_листопад', '12': '12_грудень'
            },
            'en': {
                '01': '01_january', '02': '02_february', '03': '03_march',
                '04': '04_april', '05': '05_may', '06': '06_june',
                '07': '07_july', '08': '08_august', '09': '09_september',
                '10': '10_october', '11': '11_november', '12': '12_december'
            },
            'ru': {
                '01': '01_январь', '02': '02_февраль', '03': '03_март',
                '04': '04_апрель', '05': '05_май', '06': '06_июнь',
                '07': '07_июль', '08': '08_август', '09': '09_сентябрь',
                '10': '10_октябрь', '11': '11_ноябрь', '12': '12_декабрь'
            },
            'de': {
                '01': '01_januar', '02': '02_februar', '03': '03_märz',
                '04': '04_april', '05': '05_mai', '06': '06_juni',
                '07': '07_juli', '08': '08_august', '09': '09_september',
                '10': '10_oktober', '11': '11_november', '12': '12_dezember'
            },
            'es': {
                '01': '01_enero', '02': '02_febrero', '03': '03_marzo',
                '04': '04_abril', '05': '05_mayo', '06': '06_junio',
                '07': '07_julio', '08': '08_agosto', '09': '09_septiembre',
                '10': '10_octubre', '11': '11_noviembre', '12': '12_diciembre'
            },
            'fr': {
                '01': '01_janvier', '02': '02_février', '03': '03_mars',
                '04': '04_avril', '05': '05_mai', '06': '06_juin',
                '07': '07_juillet', '08': '08_août', '09': '09_septembre',
                '10': '10_octobre', '11': '11_novembre', '12': '12_décembre'
            },
            'zh': {
                '01': '01_一月', '02': '02_二月', '03': '03_三月',
                '04': '04_四月', '05': '05_五月', '06': '06_六月',
                '07': '07_七月', '08': '08_八月', '09': '09_九月',
                '10': '10_十月', '11': '11_十一月', '12': '12_十二月'
            },
            'ja': {
                '01': '01_一月', '02': '02_二月', '03': '03_三月',
                '04': '04_四月', '05': '05_五月', '06': '06_六月',
                '07': '07_七月', '08': '08_八月', '09': '09_九月',
                '10': '10_十月', '11': '11_十一月', '12': '12_十二月'
            },
            'ko': {
                '01': '01_일월', '02': '02_이월', '03': '03_삼월',
                '04': '04_사월', '05': '05_오월', '06': '06_유월',
                '07': '07_칠월', '08': '08_팔월', '09': '09_구월',
                '10': '10_시월', '11': '11_십일월', '12': '12_십이월'
            },
            'ar': {
                '01': '01_يناير', '02': '02_فبراير', '03': '03_مارس',
                '04': '04_أبريل', '05': '05_مايو', '06': '06_يونيو',
                '07': '07_يوليو', '08': '08_أغسطس', '09': '09_سبتمبر',
                '10': '10_أكتوبر', '11': '11_نوفمبر', '12': '12_ديسمبر'
            },
            'hi': {
                '01': '01_जनवरी', '02': '02_फरवरी', '03': '03_मार्च',
                '04': '04_अप्रैल', '05': '05_मई', '06': '06_जून',
                '07': '07_जुलाई', '08': '08_अगस्त', '09': '09_सितंबर',
                '10': '10_अक्टूबर', '11': '11_नवंबर', '12': '12_दिसंबर'
            },
            'it': {
                '01': '01_gennaio', '02': '02_febbraio', '03': '03_marzo',
                '04': '04_aprile', '05': '05_maggio', '06': '06_giugno',
                '07': '07_luglio', '08': '08_agosto', '09': '09_settembre',
                '10': '10_ottobre', '11': '11_novembre', '12': '12_dicembre'
            },
            'nl': {
                '01': '01_januari', '02': '02_februari', '03': '03_maart',
                '04': '04_april', '05': '05_mei', '06': '06_juni',
                '07': '07_juli', '08': '08_augustus', '09': '09_september',
                '10': '10_oktober', '11': '11_november', '12': '12_december'
            },
            'sv': {
                '01': '01_januari', '02': '02_februari', '03': '03_mars',
                '04': '04_april', '05': '05_maj', '06': '06_juni',
                '07': '07_juli', '08': '08_augusti', '09': '09_september',
                '10': '10_oktober', '11': '11_november', '12': '12_december'
            },
            'pl': {
                '01': '01_styczeń', '02': '02_luty', '03': '03_marzec',
                '04': '04_kwiecień', '05': '05_maj', '06': '06_czerwiec',
                '07': '07_lipiec', '08': '08_sierpień', '09': '09_wrzesień',
                '10': '10_październik', '11': '11_listopad', '12': '12_grudzień'
            },
            'pt': {
                '01': '01_janeiro', '02': '02_fevereiro', '03': '03_março',
                '04': '04_abril', '05': '05_maio', '06': '06_junho',
                '07': '07_julho', '08': '08_agosto', '09': '09_setembro',
                '10': '10_outubro', '11': '11_novembro', '12': '12_dezembro'
            }
        };
        
        // Fallback до англійської мови якщо мова не знайдена
        return monthNamesByLanguage[language] || monthNamesByLanguage['en'];
    }

    /**
     * Отримує назву папки для файлів без дати
     * @param {string} folderFormat - Формат назв папок
     * @param {string} currentLanguage - Поточна мова інтерфейсу
     * @returns {string} Назва папки
     */
    getNoDateFolderName(folderFormat, currentLanguage = 'uk') {
        if (folderFormat === 'numbers') {
            return '00_no_date';
        }
        
        // Для 'monthNames' використовуємо назву відповідно до поточної мови
        const noDateNames = {
            'uk': 'Без дати',
            'en': 'No Date',
            'ru': 'Без даты',
            'de': 'Kein Datum',
            'es': 'Sin Fecha',
            'fr': 'Sans Date',
            'zh': '无日期',
            'ja': '日付なし',
            'ko': '날짜 없음',
            'ar': 'بدون تاريخ',
            'hi': 'कोई तारीख नहीं',
            'it': 'Nessuna Data',
            'nl': 'Geen Datum',
            'sv': 'Inget Datum',
            'pl': 'Bez Daty',
            'pt': 'Sem Data'
        };
        
        return noDateNames[currentLanguage] || noDateNames['en'];
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
                    } else {
                        throw error;
                    }
                }
            }
            
            return currentHandle;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Копіює файл у папку
     * @param {File} file - Файл для копіювання
     * @param {FileSystemDirectoryHandle} targetFolderHandle - Handle папки призначення
     */
    async copyFileToFolder(file, targetFolderHandle) {
        // Перевіряємо чи файл взагалі читабельний
        if (file.size === 0) {
            throw new Error(`Оригінальний файл ${file.name} має розмір 0 байт!`);
        }
        

        try {
            // Створюємо новий файл у цільовій папці
            const fileName = file.name;
            
            const newFileHandle = await targetFolderHandle.getFileHandle(fileName, { create: true });
            
            const writable = await newFileHandle.createWritable();
            
            // Для місткості з мобільними пристроями використовуємо Blob замість Uint8Array
            await writable.write(file);
            
            // Переконуємося, що дані записані повністю
            await writable.close();
            
            // ВАЖЛИВО: Отримуємо новий handle після записи для Android Chrome
            const finalFileHandle = await targetFolderHandle.getFileHandle(fileName);
            
            // Перевіряємо розмір записаного файлу
            const writtenFile = await finalFileHandle.getFile();
            
            if (writtenFile.size === 0) {
                throw new Error('Файл записався з розміром 0 байт');
            }
            
        } catch (error) {
            // Спеціальна обробка InvalidStateError для Android Chrome
            if (error.name === 'InvalidStateError') {
                // Використовуємо особливий підхід
            }
            
            // Якщо записи Blob не працює, пробуємо через ArrayBuffer
            try {
                const arrayBuffer = await file.arrayBuffer();
                
                // Видаляємо старий файл з неправильним state на Android Chrome
                try {
                    await targetFolderHandle.removeEntry(file.name);
                } catch (removeError) {
                    // Не можу видалити файл
                }
                
                const newFileHandle = await targetFolderHandle.getFileHandle(file.name, { create: true });
                const writable = await newFileHandle.createWritable();
                
                // Записуємо по чанках для мобільних пристроїв
                await this.writeInChunks(writable, arrayBuffer);
                await writable.close();
                
                // Отримуємо новий handle після close() для Android
                const finalFileHandle = await targetFolderHandle.getFileHandle(file.name);
                const writtenFile = await finalFileHandle.getFile();
                
                if (writtenFile.size === 0) {
                    throw new Error('Fallback метод також дає 0 байт');
                }
                
            } catch (fallbackError) {
                // Спробуємо останній варіант - пряма передача buffer
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    
                    // Видаляємо старий файл перед останньою спробою
                    try {
                        await targetFolderHandle.removeEntry(file.name);
                    } catch (removeError) {
                        // Не можу видалити файл
                    }
                    
                    const newFileHandle = await targetFolderHandle.getFileHandle(file.name, { create: true });
                    const writable = await newFileHandle.createWritable();
                    
                    // Пишемо передавая буфер напряму
                    await writable.write(arrayBuffer);
                    await writable.close();
                    
                    // Отримати новий handle після close() для Android
                    const finalFileHandle = await targetFolderHandle.getFileHandle(file.name);
                    const writtenFile = await finalFileHandle.getFile();
                    
                    if (writtenFile.size === 0) {
                        throw new Error('Навіть пряма передача buffer не працює');
                    }
                    
                } catch (lastTryError) {
                    throw new Error(`Всі методи запису не працюють: ${lastTryError.message}`);
                }
            }
        }
    }
    
    /**
     * Записує дані по чанках для кращої сумісності з мобільними пристроями
     * @param {FileSystemWritableFileTransform} writable - Writable поток
     * @param {ArrayBuffer} arrayBuffer - Дані для запису
     */
    async writeInChunks(writable, arrayBuffer) {
        const chunkSize = 256 * 1024; // 256KB чанки (менше для Android)
        const uint8Array = new Uint8Array(arrayBuffer);
        
        const totalChunks = Math.ceil(uint8Array.length/chunkSize);
        
        for (let offset = 0; offset < uint8Array.length; offset += chunkSize) {
            const chunk = uint8Array.slice(offset, offset + chunkSize);
            const chunkNumber = Math.floor(offset/chunkSize) + 1;
            
            await writable.write({
                type: 'write',
                data: chunk
            });
            
            // Пауза між чанками для Android стабільності
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    /**
     * Додає файл до черги для скачування на Android Chrome
     * @param {File} file - Файл для скачування
     */
    addFileToDownloadQueue(file) {
        this.downloadQueue.push({
            file: file,
            fileName: file.name,
            fileSize: file.size,
            downloadURL: null
        });
    }

    /**
     * Обробляє всю чергу скачувань для Android Chrome
     */
    async processDownloadQueue() {
        if (this.downloadQueue.length === 0) {
            return;
        }

        try {
            // Створюємо ZIP архів з усіма файлами якщо їх багато
            if (this.downloadQueue.length > 3) {
                await this.createAndDownloadZipArchive();
            } else {
                // Якщо файлів мало - скачуємо по одному
                await this.downloadFilesIndividually();
            }
        } catch (error) {
            this.showUserMessage(`Помилка скачування файлів: ${error.message}`);
        }
    }

    /**
     * Створює ZIP архів і скачує його
     */
    async createAndDownloadZipArchive() {
        // Використовуємо JSZip якщо доступний, якщо ні - скачуємо окремо
        if (typeof JSZip !== 'undefined') {
            // TODO: Реалізувати ZIP створення якщо потрібно
            await this.downloadFilesIndividually();
        } else {
            await this.downloadFilesIndividually();
        }
    }

    /**
     * Скачує файли по одному
     */
    async downloadFilesIndividually() {
        for (let i = 0; i < this.downloadQueue.length; i++) {
            const item = this.downloadQueue[i];
            
            try {
                // Створюємо URL для файлу
                const fileURL = URL.createObjectURL(item.file);
                
                // Створюємо прихований якорний елемент для скачування
                const downloadLink = document.createElement('a');
                downloadLink.href = fileURL;
                downloadLink.download = item.fileName;
                downloadLink.style.display = 'none';
                
                // Додаємо до DOM та клікаємо
                document.body.appendChild(downloadLink);
                downloadLink.click();
                
                // Видаляємо з DOM та очищуємо URL
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(fileURL);
                
                // Невелика пауза між скачуваннями
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                // Продовжуємо з наступним файлом
            }
        }
        
        // Показуємо повідомлення користувачу
        this.showAndroidDownloadComplete();
        
        // Очищуємо чергу
        this.downloadQueue = [];
    }

    /**
     * Показує повідомлення про завершення скачування на Android
     */
    showAndroidDownloadComplete() {
        const count = this.downloadQueue.length;
        const message = `📥 ${count} файлів завантажено у папку Downloads на вашому пристрої. 
        
Організуйте файли вручну:
• Відкрийте папку Downloads  
• Створіть папку з датою (наприклад: "2024-07-03")
• Перемістіть зображення в цю папку
        
Дякуємо за використання програми! 📱`;

        this.showUserMessage(message);
    }

    /**
     * Обхід проблем з Android Chrome через showSaveFilePicker
     * @param {File} file - Файл для копіювання
     * @param {FileSystemDirectoryHandle} targetFolderHandle - Handle папки призначення
     */
    async androidChromeWorkaround(file, targetFolderHandle) {
        try {
            // Спробуємо використати showSaveFilePicker замість createWritable
            if ('showSaveFilePicker' in window) {
                
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: file.name,
                    types: [{
                        description: 'JPEG зображення',
                        accept: {
                            'image/jpeg': ['.jpg', '.jpeg']
                        }
                    }]
                });
                
                const writable = await fileHandle.createWritable();
                await writable.write(file);
                await writable.close();
                
                this.showUserMessage(`✅ Файл ${file.name} збережено успішно!`);
                return;
            }
            
            // Fallback: показуємо інструкції користувачу
            
            const fileURL = URL.createObjectURL(file);
            const downloadLink = document.createElement('a');
            downloadLink.href = fileURL;
            downloadLink.download = file.name;
            downloadLink.style.display = 'none';
            
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(fileURL);
            
            this.showUserMessage(`Проблема з Android Chrome. Файл ${file.name} завантажується. Будь ласка, збережіть його в потрібну папку вручну.`);
            
        } catch (error) {
            // Останній fallback - просто повідомляємо про проблему
            this.showUserMessage(`Помилка Android Chrome: ${file.name}. Спробуйте інший браузер або збережіть файли вручну.`);
        }
    }

    /**
     * Показує повідомлення користувачу
     * @param {string} message - Повідомлення
     */
    showUserMessage(message) {
        // Створюємо модальне вікно для повідомлення
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 0.5rem;
                max-width: 90%;
                text-align: center;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            ">
                <h3 style="margin: 0 0 1rem 0; color: #333;">📱 Android Chrome</h3>
                <p style="margin: 0 0 1.5rem 0; color: #666; line-height: 1.5;">${message}</p>
                <button onclick="this.closest('div').parentNode.remove()" style="
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.25rem;
                    cursor: pointer;
                    font-size: 1rem;
                ">Зрозуміло</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Автоматично видаляємо через 10 секунд
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 10000);
    }

    /**
     * Переміщує файл у папку
     * @param {File} file - Файл для переміщення
     * @param {FileSystemDirectoryHandle} targetFolderHandle - Handle папки призначення
     * @param {FileSystemFileHandle} originalFileHandle - Handle оригінального файлу (для видалення)
     * @param {FileSystemDirectoryHandle} parentHandle - Handle батьківської папки оригінального файлу
     */
    async moveFileToFolder(file, targetFolderHandle, originalFileHandle = null, parentHandle = null) {
        try {
            // Спочатку копіюємо
            await this.copyFileToFolder(file, targetFolderHandle);
            
            // Потім видаляємо оригінальний файл (якщо є handle)
            if (originalFileHandle && parentHandle) {
                try {
                    // Видаляємо оригінальний файл
                    await parentHandle.removeEntry(originalFileHandle.name);
                } catch (deleteError) {
                    // Не вдалося видалити оригінальний файл
                }
            } else {
                // Переміщення: немає доступу до оригінального файлу для видалення
            }
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Скасовує обробку
     */
    cancelProcessing() {
        console.log('[DEBUG] FileHandler: скасування обробки');
        this.isProcessing = false;
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

    /**
     * Перевіряє чи розмір файлу валідний
     * @param {Object} file - Файл для перевірки
     * @returns {boolean} Чи валідний розмір
     */
    isFileSizeValid(file) {
        return file.size <= this.maxFileSize;
    }

    /**
     * Оновлює статистику обробки
     * @param {string} type - Тип статистики (processed, error, skipped)
     */
    updateStats(type) {
        switch (type) {
            case 'processed':
                this.processedFiles++;
                break;
            case 'error':
                this.errors++;
                break;
            case 'skipped':
                this.skipped++;
                break;
        }
    }

    /**
     * Скидає статистику обробки
     */
    resetStats() {
        this.processedFiles = 0;
        this.totalFiles = 0;
        this.errors = 0;
        this.skipped = 0;
    }

    /**
     * Валідує файл
     * @param {Object} file - Файл для валідації
     * @returns {boolean} Чи валідний файл
     */
    validateFile(file) {
        if (!file || !file.name) return false;
        return this.isImageFile(file.name) && this.isFileSizeValid(file);
    }

    /**
     * Читає дані файлу
     * @param {File} file - Файл для читання
     * @returns {Promise<ArrayBuffer>} Дані файлу
     */
    async readFileData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Помилка читання файлу'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Логує помилку
     * @param {string} message - Повідомлення про помилку
     * @param {Error} error - Об'єкт помилки
     */
    logError(message, error) {
        console.error(message, error);
    }

    /**
     * Санітизує вхідні дані
     * @param {string} input - Вхідні дані
     * @returns {string} Санітизовані дані
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    }
}

// Створюємо глобальний екземпляр
window.fileHandler = new FileHandler();

// Експортуємо для використання в інших модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileHandler;
}
