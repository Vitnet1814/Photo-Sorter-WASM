/**
 * WebAssembly Loader
 * Завантажує та ініціалізує WASM модуль для обробки фото
 */

class WASMLoader {
    constructor() {
        this.module = null;
        this.isLoaded = false;
        this.isLoading = false;
        this.loadPromise = null;
    }

    /**
     * Завантажує WASM модуль
     * @returns {Promise<Object>} WASM модуль
     */
    async load() {
        if (this.isLoaded) {
            return this.module;
        }

        if (this.isLoading) {
            return this.loadPromise;
        }

        this.isLoading = true;
        this.loadPromise = this._loadModule();

        try {
            this.module = await this.loadPromise;
            this.isLoaded = true;
            this.isLoading = false;
            return this.module;
        } catch (error) {
            this.isLoading = false;
            throw error;
        }
    }

    /**
     * Внутрішня функція завантаження модуля
     * @returns {Promise<Object>} WASM модуль
     */
    async _loadModule() {
        try {
            // Перевіряємо підтримку WebAssembly
            if (!window.WebAssembly) {
                throw new Error('WebAssembly не підтримується в цьому браузері');
            }

            // Завантажуємо модуль
            // Завантажуємо скрипт
            const script = document.createElement('script');
            script.src = '/wasm/photo-processor.js';
            script.type = 'text/javascript';
            
            return new Promise((resolve, reject) => {
                script.onload = () => {
                    try {
                        // Справжній WASM модуль експортується як функція
                        PhotoProcessor().then(module => {
                            resolve(module);
                        }).catch(error => {
                            reject(error);
                        });
                    } catch (error) {
                        reject(error);
                    }
                };
                script.onerror = () => {
                    reject(new Error('Не вдалося завантажити WASM модуль'));
                };
                document.head.appendChild(script);
            });
        } catch (error) {
            throw new Error(`Не вдалося завантажити WASM модуль: ${error.message}`);
        }
    }

    /**
     * Отримує версію модуля
     * @returns {string} Версія модуля
     */
    getVersion() {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }
        return this.module.ccall('getVersion', 'string', [], []);
    }

    /**
     * Обробляє одне фото
     * @param {string} filename - Назва файлу
     * @param {Uint8Array} fileData - Дані файлу
     * @param {string} dateTaken - Дата зйомки
     * @param {string} dateModified - Дата модифікації
     * @param {string} cameraMake - Виробник камери
     * @param {string} cameraModel - Модель камери
     * @param {string} location - Локація
     * @param {number} fileSize - Розмір файлу
     * @param {number} width - Ширина зображення
     * @param {number} height - Висота зображення
     */
    processPhoto(filename, fileData, dateTaken, dateModified, cameraMake, cameraModel, location, fileSize, width, height) {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }

        try {
            // Перевіряємо розмір даних перед передачею в WASM
            if (fileData.length > 32 * 1024) {
                fileData = fileData.slice(0, 32 * 1024);
            }

            this.module.ccall('processPhoto', null, 
                ['string', 'array', 'number', 'string', 'string', 'string', 'string', 'string', 'number', 'number', 'number'],
                [filename, fileData, fileData.length, dateTaken, dateModified, cameraMake, cameraModel, location, fileSize, width, height]
            );
        } catch (error) {
            throw error;
        }
    }

    /**
     * Отримує кількість оброблених фото
     * @returns {number} Кількість фото
     */
    getProcessedCount() {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }
        return this.module.ccall('getProcessedCount', 'number', [], []);
    }

    /**
     * Отримує метадані фото за індексом
     * @param {number} index - Індекс фото
     * @returns {Object} Метадані фото
     */
    getPhotoMetadata(index) {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }

        try {
            const metadataStr = this.module.ccall('getPhotoMetadata', 'string', ['number'], [index]);
            return JSON.parse(metadataStr);
        } catch (error) {
            return null;
        }
    }

    /**
     * Отримує структуру папок для фото
     * @param {number} index - Індекс фото
     * @param {string} basePath - Базовий шлях
     * @returns {string} Шлях до папки
     */
    getFolderStructure(index, basePath) {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }

        try {
            return this.module.ccall('getFolderStructure', 'string', ['number', 'string'], [index, basePath]);
        } catch (error) {
            return basePath + '/Без дати';
        }
    }

    /**
     * Очищає метадані
     */
    clearMetadata() {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }

        try {
            this.module.ccall('clearMetadata', null, [], []);
        } catch (error) {
            // Ігноруємо помилки очищення
        }
    }

    /**
     * Отримує статистику обробки
     * @returns {Object} Статистика
     */
    getStatistics() {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }

        try {
            const statsStr = this.module.ccall('getStatistics', 'string', [], []);
            return JSON.parse(statsStr);
        } catch (error) {
            return {
                total_photos: 0,
                valid_photos: 0,
                with_exif: 0,
                large_files: 0,
                total_size: 0,
                errors: 0
            };
        }
    }

    /**
     * Сортує фото за критеріями
     * @param {number} criteria - Критерій сортування (0-3)
     */
    sortPhotos(criteria) {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }

        try {
            this.module.ccall('sortPhotos', null, ['number'], [criteria]);
        } catch (error) {
            // Ігноруємо помилки сортування
        }
    }

    /**
     * Створює EXIF читач
     * @param {Uint8Array} fileData - Дані файлу
     * @returns {number} Покажчик на EXIF читач
     */
    createExifReader(fileData) {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }

        try {
            // Перевіряємо розмір даних перед передачею в WASM
            if (fileData.length > 32 * 1024) {
                fileData = fileData.slice(0, 32 * 1024);
            }

            return this.module.ccall('createExifReader', 'number', ['array', 'number'], [fileData, fileData.length]);
        } catch (error) {
            return 0;
        }
    }

    /**
     * Знищує EXIF читач
     * @param {number} readerPtr - Покажчик на EXIF читач
     */
    destroyExifReader(readerPtr) {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }

        try {
            this.module.ccall('destroyExifReader', null, ['number'], [readerPtr]);
        } catch (error) {
            // Ігноруємо помилки знищення
        }
    }

    /**
     * Читає дату з EXIF
     * @param {number} readerPtr - Покажчик на EXIF читач
     * @returns {string} Дата зйомки
     */
    readExifDate(readerPtr) {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }

        try {
            return this.module.ccall('readExifDate', 'string', ['number'], [readerPtr]);
        } catch (error) {
            return '';
        }
    }

    /**
     * Читає виробника камери з EXIF
     * @param {number} readerPtr - Покажчик на EXIF читач
     * @returns {string} Виробник камери
     */
    readCameraMake(readerPtr) {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }

        try {
            return this.module.ccall('readCameraMake', 'string', ['number'], [readerPtr]);
        } catch (error) {
            return '';
        }
    }

    /**
     * Читає модель камери з EXIF
     * @param {number} readerPtr - Покажчик на EXIF читач
     * @returns {string} Модель камери
     */
    readCameraModel(readerPtr) {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }

        try {
            return this.module.ccall('readCameraModel', 'string', ['number'], [readerPtr]);
        } catch (error) {
            return '';
        }
    }

    /**
     * Читає ширину зображення з EXIF
     * @param {number} readerPtr - Покажчик на EXIF читач
     * @returns {number} Ширина зображення
     */
    readImageWidth(readerPtr) {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }

        try {
            return this.module.ccall('readImageWidth', 'number', ['number'], [readerPtr]);
        } catch (error) {
            return 0;
        }
    }

    /**
     * Читає висоту зображення з EXIF
     * @param {number} readerPtr - Покажчик на EXIF читач
     * @returns {number} Висота зображення
     */
    readImageHeight(readerPtr) {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }

        try {
            return this.module.ccall('readImageHeight', 'number', ['number'], [readerPtr]);
        } catch (error) {
            return 0;
        }
    }

    /**
     * Перевіряє наявність EXIF даних
     * @param {number} readerPtr - Покажчик на EXIF читач
     * @returns {boolean} Чи є EXIF дані
     */
    hasExifData(readerPtr) {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }

        try {
            return this.module.ccall('hasExifData', 'boolean', ['number'], [readerPtr]);
        } catch (error) {
            return false;
        }
    }

    /**
     * Читає DateTime з EXIF
     * @param {number} readerPtr - Покажчик на EXIF читач
     * @returns {string} DateTime
     */
    readExifDateTime(readerPtr) {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }

        try {
            return this.module.ccall('readExifDateTime', 'string', ['number'], [readerPtr]);
        } catch (error) {
            return '';
        }
    }

    /**
     * Читає DateTimeDigitized з EXIF
     * @param {number} readerPtr - Покажчик на EXIF читач
     * @returns {string} DateTimeDigitized
     */
    readExifDateTimeDigitized(readerPtr) {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }

        try {
            return this.module.ccall('readExifDateTimeDigitized', 'string', ['number'], [readerPtr]);
        } catch (error) {
            return '';
        }
    }

    /**
     * Читає GPSDateStamp з EXIF
     * @param {number} readerPtr - Покажчик на EXIF читач
     * @returns {string} GPSDateStamp
     */
    readExifGpsDateStamp(readerPtr) {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }

        try {
            return this.module.ccall('readExifGpsDateStamp', 'string', ['number'], [readerPtr]);
        } catch (error) {
            return '';
        }
    }

    /**
     * Читає GPSTimeStamp з EXIF
     * @param {number} readerPtr - Покажчик на EXIF читач
     * @returns {string} GPSTimeStamp
     */
    readExifGpsTimeStamp(readerPtr) {
        if (!this.isLoaded) {
            throw new Error('WASM модуль не завантажено');
        }

        try {
            return this.module.ccall('readExifGpsTimeStamp', 'string', ['number'], [readerPtr]);
        } catch (error) {
            return '';
        }
    }

    /**
     * Перевіряє чи завантажено модуль
     * @returns {boolean} Статус завантаження
     */
    isModuleLoaded() {
        return this.isLoaded;
    }

    /**
     * Отримує інформацію про модуль
     * @returns {Object} Інформація про модуль
     */
    getModuleInfo() {
        if (!this.isLoaded) {
            return {
                loaded: false,
                version: null,
                memory: null
            };
        }

        return {
            loaded: true,
            version: this.getVersion(),
            memory: {
                used: this.module.buffer.byteLength,
                total: this.module.buffer.byteLength
            }
        };
    }

    /**
     * Викликає функцію WASM
     * @param {string} functionName - Назва функції
     * @param {Array} args - Аргументи функції
     * @returns {*} Результат функції
     */
    callWasmFunction(functionName, args = []) {
        if (!this.wasmInstance || !this.wasmInstance.exports) {
            throw new Error('WASM модуль не завантажений');
        }

        if (!this.wasmInstance.exports[functionName]) {
            throw new Error(`Функція ${functionName} не знайдена`);
        }

        return this.wasmInstance.exports[functionName](...args);
    }

    /**
     * Перевіряє наявність функції
     * @param {string} functionName - Назва функції
     * @returns {boolean} Чи існує функція
     */
    hasFunction(functionName) {
        return this.wasmInstance && 
               this.wasmInstance.exports && 
               typeof this.wasmInstance.exports[functionName] === 'function';
    }

    /**
     * Виділяє пам'ять
     * @param {number} size - Розмір пам'яті
     * @returns {number} Покажчик на пам'ять
     */
    allocateMemory(size) {
        if (!this.wasmInstance || !this.wasmInstance.exports) {
            throw new Error('WASM модуль не завантажений');
        }

        if (size > 100 * 1024 * 1024) { // 100MB
            throw new Error('Недостатньо пам\'яті');
        }

        return this.wasmInstance.exports.malloc(size);
    }

    /**
     * Звільняє пам'ять
     * @param {number} ptr - Покажчик на пам'ять
     */
    freeMemory(ptr) {
        if (!this.wasmInstance || !this.wasmInstance.exports) {
            throw new Error('WASM модуль не завантажений');
        }

        if (ptr === null || ptr === undefined) {
            throw new Error('Невірний покажчик на пам\'ять');
        }

        this.wasmInstance.exports.free(ptr);
    }

    /**
     * Обробляє зображення
     * @param {ArrayBuffer} imageData - Дані зображення
     * @returns {Promise<ArrayBuffer>} Оброблені дані
     */
    async processImage(imageData) {
        if (!this.wasmInstance || !this.wasmInstance.exports) {
            throw new Error('WASM модуль не завантажений');
        }

        return this.wasmInstance.exports.processImage(imageData);
    }

    /**
     * Отримує інформацію про зображення
     * @returns {Object} Інформація про зображення
     */
    getImageInfo() {
        if (!this.wasmInstance || !this.wasmInstance.exports) {
            throw new Error('WASM модуль не завантажений');
        }

        return this.wasmInstance.exports.getImageInfo();
    }

    /**
     * Санітизує параметри
     * @param {Array} params - Параметри для санітизації
     * @returns {Array} Санітизовані параметри
     */
    sanitizeParams(params) {
        return params.map(param => {
            if (typeof param !== 'string') return param;
            return param
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
        });
    }

    /**
     * Логує повідомлення
     * @param {string} message - Повідомлення
     */
    log(message) {
        console.log('WasmLoader:', message);
    }

    /**
     * Логує помилку
     * @param {string} message - Повідомлення про помилку
     * @param {Error} error - Об'єкт помилки
     */
    logError(message, error) {
        console.error('WasmLoader Error:', message, error);
    }

    /**
     * Отримує діагностичну інформацію
     * @returns {Object} Діагностична інформація
     */
    getDiagnostics() {
        return {
            isLoaded: this.isLoaded,
            isLoading: this.isLoading,
            loadError: this.loadError,
            memoryUsage: this.getMemoryUsage()
        };
    }
}

// Створюємо глобальний екземпляр
window.wasmLoader = new WASMLoader();

// Експортуємо для використання в інших модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WASMLoader;
}
