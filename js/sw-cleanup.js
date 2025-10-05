/**
 * Service Worker Cleanup Script
 * Скрипт для очищення Service Worker та кешу
 */

class ServiceWorkerCleanup {
    /**
     * Повне очищення Service Worker
     */
    static async fullCleanup() {
        console.log('🧹 Початок повного очищення Service Worker...');
        
        try {
            // 1. Очищуємо всі кеші
            await this.clearAllCaches();
            
            // 2. Видаляємо всі Service Worker
            await this.unregisterAllServiceWorkers();
            
            // 3. Очищуємо localStorage та sessionStorage
            this.clearStorage();
            
            console.log('✅ Повне очищення завершено!');
            console.log('🔄 Перезавантажте сторінку для застосування змін');
            
        } catch (error) {
            console.error('❌ Помилка під час очищення:', error);
        }
    }
    
    /**
     * Очищує всі кеші
     */
    static async clearAllCaches() {
        if (!('caches' in window)) {
            console.log('⚠️ Cache API не підтримується');
            return;
        }
        
        try {
            const cacheNames = await caches.keys();
            console.log(`🗑️ Видалення ${cacheNames.length} кешів...`);
            
            await Promise.all(
                cacheNames.map(cacheName => {
                    console.log(`  - Видаляємо кеш: ${cacheName}`);
                    return caches.delete(cacheName);
                })
            );
            
            console.log('✅ Всі кеші очищені');
        } catch (error) {
            console.error('❌ Помилка очищення кешів:', error);
        }
    }
    
    /**
     * Видаляє всі Service Worker
     */
    static async unregisterAllServiceWorkers() {
        if (!('serviceWorker' in navigator)) {
            console.log('⚠️ Service Worker не підтримується');
            return;
        }
        
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log(`🗑️ Видалення ${registrations.length} Service Worker...`);
            
            await Promise.all(
                registrations.map(registration => {
                    console.log(`  - Видаляємо SW: ${registration.scope}`);
                    return registration.unregister();
                })
            );
            
            console.log('✅ Всі Service Worker видалені');
        } catch (error) {
            console.error('❌ Помилка видалення Service Worker:', error);
        }
    }
    
    /**
     * Очищує localStorage та sessionStorage
     */
    static clearStorage() {
        try {
            // Очищуємо localStorage (зберігаємо тільки важливі дані)
            const importantKeys = ['language', 'theme', 'settings'];
            const allKeys = Object.keys(localStorage);
            const keysToRemove = allKeys.filter(key => !importantKeys.includes(key));
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log(`  - Видалено з localStorage: ${key}`);
            });
            
            // Очищуємо sessionStorage
            sessionStorage.clear();
            console.log('✅ SessionStorage очищений');
            
        } catch (error) {
            console.error('❌ Помилка очищення storage:', error);
        }
    }
    
    /**
     * Перевіряє стан після очищення
     */
    static async checkStatus() {
        console.log('🔍 Перевірка стану після очищення...');
        
        // Перевіряємо кеші
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            console.log(`📦 Кеші: ${cacheNames.length}`);
        }
        
        // Перевіряємо Service Worker
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log(`⚙️ Service Worker: ${registrations.length}`);
        }
        
        // Перевіряємо storage
        console.log(`💾 LocalStorage ключі: ${Object.keys(localStorage).length}`);
        console.log(`💾 SessionStorage ключі: ${Object.keys(sessionStorage).length}`);
    }
}

// Експортуємо для використання
window.ServiceWorkerCleanup = ServiceWorkerCleanup;

// Додаємо команди в консоль
console.log(`
🧹 Service Worker Cleanup доступний!

Команди:
- ServiceWorkerCleanup.fullCleanup() - повне очищення
- ServiceWorkerCleanup.clearAllCaches() - очищення кешів
- ServiceWorkerCleanup.unregisterAllServiceWorkers() - видалення SW
- ServiceWorkerCleanup.clearStorage() - очищення storage
- ServiceWorkerCleanup.checkStatus() - перевірка стану

Приклад використання:
ServiceWorkerCleanup.fullCleanup().then(() => {
    ServiceWorkerCleanup.checkStatus();
    location.reload();
});
`);
