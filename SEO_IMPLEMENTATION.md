# Photo Sorter - Багатомовна SEO-оптимізована версія

## Структура підкаталогів

Проект тепер підтримує підкаталоги для кожної мови:

```
https://photo-sorter-wasm-production.up.railway.app/
├── /uk/     - Українська версія
├── /en/     - Англійська версія (за замовчуванням)
├── /ru/     - Російська версія
├── /zh/     - Китайська версія
├── /es/     - Іспанська версія
├── /pt/     - Португальська версія
├── /fr/     - Французька версія
├── /de/     - Німецька версія
├── /ar/     - Арабська версія
├── /ja/     - Японська версія
├── /ko/     - Корейська версія
├── /hi/     - Гінді версія
├── /it/     - Італійська версія
├── /nl/     - Голландська версія
├── /sv/     - Шведська версія
└── /pl/     - Польська версія
```

## SEO оптимізації

### 1. Hreflang теги
Кожна сторінка містить hreflang теги для всіх мов:
```html
<link rel="alternate" hreflang="uk" href="https://photo-sorter-wasm-production.up.railway.app/uk/">
<link rel="alternate" hreflang="en" href="https://photo-sorter-wasm-production.up.railway.app/en/">
<link rel="alternate" hreflang="x-default" href="https://photo-sorter-wasm-production.up.railway.app/en/">
```

### 2. Локалізовані метатеги
Кожна мова має свої:
- Title та Description
- Keywords
- Open Graph теги
- Twitter Card теги
- Географічні метатеги (geo.region, geo.country)

### 3. Structured Data
JSON-LD структуровані дані з локалізацією:
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Локалізована назва",
  "description": "Локалізований опис",
  "url": "https://photo-sorter-wasm-production.up.railway.app/uk/",
  "inLanguage": "uk"
}
```

## Деплой на Railway

### 1. Автоматичний деплой
Railway автоматично визначить Node.js проект і запустить:
```bash
npm run build
npm run start
```

### 2. Конфігурація Railway
Файл `railway.json` містить:
- Налаштування збірки
- Маршрутизацію для підкаталогів
- Healthcheck налаштування

### 3. Редиректи
- Кореневий домен `/` → `/en/` (англійська за замовчуванням)
- Кожна мова без слеша → з слешем (`/uk` → `/uk/`)

## Локальна розробка

```bash
# Встановлення залежностей
npm install

# Розробка
npm run dev

# Збірка
npm run build

# Тестування збірки
npm run start
```

## Структура файлів після збірки

```
dist/
├── uk/
│   └── index.html
├── en/
│   └── index.html
├── ru/
│   └── index.html
├── ... (інші мови)
├── js/
│   ├── main.[hash].min.js
│   ├── i18n.[hash].min.js
│   └── locales/
│       ├── uk.json
│       ├── en.json
│       └── ...
├── css/
│   └── styles.[hash].min.css
├── wasm/
│   ├── photo-processor.wasm
│   └── photo-processor.js
├── _redirects
├── vercel.json
└── railway.json
```

## Особливості реалізації

### 1. Webpack конфігурація
- Генерує HTML файл для кожної мови
- Використовує EJS шаблони для локалізації метатегів
- Копіює конфігураційні файли для деплою

### 2. JavaScript локалізація
- Автоматично визначає мову з URL
- Підтримує зміну мови з редиректом
- Зберігає вибір мови в localStorage

### 3. SEO оптимізації
- Правильні canonical URLs
- Hreflang для всіх мов
- Географічні сигнали
- Локалізовані structured data

## Переваги цієї реалізації

1. **SEO-дружність** - кожна мова має свій URL
2. **Правильні hreflang** - Google розуміє зв'язки між версіями
3. **Географічна релевантність** - локалізація для різних регіонів
4. **Простота реалізації** - мінімальні зміни в існуючому коді
5. **Зворотна сумісність** - існуючі посилання продовжать працювати
6. **Railway оптимізація** - конфігурація спеціально для Railway
