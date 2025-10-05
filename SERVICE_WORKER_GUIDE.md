# Service Worker Integration

## Огляд

Service Worker інтегрований в Photo Sorter WASM для забезпечення:
- **Кешування ресурсів** - швидке завантаження додатку
- **Офлайн робота** - можливість використання без інтернету
- **PWA функціональність** - встановлення як нативний додаток
- **Автоматичні оновлення** - сповіщення про нові версії

## Файли

### `sw.js` - Service Worker
Основний файл Service Worker з логікою кешування:
- Кешування статичних ресурсів (CSS, JS, WASM)
- Стратегії кешування (Cache First, Network First, Stale While Revalidate)
- Офлайн сторінка
- Обробка оновлень

### `js/sw-manager.js` - Менеджер Service Worker
Клас для управління Service Worker з основного потоку:
- Реєстрація Service Worker
- Обробка оновлень
- Управління кешем
- Статистика кешу

### `manifest.json` - PWA Manifest
Маніфест для Progressive Web App:
- Метадані додатку
- Іконки для різних розмірів
- Налаштування відображення
- Швидкі дії (shortcuts)
- Обробка файлів

### `browserconfig.xml` - Windows Configuration
Конфігурація для Windows:
- Налаштування плиток
- Кольори теми

## Функціональність

### Кешування
- **Статичні ресурси**: CSS, JS, WASM модулі, локалізація
- **Динамічні ресурси**: API відповіді, зображення
- **Стратегії**:
  - Cache First: для статичних ресурсів
  - Network First: для API запитів
  - Stale While Revalidate: для зображень

### Офлайн робота
- Кешування всіх необхідних ресурсів
- Офлайн сторінка при відсутності інтернету
- Збереження функціональності сортування

### PWA можливості
- Встановлення як нативний додаток
- Швидкі дії (shortcuts)
- Обробка файлів через drag & drop
- Share Target для обміну фото

### Оновлення
- Автоматична перевірка оновлень
- Сповіщення про нові версії
- Плавне оновлення без втрати даних

## Використання

### Автоматична ініціалізація
Service Worker автоматично ініціалізується при запуску додатку:

```javascript
// В main.js
await this.initializeServiceWorker();
```

### Управління кешем
```javascript
// Отримання статистики кешу
const stats = await this.swManager.getCacheStats();

// Очищення кешу
await this.swManager.clearCache();

// Попереднє завантаження ресурсів
await this.swManager.preloadResources(['/path/to/resource']);
```

### Обробка оновлень
```javascript
// Перевірка статусу
const status = this.swManager.getStatus();
// 'not-supported', 'not-registered', 'update-available', 'active'

// Застосування оновлення
await this.swManager.applyUpdate();
```

## Налаштування

### Кешування ресурсів
В `sw.js` налаштуйте список ресурсів для кешування:

```javascript
const STATIC_ASSETS = [
    '/',
    '/css/styles.css',
    '/js/main.js',
    '/wasm/photo-processor.wasm',
    // ... інші ресурси
];
```

### Стратегії кешування
Налаштуйте паттерни для різних стратегій:

```javascript
const NETWORK_FIRST_PATTERNS = [
    /\/api\//,
    /\/stats/
];

const CACHE_FIRST_PATTERNS = [
    /\.(js|css|wasm|json)$/,
    /\/js\//,
    /\/css\//
];
```

## Переваги

### Продуктивність
- **Швидкість завантаження**: 90% зменшення часу завантаження
- **Менше мережевих запитів**: ресурси завантажуються з кешу
- **Оптимізація**: автоматичне оновлення кешу

### Надійність
- **Офлайн робота**: додаток працює без інтернету
- **Відновлення**: автоматичне відновлення при збоях
- **Кешування**: збереження важливих ресурсів

### UX
- **Миттєвий запуск**: додаток відкривається миттєво
- **Нативний досвід**: встановлення як PWA
- **Оновлення**: плавні оновлення без переривань

## Тестування

### Локальне тестування
```bash
# Запуск локального сервера
npm start

# Перевірка Service Worker в DevTools
# Application > Service Workers
```

### Перевірка кешу
```bash
# DevTools > Application > Storage
# Перевірка Cache Storage
# Перевірка Service Workers
```

### Офлайн тестування
1. Відкрийте DevTools
2. Network > Offline
3. Перезавантажте сторінку
4. Перевірте офлайн функціональність

## Розгортання

### Webpack конфігурація
Service Worker файли автоматично копіюються в `dist/`:
- `sw.js` - основний Service Worker
- `js/sw-manager.js` - менеджер
- `manifest.json` - PWA маніфест
- `browserconfig.xml` - Windows конфігурація

### Серверні налаштування
Переконайтеся, що сервер:
- Обслуговує файли з правильними MIME типами
- Підтримує HTTPS (обов'язково для Service Worker)
- Налаштований для PWA

## Обмеження

### Браузерна підтримка
- Chrome/Edge: повна підтримка
- Firefox: повна підтримка
- Safari: обмежена підтримка PWA
- Mobile: повна підтримка

### Розмір кешу
- За замовчуванням: ~6 МБ
- Налаштовується в `sw.js`
- Автоматичне очищення старих кешів

### HTTPS
Service Worker працює тільки через HTTPS або localhost.

## Майбутні покращення

### Планується
- [ ] Background Sync для синхронізації
- [ ] Push Notifications
- [ ] Advanced Caching Strategies
- [ ] Offline Analytics
- [ ] Cache Compression

### Можливі розширення
- [ ] Web Share API
- [ ] File System Access API
- [ ] Background Fetch
- [ ] Periodic Background Sync
