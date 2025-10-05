/**
 * Service Worker Diagnostics
 * Діагностика помилок Service Worker
 */

class ServiceWorkerDiagnostics {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Запускає повну діагностику
     */
    async runDiagnostics() {
        console.log('🔍 Запуск діагностики Service Worker...');
        
        // Очищуємо кеш браузера для маніфесту
        await this.clearManifestCache();
        
        this.checkBrowserSupport();
        await this.checkServiceWorkerRegistration();
        await this.checkCacheStorage();
        await this.checkManifest();
        this.checkConsoleErrors();
        
        this.displayResults();
    }

    /**
     * Очищує кеш маніфесту
     */
    async clearManifestCache() {
        try {
            // Очищуємо кеш маніфесту
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                for (const cacheName of cacheNames) {
                    if (cacheName.includes('manifest')) {
                        await caches.delete(cacheName);
                    }
                }
            }
        } catch (error) {
            console.log('[SW Diagnostics] Помилка очищення кешу маніфесту:', error);
        }
    }

    /**
     * Перевіряє підтримку браузера
     */
    checkBrowserSupport() {
        const checks = {
            'Service Worker': 'serviceWorker' in navigator,
            'Cache API': 'caches' in window,
            'Fetch API': 'fetch' in window,
            'Promise': typeof Promise !== 'undefined',
            'Async/Await': this.checkAsyncAwaitSupport()
        };

        console.log('📋 Підтримка браузера:');
        Object.entries(checks).forEach(([feature, supported]) => {
            const status = supported ? '✅' : '❌';
            console.log(`  ${status} ${feature}`);
            
            if (!supported) {
                this.errors.push(`Браузер не підтримує: ${feature}`);
            }
        });
    }

    /**
     * Перевіряє підтримку async/await
     */
    checkAsyncAwaitSupport() {
        try {
            eval('(async () => {})()');
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Перевіряє реєстрацію Service Worker
     */
    async checkServiceWorkerRegistration() {
        if (!('serviceWorker' in navigator)) {
            this.errors.push('Service Worker не підтримується браузером');
            return;
        }

        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log(`📝 Зареєстровані Service Workers: ${registrations.length}`);
            
            if (registrations.length === 0) {
                this.warnings.push('Service Worker не зареєстрований');
            } else {
                registrations.forEach((registration, index) => {
                    console.log(`  ${index + 1}. Scope: ${registration.scope}`);
                    console.log(`     Active: ${registration.active ? '✅' : '❌'}`);
                    console.log(`     Installing: ${registration.installing ? '✅' : '❌'}`);
                    console.log(`     Waiting: ${registration.waiting ? '✅' : '❌'}`);
                    
                    // Перевіряємо помилки в Service Worker
                    if (registration.active) {
                        this.checkServiceWorkerErrors(registration.active);
                    }
                    if (registration.installing) {
                        this.checkServiceWorkerErrors(registration.installing);
                    }
                    if (registration.waiting) {
                        this.checkServiceWorkerErrors(registration.waiting);
                    }
                });
            }
        } catch (error) {
            this.errors.push(`Помилка перевірки реєстрації: ${error.message}`);
        }
    }

    /**
     * Перевіряє помилки в Service Worker
     */
    checkServiceWorkerErrors(worker) {
        if (worker.state === 'redundant') {
            this.errors.push(`Service Worker ${worker.scriptURL} став застарілим`);
        }
        
        // Перевіряємо чи є помилки в консолі Service Worker
        worker.addEventListener('error', (event) => {
            this.errors.push(`Service Worker помилка: ${event.message}`);
        });
        
        worker.addEventListener('unhandledrejection', (event) => {
            this.errors.push(`Service Worker необроблена помилка: ${event.reason}`);
        });
    }

    /**
     * Перевіряє Cache Storage
     */
    async checkCacheStorage() {
        if (!('caches' in window)) {
            this.errors.push('Cache API не підтримується');
            return;
        }

        try {
            const cacheNames = await caches.keys();
            console.log(`💾 Кеші: ${cacheNames.length}`);
            
            if (cacheNames.length === 0) {
                this.warnings.push('Кеші не створені');
            } else {
                for (const cacheName of cacheNames) {
                    const cache = await caches.open(cacheName);
                    const keys = await cache.keys();
                    console.log(`  📦 ${cacheName}: ${keys.length} записів`);
                }
            }
        } catch (error) {
            this.errors.push(`Помилка перевірки кешу: ${error.message}`);
        }
    }

    /**
     * Перевіряє маніфест PWA
     */
    async checkManifest() {
        try {
            const manifestLink = document.querySelector('link[rel="manifest"]');
            if (!manifestLink) {
                this.warnings.push('Маніфест PWA не знайдений');
                return;
            }

            const response = await fetch(manifestLink.href);
            if (!response.ok) {
                this.errors.push(`Маніфест недоступний: ${response.status}`);
                return;
            }

            const manifest = await response.json();
            console.log('📱 PWA Маніфест:');
            console.log(`  Назва: ${manifest.name}`);
            console.log(`  Коротка назва: ${manifest.short_name}`);
            console.log(`  Іконки: ${manifest.icons ? manifest.icons.length : 0}`);
            console.log(`  Скріншоти: ${manifest.screenshots ? manifest.screenshots.length : 0}`);
            
            if (!manifest.icons || manifest.icons.length === 0) {
                this.warnings.push('В маніфесті відсутні іконки');
            }
        } catch (error) {
            this.errors.push(`Помилка перевірки маніфесту: ${error.message}`);
        }
    }

    /**
     * Перевіряє помилки в консолі
     */
    checkConsoleErrors() {
        // Перехоплюємо помилки
        const originalError = console.error;
        const originalWarn = console.warn;
        
        console.error = (...args) => {
            const message = args.join(' ');
            // Фільтруємо відомі помилки редиректів
            if (!message.includes('redirected response was used for a request whose redirect mode is not "follow"')) {
                this.errors.push(`Console Error: ${message}`);
            }
            originalError.apply(console, args);
        };
        
        console.warn = (...args) => {
            this.warnings.push(`Console Warning: ${args.join(' ')}`);
            originalWarn.apply(console, args);
        };
    }

    /**
     * Відображає результати діагностики
     */
    displayResults() {
        console.log('\n📊 Результати діагностики:');
        
        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('✅ Всі перевірки пройшли успішно!');
        } else {
            if (this.errors.length > 0) {
                console.log(`❌ Помилки (${this.errors.length}):`);
                this.errors.forEach((error, index) => {
                    console.log(`  ${index + 1}. ${error}`);
                });
            }
            
            if (this.warnings.length > 0) {
                console.log(`⚠️ Попередження (${this.warnings.length}):`);
                this.warnings.forEach((warning, index) => {
                    console.log(`  ${index + 1}. ${warning}`);
                });
            }
        }
    }

    /**
     * Отримує звіт про стан
     */
    getStatusReport() {
        return {
            errors: this.errors,
            warnings: this.warnings,
            hasErrors: this.errors.length > 0,
            hasWarnings: this.warnings.length > 0,
            isHealthy: this.errors.length === 0
        };
    }
}

// Експортуємо для використання
window.ServiceWorkerDiagnostics = ServiceWorkerDiagnostics;

// Автоматично запускаємо діагностику через 3 секунди після завантаження
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const diagnostics = new ServiceWorkerDiagnostics();
        diagnostics.runDiagnostics();
    }, 3000);
});
