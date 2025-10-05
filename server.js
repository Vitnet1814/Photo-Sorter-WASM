const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Обслуговування статичних файлів
app.use(express.static(path.join(__dirname, 'dist')));

// Обслуговування JS файлів з правильними шляхами
app.use('/js', express.static(path.join(__dirname, 'dist/js')));
app.use('/css', express.static(path.join(__dirname, 'dist/css')));
app.use('/wasm', express.static(path.join(__dirname, 'dist/wasm')));

// Редирект з кореневого домену на відповідну мову
app.get('/', (req, res) => {
    // Отримуємо мову з заголовка Accept-Language
    const acceptLanguage = req.headers['accept-language'] || '';
    const supportedLanguages = ['uk', 'en', 'ru', 'zh', 'es', 'pt', 'fr', 'de', 'ar', 'ja', 'ko', 'hi', 'it', 'nl', 'sv', 'pl'];
    
    // Парсимо Accept-Language заголовок
    const languages = acceptLanguage
        .split(',')
        .map(lang => {
            const [code, quality] = lang.trim().split(';q=');
            return {
                code: code.split('-')[0], // Беремо тільки основну мову (uk-UA -> uk)
                quality: quality ? parseFloat(quality) : 1.0
            };
        })
        .sort((a, b) => b.quality - a.quality); // Сортуємо за пріоритетом
    
    // Знаходимо першу підтримувану мову
    let targetLanguage = 'en'; // За замовчуванням англійська
    for (const lang of languages) {
        if (supportedLanguages.includes(lang.code)) {
            targetLanguage = lang.code;
            break;
        }
    }
    
    res.redirect(`/${targetLanguage}/`);
});

// Обробка підкаталогів мов
const supportedLanguages = ['uk', 'en', 'ru', 'zh', 'es', 'pt', 'fr', 'de', 'ar', 'ja', 'ko', 'hi', 'it', 'nl', 'sv', 'pl'];

supportedLanguages.forEach(lang => {
    // Редирект без слеша на слеш
    app.get(`/${lang}`, (req, res) => {
        res.redirect(`/${lang}/`);
    });
    
    // Обслуговування HTML файлів для кожної мови
    app.get(`/${lang}/*`, (req, res) => {
        const filePath = path.join(__dirname, 'dist', lang, 'index.html');
        res.sendFile(filePath);
    });
});

// Healthcheck для Railway
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Fallback для всіх інших запитів
app.get('*', (req, res) => {
    res.redirect('/en/');
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'dist')}`);
    console.log(`🌍 Supported languages: ${supportedLanguages.join(', ')}`);
});
