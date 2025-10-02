// Мінімальний WASM модуль для тестування
// Це заглушка для тестування без Emscripten

class PhotoProcessor {
    constructor() {
        this.isLoaded = true;
        this.buffer = new ArrayBuffer(1024 * 1024); // 1MB буфер
    }

    // Симуляція WASM функцій
    ccall(funcName, returnType, argTypes, args) {
        console.log(`WASM call: ${funcName}`, args);
        
        switch (funcName) {
            case 'getVersion':
                return '1.0.0-test';
            
            case 'processPhoto':
                // Симуляція обробки фото
                console.log('Processing photo:', args[0]);
                return null;
            
            case 'getProcessedCount':
                return 0;
            
            case 'getPhotoMetadata':
                return JSON.stringify({
                    filename: 'test.jpg',
                    date_taken: '2024-01-15',
                    date_modified: '2024-01-15',
                    camera_make: 'Test Camera',
                    camera_model: 'Test Model',
                    location: '',
                    file_size: 1024000,
                    width: 1920,
                    height: 1080,
                    format: 'jpg',
                    has_exif: true,
                    is_valid: true
                });
            
            case 'getFolderStructure':
                return args[1] + '/2024/01_січень/15';
            
            case 'clearMetadata':
                return null;
            
            case 'getStatistics':
                return JSON.stringify({
                    total_photos: 0,
                    valid_photos: 0,
                    with_exif: 0,
                    large_files: 0,
                    total_size: 0,
                    errors: 0
                });
            
            case 'sortPhotos':
                return null;
            
            case 'createExifReader':
                return Math.random() * 1000000; // Повертаємо випадковий pointer
            
            case 'destroyExifReader':
                return null;
            
            case 'readExifDate':
                return '2024-01-15';
            
            case 'readCameraMake':
                return 'Test Camera';
            
            case 'readCameraModel':
                return 'Test Model';
            
            case 'readImageWidth':
                return 1920;
            
            case 'readImageHeight':
                return 1080;
            
            case 'hasExifData':
                return true;
            
            default:
                console.warn(`Unknown WASM function: ${funcName}`);
                return null;
        }
    }
}

// Експорт для використання (CommonJS стиль для браузера)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = function() {
        return Promise.resolve(new PhotoProcessor());
    };
} else {
    // Для браузера
    window.PhotoProcessor = function() {
        return Promise.resolve(new PhotoProcessor());
    };
}
