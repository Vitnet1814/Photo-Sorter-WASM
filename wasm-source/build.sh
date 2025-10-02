#!/bin/bash

# Скрипт для компіляції WebAssembly модуля

echo "🔨 Компіляція WebAssembly модуля для обробки фото..."

# Перевіряємо наявність Emscripten
if ! command -v emcc &> /dev/null; then
    echo "❌ Emscripten не знайдено. Будь ласка, встановіть Emscripten SDK."
    echo "   https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

# Створюємо папку для збірки
mkdir -p ../frontend/wasm

# Компілюємо основний модуль
echo "📦 Компіляція основного модуля..."
emcc src/main.cpp src/exif-reader.cpp \
    -O3 \
    -s WASM=1 \
    -s EXPORTED_FUNCTIONS="[
        '_processPhoto',
        '_getProcessedCount',
        '_getPhotoMetadata',
        '_getFolderStructure',
        '_clearMetadata',
        '_getStatistics',
        '_sortPhotos',
        '_getVersion',
        '_createExifReader',
        '_destroyExifReader',
        '_readExifDate',
        '_readCameraMake',
        '_readCameraModel',
        '_readImageWidth',
        '_readImageHeight',
        '_hasExifData'
    ]" \
    -s EXPORTED_RUNTIME_METHODS="[
        'ccall',
        'cwrap',
        'getValue',
        'setValue',
        'UTF8ToString',
        'stringToUTF8',
        'lengthBytesUTF8'
    ]" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MAXIMUM_MEMORY=256MB \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="PhotoProcessor" \
    -s ENVIRONMENT='web' \
    -s SINGLE_FILE=0 \
    -o ../frontend/wasm/photo-processor.js

# Перевіряємо результат
if [ $? -eq 0 ]; then
    echo "✅ WebAssembly модуль успішно скомпільовано!"
    echo "📁 Файли збережено в: ../frontend/wasm/"
    echo "   - photo-processor.wasm"
    echo "   - photo-processor.js"
    
    # Показуємо розмір файлів
    echo ""
    echo "📊 Розмір файлів:"
    ls -lh ../frontend/wasm/photo-processor.*
    
    # Створюємо простий тестовий файл
    echo ""
    echo "🧪 Створення тестового файлу..."
    cat > ../frontend/wasm/test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>WASM Photo Processor Test</title>
</head>
<body>
    <h1>WebAssembly Photo Processor Test</h1>
    <div id="output"></div>
    
    <script src="photo-processor.js"></script>
    <script>
        PhotoProcessor().then(Module => {
            const output = document.getElementById('output');
            output.innerHTML = '<p>✅ WASM модуль завантажено успішно!</p>';
            output.innerHTML += '<p>Версія: ' + Module.ccall('getVersion', 'string', [], []) + '</p>';
        }).catch(err => {
            document.getElementById('output').innerHTML = '<p>❌ Помилка завантаження: ' + err + '</p>';
        });
    </script>
</body>
</html>
EOF
    
    echo "✅ Тестовий файл створено: ../frontend/wasm/test.html"
    echo ""
    echo "🚀 Для тестування відкрийте test.html в браузері"
    
else
    echo "❌ Помилка компіляції WebAssembly модуля"
    exit 1
fi
