/**
 * Internationalization (i18n) System
 * Система локалізації для підтримки 16 мов
 */

class I18n {
    constructor() {
        this.currentLanguage = 'en';
        this.fallbackLanguage = 'en';
        this.translations = {};
        this.supportedLanguages = [
            'en', 'zh', 'es', 'pt', 'fr', 'de', 'ru', 'ar',
            'ja', 'ko', 'hi', 'it', 'nl', 'sv', 'pl', 'uk'
        ];
        this.languageNames = {
            'en': 'English',
            'zh': '中文',
            'es': 'Español',
            'pt': 'Português',
            'fr': 'Français',
            'de': 'Deutsch',
            'ru': 'Русский',
            'ar': 'العربية',
            'ja': '日本語',
            'ko': '한국어',
            'hi': 'हिन्दी',
            'it': 'Italiano',
            'nl': 'Nederlands',
            'sv': 'Svenska',
            'pl': 'Polski',
            'uk': 'Українська'
        };
        this.rtlLanguages = ['ar', 'he'];
    }

    /**
     * Ініціалізує систему локалізації
     */
    async init() {
        try {
            // Визначаємо мову користувача
            this.detectLanguage();
            
            // Завантажуємо переклади
            await this.loadTranslations();
            
            // Застосовуємо мову
            this.applyLanguage();
            
            // Мова встановлена успішно
        } catch (error) {
            // Помилка ініціалізації локалізації
            this.currentLanguage = this.fallbackLanguage;
        }
    }

    /**
     * Визначає мову користувача
     */
    detectLanguage() {
        // Спочатку перевіряємо URL
        const pathLang = this.getLanguageFromURL();
        if (pathLang && this.supportedLanguages.includes(pathLang)) {
            this.currentLanguage = pathLang;
            return;
        }

        // Потім збережену мову
        const savedLanguage = localStorage.getItem('photoSorterLanguage');
        if (savedLanguage && this.supportedLanguages.includes(savedLanguage)) {
            this.currentLanguage = savedLanguage;
            return;
        }

        // Визначаємо мову браузера
        const browserLanguages = navigator.languages || [navigator.language];
        
        for (const lang of browserLanguages) {
            // Перевіряємо повну мову (наприклад, en-US)
            const fullLang = lang.toLowerCase();
            if (this.supportedLanguages.includes(fullLang)) {
                this.currentLanguage = fullLang;
                return;
            }
            
            // Перевіряємо основну мову (наприклад, en)
            const baseLang = fullLang.split('-')[0];
            if (this.supportedLanguages.includes(baseLang)) {
                this.currentLanguage = baseLang;
                return;
            }
        }

        // Якщо нічого не знайшли, використовуємо fallback
        this.currentLanguage = this.fallbackLanguage;
    }

    /**
     * Визначає мову з URL
     * @returns {string|null} Код мови або null
     */
    getLanguageFromURL() {
        const path = window.location.pathname;
        const match = path.match(/^\/([a-z]{2})\//);
        return match ? match[1] : null;
    }

    /**
     * Завантажує переклади для поточної мови
     */
    async loadTranslations() {
        try {
            const response = await fetch(`/js/locales/${this.currentLanguage}.json`);
            if (response.ok) {
                this.translations = await response.json();
            } else {
                throw new Error(`Не вдалося завантажити переклади для ${this.currentLanguage}`);
            }
        } catch (error) {
            // Помилка завантаження перекладів
            
            // Fallback до англійської
            if (this.currentLanguage !== this.fallbackLanguage) {
                this.currentLanguage = this.fallbackLanguage;
                const fallbackResponse = await fetch(`/js/locales/${this.fallbackLanguage}.json`);
                if (fallbackResponse.ok) {
                    this.translations = await fallbackResponse.json();
                }
            }
        }
    }

    /**
     * Отримує переклад за ключем
     * @param {string} key - Ключ перекладу
     * @param {Object} params - Параметри для підстановки
     * @returns {string} Переклад
     */
    t(key, params = {}) {
        const keys = key.split('.');
        let translation = this.translations;
        
        for (const k of keys) {
            if (translation && typeof translation === 'object' && k in translation) {
                translation = translation[k];
            } else {
                return key; // Повертаємо ключ як fallback
            }
        }
        
        if (typeof translation !== 'string') {
            return key;
        }
        
        // Підставляємо параметри
        return this.interpolate(translation, params);
    }

    /**
     * Підставляє параметри в переклад
     * @param {string} text - Текст з плейсхолдерами
     * @param {Object} params - Параметри
     * @returns {string} Текст з підставленими параметрами
     */
    interpolate(text, params) {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    /**
     * Змінює мову
     * @param {string} language - Код мови
     */
    async setLanguage(language) {
        if (!this.supportedLanguages.includes(language)) {
            return;
        }

        this.currentLanguage = language;
        localStorage.setItem('photoSorterLanguage', language);
        
        // Редирект на відповідний підкаталог
        const currentPath = window.location.pathname;
        const newPath = currentPath.replace(/^\/[a-z]{2}\//, `/${language}/`);
        
        if (newPath !== currentPath) {
            window.location.href = newPath;
            return;
        }
        
        // Завантажуємо нові переклади
        await this.loadTranslations();
        
        // Застосовуємо мову
        this.applyLanguage();
    }

    /**
     * Застосовує поточну мову до всіх елементів
     */
    applyLanguage() {
        // Оновлюємо атрибут lang
        document.documentElement.lang = this.currentLanguage;
        
        // Оновлюємо напрямок тексту для RTL мов
        const isRTL = this.rtlLanguages.includes(this.currentLanguage);
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        
        // Оновлюємо всі елементи з data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = translation;
            } else if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Оновлюємо title атрибути
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });
        
        // Оновлюємо placeholder атрибути
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });
    }

    /**
     * Отримує список підтримуваних мов
     * @returns {Array} Масив об'єктів {code, name}
     */
    getSupportedLanguages() {
        return this.supportedLanguages.map(code => ({
            code,
            name: this.languageNames[code]
        }));
    }

    /**
     * Отримує поточну мову
     * @returns {string} Код поточної мови
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Отримує поточну мову з URL
     * @returns {string|null} Код мови з URL або null
     */
    getCurrentLanguageFromURL() {
        return this.getLanguageFromURL();
    }

    /**
     * Перевіряє чи є мова RTL
     * @param {string} language - Код мови
     * @returns {boolean} Чи є мова RTL
     */
    isRTL(language = null) {
        const lang = language || this.currentLanguage;
        return this.rtlLanguages.includes(lang);
    }
}

// Створюємо глобальний екземпляр
window.i18n = new I18n();


