# 📸 Photo Filter - WebAssembly Фотопроцесор

**Швидка обробка фотографій безпосередньо у браузері за допомогою WebAssembly**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Vitnet1814/Photo-Sorter-WASM)

## 🎯 Особливості

- ✅ **WebAssembly підтримка** - максимальна швидкість обробки
- ✅ **Локальна обробка** - файли не покидають твій пристрій
- ✅ **Без реєстрації** - відкрив і користуйся
- ✅ **Безкоштовно** - немає обмежень чи платежів
- ✅ **Підтримка всіх форматів** - JPEG, PNG, HEIC тощо
- ✅ **Розширена EXIF інформація** - читання всіх датних параметрів

## 🚀 Демо

Можеш протестувати тут: **[LIVE DEMO](#)** (через Vercel)

## 💻 Технології

### Frontend
- **HTML5** & **CSS3** - современний інтерфейс
- **Vanilla JavaScript** - без залежностей
- **WebAssembly (C++/Emscripten)** - швидка обробка

### WASM Модуль
- **C++** з **Emscripten SDK** компіляція
- **EXIF дані** парсинг та аналіз
- **Метадані** фотографій детектинг
- **Датні параметри** - повне читання всіх датних тегів

## 📅 Підтримувані датні параметри

Програма читає та відображає всі доступні датні параметри з EXIF даних:

### EXIF дати
- **DateTimeOriginal** - оригінальна дата/час знімка
- **DateTime** - дата та час створення фото  
- **DateTimeDigitized** - дата/час оцифрування

### GPS дати
- **GPSDateStamp** - дата GPS координат
- **GPSTimeStamp** - час GPS координат

### Файлові дати
- **Creation Date** - дата створення файлу
- **Modification Date** - дата останньої зміни
- **Access Date** - дата останнього доступу

### Формат логування
```
назва_файлу.jpg (2.5 MB) - Дата зйомки - 2024-01-15 | DateTime - 2024-01-15 14:30:25 | DateTimeDigitized - 2024-01-15 14:30:25 | GPSDateStamp - 2024:01:15 | GPSTimeStamp - 14:30:25 | Дата модифікації файлу - 2024-01-15 14:30:25: успішно
```

## 🏗️ Архітектура

```
Браузер → WASM модуль → Локальна обробка → Результат
```

**Всі операції відбуваються локально - без backend сервера!**

## 📦 Структура проекту

```
photo-filter-wasm/
├── frontend/
│   ├── css/styles.css          # Стилі інтерфейсу
│   ├── index.html              # Головна сторінка
│   ├── js/
│   │   ├── main.js             # Основна логіка
│   │   ├── file-handler.js     # File API взаємодія
│   │   └── wasm-loader.js      # WASM модуль завантаження
│   └── wasm/
│       ├── photo-processor.js  # WASM завантажувач
│       └── photo-processor.wasm # Скомпільований WASM модуль
├── wasm-source/
│   ├── src/
│   │   ├── main.cpp            # Основна C++ логіка
│   │   └── exif-reader.cpp     # EXIF парсер
│   └── build.sh                # Скрипт компіляції WASM
└── README.md
```

## ⚙️ Локальний запуск

### Варіант 1: Python HTTP сервер
```bash
# Клонуй репозиторій
git clone https://github.com/Vitnet1814/Photo-Sorter-WASM.git
cd Photo-Sorter-WASM

# Запуск локального сервера
python -m http.server 8000

# Відкрий http://localhost:8000
```

### Варіант 2: Node.js Static Server
```bash
# Встанови serve глобально
npm install -g serve

# Запуск сервера
serve .

# Відкрий указану URL (зазвичай http://localhost:3000)
```

## 🌍 Деплой на різних платформах

### Vercel (рекомендовано)
```bash
# Встанови Vercel CLI
npm install -g vercel

# В папці проекту
vercel --prod
```

### Netlify
```bash
# Через GitHub або CLI
netlify deploy --dir .
```

### GitHub Pages
```bash
# Settings → Pages → Source: GitHub Actions
# Використай gh-pages workflow
```

## 🔧 Налаштування WebAssembly

Якщо потрібно перекомпувалити WASM модуль:

```bash
# Встанови Emscripten SDK
# https://emscripten.org/docs/getting_started/downloads.html

cd wasm-source/
chmod +x build.sh
./build.sh
```

## 📊 Функціональність

- 🔍 **Аналіз метаданих** - EXIF дані читання
- 📏 **Розміри зображення** - ширина/висота детектинг
- 📷 **Інформація про камеру** - модель, виробник читання
- 📅 **Дати фотографування** - час та дата парсинг
- 🛡️ **Безпека** - всі дані обробляються локально

## 🤝 Співпраця

1. **Fork** репозиторій
2. **Створи** feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** зміни (`git commit -m 'Add AmazingFeature'`)
4. **Push** до branch (`git push origin feature/AmazingFeature`)
5. **Відкрий** Pull Request

## 📜 Ліцензія

Розповсюджується під ліцензією **MIT**. Детальніше в `LICENSE`.

## 🙏 Подяка

- **WebAssembly** команда за технологію
- **Emscripten** за C++ → WASM інструменти
- **Всі користувачі** за тестінги та ідеї

---

**© 2025 Vitnet1814 • Створено з ❤️ в Україні 🇺🇦**