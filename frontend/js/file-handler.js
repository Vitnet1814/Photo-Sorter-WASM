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
                            console.log(`📄 Прочитано файл ${name}: ${file.size} байт, тип: ${file.type}`);
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
                // Обмежуємо розмір даних для WASM (тільки перші 64KB для EXIF парсингу)
                const maxSize = 64 * 1024; // 64KB
                const dataToProcess = uint8Array.length > maxSize ? uint8Array.slice(0, maxSize) : uint8Array;
                
                const readerPtr = window.wasmLoader.createExifReader(dataToProcess);
                
                if (readerPtr) {
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
            console.error('Помилка читання EXIF даних:', error);
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
                console.log(`🔬 WASM обробка файлу ${file.name} з розміром ${file.size} байт`);
                
                // Обмежуємо розмір даних для WASM (тільки перші 64KB)
                const maxSize = 64 * 1024; // 64KB
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
                console.log(`✅ WASM обробка завершена для ${file.name}`);
            } else {
                console.log(`⚠️ WASM модуль не завантажений для ${file.name}`);
            }

            this.processedFiles++;
            
            return {
                success: true,
                filename: file.name,
                size: file.size,
                exifData: exifData,
                dateInfo: this.formatDateInfo(exifData, file)
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
            
            
            // Обробляємо файли по одному
            for (let i = 0; i < files.length; i++) {
                if (!this.isProcessing) {
                    break; // Скасовано користувачем
                }

                const fileObj = files[i];
                const file = fileObj.file;
                const fileHandle = fileObj.handle;
                const parentHandle = fileObj.parentHandle;
                
                // Обробляємо файл через WASM
                const result = await this.processFile(file, options);
                
                console.log(`📋 Результат обробки файлу ${file.name}:`, result);
                console.log(`📊 Розмір файлу до копіювання: ${file.size} байт`);

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
        // Використовуємо тільки дату модифікації файлу для створення структури папок
        const date = new Date(file.lastModified);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return {
            dateTaken: `${year}-${month}-${day}`,
            cameraMake: '',
            cameraModel: '',
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
        console.log(`🔍 ДЕТАЛЬНИЙ DEBUG: Початок копіювання ${file.name}`);
        console.log(`📊 Розмір оригінального файлу: ${file.size} байт`);
        console.log(`📱 User Agent: ${navigator.userAgent}`);
        console.log(`📁 Тип файлу: ${file.type}`);
        console.log(`📅 Дата модифікації: ${file.lastModified}`);
        
        // Перевіряємо чи файл взагалі читабельний
        if (file.size === 0) {
            throw new Error(`Оригінальний файл ${file.name} має розмір 0 байт!`);
        }
        

        try {
            // Створюємо новий файл у цільовій папці
            const fileName = file.name;
            console.log(`📁 Створюємо файл: ${fileName} в папці: ${targetFolderHandle.name}`);
            
            const newFileHandle = await targetFolderHandle.getFileHandle(fileName, { create: true });
            console.log(`✅ Файл handle створено для: ${fileName}`);
            
            const writable = await newFileHandle.createWritable();
            console.log(`✅ Writable stream створено`);
            
            // Для місткості з мобільними пристроями використовуємо Blob замість Uint8Array
            console.log(`📝 Записуємо Blob з розміром: ${file.size} байт`);
            await writable.write(file);
            console.log(`✅ Blob записано`);
            
            // Переконуємося, що дані записані повністю
            await writable.close();
            console.log(`✅ Writable stream closed`);
            
            // ВАЖЛИВО: Отримуємо новий handle після записи для Android Chrome
            const finalFileHandle = await targetFolderHandle.getFileHandle(fileName);
            
            // Перевіряємо розмір записаного файлу
            const writtenFile = await finalFileHandle.getFile();
            console.log(`📏 Перевірка розміру записаного файлу: ${writtenFile.size} байт`);
            
            if (writtenFile.size === 0) {
                console.error(`❌ КРИТИЧНА ПОМИЛКА: Записаний файл має розмір 0 байт!`);
                throw new Error('Файл записався з розміром 0 байт');
            }
            
            console.log(`✅ УСПІШНО записано файл: ${fileName} (${writtenFile.size} байт)`);
            
        } catch (error) {
            console.error('❌ Помилка копіювання файлу:', error);
            console.error(`❌ Деталі помилки: name="${error.name}", message="${error.message}"`);
            
            // Спеціальна обробка InvalidStateError для Android Chrome
            if (error.name === 'InvalidStateError') {
                console.log(`🤖 Виявлено Android Chrome InvalidStateError - використовуємо особливий підхід`);
            }
            
            // Якщо записи Blob не працює, пробуємо через ArrayBuffer
            try {
                console.log(`🔄 ПОЧАТОК FALLBACK методу для ${file.name}`);
                
                const arrayBuffer = await file.arrayBuffer();
                console.log(`📊 ArrayBuffer розмір: ${arrayBuffer.byteLength} байт`);
                
                // Видаляємо старий файл з неправильним state на Android Chrome
                try {
                    await targetFolderHandle.removeEntry(file.name);
                    console.log(`🗑️ Видалено старий файл перед fallback`);
                } catch (removeError) {
                    console.log(`⚠️ Не можу видалити файл: ${removeError.message}`);
                }
                
                const newFileHandle = await targetFolderHandle.getFileHandle(file.name, { create: true });
                const writable = await newFileHandle.createWritable();
                
                // Записуємо по чанках для мобільних пристроїв
                console.log(`📝 Записуємо через chunks метод...`);
                await this.writeInChunks(writable, arrayBuffer);
                await writable.close();
                
                // Отримуємо новий handle після close() для Android
                const finalFileHandle = await targetFolderHandle.getFileHandle(file.name);
                const writtenFile = await finalFileHandle.getFile();
                console.log(`📏 FALLBACK перевірка розміру: ${writtenFile.size} байт`);
                
                if (writtenFile.size === 0) {
                    console.error(`❌ FALLBACK ТАКОЖ ПРОЙШОВ: Файл все ще 0 байт!`);
                    throw new Error('Fallback метод також дає 0 байт');
                }
                
                console.log(`✅ FALLBACK УСПІШНО: ${file.name} (${writtenFile.size} байт)`);
                
            } catch (fallbackError) {
                console.error('❌ FALLBACK ПОВНІСТЮ ПРОВАЛИВСЯ:', fallbackError);
                
                // Спробуємо останній варіант - пряма передача buffer
                try {
                    console.log(`🔄 ОСТАННЯ СПРОБА пряма передача буфера для ${file.name}`);
                    
                    const arrayBuffer = await file.arrayBuffer();
                    
                    // Видаляємо старий файл перед останньою спробою
                    try {
                        await targetFolderHandle.removeEntry(file.name);
                        console.log(`🗑️ Видалено файл перед останньою спробою`);
                    } catch (removeError) {
                        console.log(`⚠️ Не можу видалити файл: ${removeError.message}`);
                    }
                    
                    const newFileHandle = await targetFolderHandle.getFileHandle(file.name, { create: true });
                    const writable = await newFileHandle.createWritable();
                    
                    // Пишемо передавая буфер напряму
                    await writable.write(arrayBuffer);
                    await writable.close();
                    
                    // Отримати новий handle після close() для Android
                    const finalFileHandle = await targetFolderHandle.getFileHandle(file.name);
                    const writtenFile = await finalFileHandle.getFile();
                    console.log(`📏 ОСТАННЯ СПРОБА розмір: ${writtenFile.size} байт`);
                    
                    if (writtenFile.size === 0) {
                        throw new Error('Навіть пряма передача buffer не працює');
                    }
                    
                    console.log(`✅ ОСТАННЯ СПРОБА УСПІШНА!`);
                    
                } catch (lastTryError) {
                    console.error('❌ ВСІ СПРОБИ ПРОВАЛИЛИСЯ!');
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
        
        console.log(`🔄 Запис по чанках: ${uint8Array.length} байт, розмір chunk: ${chunkSize}`);
        
        const totalChunks = Math.ceil(uint8Array.length/chunkSize);
        
        for (let offset = 0; offset < uint8Array.length; offset += chunkSize) {
            const chunk = uint8Array.slice(offset, offset + chunkSize);
            const chunkNumber = Math.floor(offset/chunkSize) + 1;
            
            console.log(`📦 Записуємо chunk ${chunkNumber}/${totalChunks} (${chunk.length} байт)`);
            
            await writable.write({
                type: 'write',
                data: chunk
            });
            
            // Пауза між чанками для Android стабільності
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        console.log(`✅ Всі chunks записані успішно`);
    }

    /**
     * Додає файл до черги для скачування на Android Chrome
     * @param {File} file - Файл для скачування
     */
    addFileToDownloadQueue(file) {
        console.log(`📥 Додано файл до черги: ${file.name} (${file.size} байт)`);
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
            console.log(`📥 Черга скачувань порожня`);
            return;
        }

        console.log(`📥 Обробляємо чергу скачувань: ${this.downloadQueue.length} файлів`);

        try {
            // Створюємо ZIP архів з усіма файлами якщо їх багато
            if (this.downloadQueue.length > 3) {
                await this.createAndDownloadZipArchive();
            } else {
                // Якщо файлів мало - скачуємо по одному
                await this.downloadFilesIndividually();
            }
        } catch (error) {
            console.error(`❌ Помилка обробки черги скачувань:`, error);
            this.showUserMessage(`Помилка скачування файлів: ${error.message}`);
        }
    }

    /**
     * Створює ZIP архів і скачує його
     */
    async createAndDownloadZipArchive() {
        console.log(`📦 Створюємо ZIP архів з ${this.downloadQueue.length} файлів`);
        
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
        console.log(`📥 Скачування ${this.downloadQueue.length} файлів по одному`);
    
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
                
                console.log(`✅ Завантажено: ${item.fileName}`);
                
                // Невелика пауза між скачуваннями
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`❌ Помилка скачування ${item.fileName}:`, error);
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
        console.log(`📱 ANDROID WORKAROUND для файлу: ${file.name}`);
        
        try {
            // Спробуємо використати showSaveFilePicker замість createWritable
            if ('showSaveFilePicker' in window) {
                console.log(`🎯 Використовуємо showSaveFilePicker для ${file.name}`);
                
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
                
                console.log(`✅ УСПІШНО збережено через showSaveFilePicker: ${file.name}`);
                this.showUserMessage(`✅ Файл ${file.name} збережено успішно!`);
                return;
            }
            
            // Fallback: показуємо інструкції користувачу
            console.log(`📥 Fallback: запропонуємо користувачу завантажити файл`);
            
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
            console.error(`❌ Android workaround не працює:`, error);
            
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
