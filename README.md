# Photo Sorter WASM

🚀 **Потужний веб-додаток для автоматичного сортування фотографій з використанням WebAssembly**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![WebAssembly](https://img.shields.io/badge/WebAssembly-1.0-blue.svg)](https://webassembly.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3.3-green.svg)](https://flask.palletsprojects.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org/)

## ✨ Особливості

- 🚀 **Швидка обробка** завдяки WebAssembly (C++)
- 📁 **Розумне сортування** за датою, розміром, типом камери
- 🌍 **Підтримка геолокації** з EXIF даних
- 💰 **Модель монетизації** (безкоштовна/преміум)
- 🎨 **Сучасний інтерфейс** з адаптивним дизайном
- 📊 **Детальна статистика** та звіти
- 🔒 **Повна приватність** - обробка локально в браузері
- 🌐 **Підтримка багатьох форматів** включаючи RAW

## 🏗️ Архітектура

```
Photo-sorter-wasm/
├── backend/                 # Flask API сервер
│   ├── app.py              # Головний додаток
│   ├── models.py           # Моделі бази даних
│   ├── config.py           # Конфігурація
│   └── requirements.txt    # Python залежності
├── frontend/               # Веб-інтерфейс
│   ├── index.html          # Головна сторінка
│   ├── css/                # Стилі
│   │   └── styles.css      # Основні стилі
│   ├── js/                 # JavaScript код
│   │   ├── main.js         # Головний додаток
│   │   ├── wasm-loader.js  # Завантажувач WASM
│   │   └── file-handler.js # Обробка файлів
│   └── wasm/               # WebAssembly модулі
│       ├── photo-processor.wasm
│       └── photo-processor.js
├── wasm-source/            # Вихідний код WASM (C++)
│   ├── src/
│   │   ├── main.cpp        # Основний модуль
│   │   └── exif-reader.cpp # EXIF читач
│   └── build.sh            # Скрипт компіляції
├── docker/                 # Docker конфігурація
│   ├── nginx.conf          # Nginx налаштування
│   └── supervisord.conf    # Supervisor конфігурація
├── docker-compose.yml      # Docker Compose
├── Dockerfile              # Docker образ
└── README.md               # Документація
```

## 🚀 Швидкий старт

### 1. Клонування репозиторію
```bash
git clone https://github.com/your-username/photo-sorter-wasm.git
cd photo-sorter-wasm
```

### 2. Компіляція WebAssembly модуля
```bash
cd wasm-source
chmod +x build.sh
./build.sh
```

### 3. Встановлення backend залежностей
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Запуск сервера
```bash
python app.py
```

### 5. Відкриття додатку
Відкрийте браузер та перейдіть на `http://localhost:5000`

## 📋 Вимоги

### Системні вимоги
- **ОС**: Windows 10+, macOS 10.14+, Linux Ubuntu 18.04+
- **Браузер**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **RAM**: 4 GB (рекомендовано 8 GB+)
- **Диск**: 2 GB вільного місця

### Для розробки
- **Python**: 3.11+
- **Emscripten SDK**: 3.1.44+
- **Node.js**: 16+ (опціонально)
- **Docker**: 20+ (опціонально)

## 🎯 Використання

### Основні функції

1. **Вибір папок**
   - Вхідна папка з невідсортованими фото
   - Вихідна папка для відсортованих фото

2. **Налаштування обробки**
   - Режим: копіювання або переміщення
   - Критерій сортування: дата, розмір, камера
   - Додаткові опції: підпапки, дублікати

3. **Запуск обробки**
   - Відстеження прогресу в реальному часі
   - Детальний лог обробки
   - Статистика результатів

### Структура результатів

```
Вихідна папка/
├── 2024/
│   ├── 01_січень/
│   │   ├── 01/
│   │   ├── 02/
│   │   └── ...
│   ├── 02_лютий/
│   └── ...
├── 2023/
└── Без дати/
    ├── Великі файли/
    └── Помилки/
```

## 📁 Підтримувані формати

### Зображення
- **JPEG/JPG** - Найпоширеніший формат
- **PNG** - Прозорість та висока якість
- **TIFF/TIF** - Професійний формат
- **HEIC** - Формат Apple
- **WebP** - Сучасний веб-формат
- **BMP** - Бітова карта
- **GIF** - Анімовані зображення

### RAW формати
- **CR2** - Canon
- **NEF** - Nikon
- **ARW** - Sony
- **DNG** - Adobe Digital Negative

## 💰 Монетизація

### Безкоштовна версія
- ✅ До 1000 фото на сесію
- ✅ Базове сортування за датою
- ✅ Створення структури папок
- ❌ Реклама в інтерфейсі
- ❌ Обмежена підтримка

### Преміум версія ($5/місяць)
- ✅ Безліміт фото на сесію
- ✅ Розширені опції сортування
- ✅ Геолокація та метадані
- ✅ Пріоритетна підтримка
- ✅ Без реклами
- ✅ Детальна статистика
- ✅ Експорт звітів

## 🐳 Docker

### Швидкий запуск
```bash
docker-compose up -d
```

### З моніторингом
```bash
docker-compose --profile monitoring up -d
```

### З логуванням
```bash
docker-compose --profile logging up -d
```

## 🔧 API

### Основні endpoints

- `GET /api/health` - Перевірка стану сервера
- `POST /api/register` - Реєстрація користувача
- `POST /api/login` - Вхід користувача
- `GET /api/profile` - Профіль користувача
- `POST /api/usage` - Логування використання
- `POST /api/subscription/create` - Створення підписки
- `GET /api/statistics` - Статистика користувача

Детальна документація API: [API.md](API.md)

## 📚 Документація

- [Встановлення](INSTALLATION.md) - Детальна інструкція з встановлення
- [Використання](USAGE.md) - Посібник користувача
- [API](API.md) - Документація API
- [FAQ](FAQ.md) - Часті питання

## 🧪 Тестування

### Запуск тестів
```bash
cd backend
python -m pytest tests/
```

### Тестування WASM модуля
```bash
cd frontend
python -m http.server 8000
# Відкрийте http://localhost:8000/wasm/test.html
```

## 🚀 Розгортання

### Production з Docker
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Ручне розгортання
```bash
# Встановлення на Ubuntu
sudo apt update && sudo apt install python3 python3-pip nginx postgresql redis
# Детальні інструкції в INSTALLATION.md
```

## 🔒 Безпека

- **Локальна обробка** - всі фото обробляються в браузері
- **Шифрування** - всі з'єднання захищені HTTPS
- **JWT токени** - безпечна аутентифікація
- **GDPR відповідність** - повна приватність даних

## 🤝 Внесок у проект

1. Fork репозиторію
2. Створіть feature branch (`git checkout -b feature/amazing-feature`)
3. Commit зміни (`git commit -m 'Add amazing feature'`)
4. Push до branch (`git push origin feature/amazing-feature`)
5. Відкрийте Pull Request

## 📄 Ліцензія

Цей проект ліцензовано під MIT License - дивіться [LICENSE](LICENSE) файл для деталей.

## 👥 Автори

- **Команда Photo Sorter WASM** - [GitHub](https://github.com/your-username/photo-sorter-wasm)

## 🙏 Подяки

- [Emscripten](https://emscripten.org/) - за WebAssembly компілятор
- [Flask](https://flask.palletsprojects.com/) - за веб-фреймворк
- [Stripe](https://stripe.com/) - за платіжну систему
- [Font Awesome](https://fontawesome.com/) - за іконки

## 📞 Підтримка

- **Email**: support@photo-sorter-wasm.com
- **GitHub Issues**: [Створити issue](https://github.com/your-username/photo-sorter-wasm/issues)
- **Документація**: [docs.photo-sorter-wasm.com](https://docs.photo-sorter-wasm.com)

## 🗺️ Roadmap

- [ ] Підтримка відео файлів
- [ ] Хмарна синхронізація
- [ ] Мобільний додаток
- [ ] AI-розпізнавання об'єктів
- [ ] Автоматичне тегування
- [ ] Інтеграція з соціальними мережами

---

⭐ **Якщо вам подобається цей проект, поставте зірочку на GitHub!**
