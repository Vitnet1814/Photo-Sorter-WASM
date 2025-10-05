/**
 * Service Worker Registration
 * Реєстрація та управління Service Worker
 */

class ServiceWorkerManager {
    constructor() {
        this.registration = null;
        this.isSupported = 'serviceWorker' in navigator;
        this.updateAvailable = false;
    }

    /**
     * Реєструє Service Worker
     */
    async register() {
        if (!this.isSupported) {
            console.log('[SW Manager] Service Worker не підтримується');
            return false;
        }

        try {
            console.log('[SW Manager] Реєстрація Service Worker...');
            
            this.registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('[SW Manager] Service Worker зареєстрований:', this.registration.scope);

            // Обробка оновлень
            this.registration.addEventListener('updatefound', () => {
                this.handleUpdateFound();
            });

            // Перевіряємо наявність оновлень
            await this.checkForUpdates();

            return true;
        } catch (error) {
            console.error('[SW Manager] Помилка реєстрації Service Worker:', error);
            // Не блокуємо роботу додатку при помилці SW
            return false;
        }
    }

    /**
     * Обробляє знайдені оновлення
     */
    handleUpdateFound() {
        const newWorker = this.registration.installing;
        
        if (!newWorker) return;

        console.log('[SW Manager] Знайдено оновлення Service Worker');

        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                    // Новий Service Worker встановлений, але старий все ще активний
                    this.updateAvailable = true;
                    this.showUpdateNotification();
                } else {
                    // Перший раз встановлюється Service Worker
                    console.log('[SW Manager] Service Worker встановлений вперше');
                }
            }
        });
    }

    /**
     * Показує сповіщення про оновлення
     */
    showUpdateNotification() {
        // Створюємо сповіщення про оновлення
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <div class="update-icon">
                    <i class="fas fa-download"></i>
                </div>
                <div class="update-text">
                    <h4>Доступне оновлення</h4>
                    <p>Нова версія додатку готова до встановлення</p>
                </div>
                <div class="update-actions">
                    <button class="btn btn-primary btn-sm" id="updateBtn">
                        Оновити
                    </button>
                    <button class="btn btn-outline btn-sm" id="dismissUpdateBtn">
                        Пізніше
                    </button>
                </div>
            </div>
        `;

        // Додаємо стилі
        const style = document.createElement('style');
        style.textContent = `
            .update-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .update-content {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .update-icon {
                font-size: 24px;
                opacity: 0.9;
            }
            
            .update-text h4 {
                margin: 0 0 5px 0;
                font-size: 16px;
                font-weight: 600;
            }
            
            .update-text p {
                margin: 0;
                font-size: 14px;
                opacity: 0.9;
            }
            
            .update-actions {
                display: flex;
                gap: 10px;
                margin-left: auto;
            }
            
            .update-actions .btn {
                padding: 8px 16px;
                font-size: 12px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .update-actions .btn-primary {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .update-actions .btn-primary:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            .update-actions .btn-outline {
                background: transparent;
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .update-actions .btn-outline:hover {
                background: rgba(255, 255, 255, 0.1);
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(notification);

        // Обробка кнопок
        document.getElementById('updateBtn').addEventListener('click', () => {
            this.applyUpdate();
            notification.remove();
        });

        document.getElementById('dismissUpdateBtn').addEventListener('click', () => {
            notification.remove();
        });

        // Автоматично приховуємо через 10 секунд
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    /**
     * Застосовує оновлення
     */
    async applyUpdate() {
        if (!this.updateAvailable) return;

        try {
            console.log('[SW Manager] Застосування оновлення...');
            
            // Повідомляємо Service Worker про оновлення
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                if (event.data.type === 'SKIP_WAITING') {
                    // Перезавантажуємо сторінку для активації нового Service Worker
                    window.location.reload();
                }
            };

            if (this.registration.waiting) {
                this.registration.waiting.postMessage(
                    { type: 'SKIP_WAITING' },
                    [messageChannel.port2]
                );
            }
        } catch (error) {
            console.error('[SW Manager] Помилка застосування оновлення:', error);
        }
    }

    /**
     * Перевіряє наявність оновлень
     */
    async checkForUpdates() {
        if (!this.registration) return;

        try {
            await this.registration.update();
        } catch (error) {
            console.error('[SW Manager] Помилка перевірки оновлень:', error);
        }
    }

    /**
     * Отримує інформацію про кеш
     */
    async getCacheInfo() {
        if (!this.registration) return null;

        try {
            const messageChannel = new MessageChannel();
            
            return new Promise((resolve) => {
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data);
                };

                this.registration.active.postMessage(
                    { type: 'GET_CACHE_SIZE' },
                    [messageChannel.port2]
                );
            });
        } catch (error) {
            console.error('[SW Manager] Помилка отримання інформації про кеш:', error);
            return null;
        }
    }

    /**
     * Очищує кеш
     */
    async clearCache() {
        if (!this.registration) return false;

        try {
            const messageChannel = new MessageChannel();
            
            return new Promise((resolve) => {
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data.type === 'CACHE_CLEARED');
                };

                this.registration.active.postMessage(
                    { type: 'CLEAR_CACHE' },
                    [messageChannel.port2]
                );
            });
        } catch (error) {
            console.error('[SW Manager] Помилка очищення кешу:', error);
            return false;
        }
    }

    /**
     * Попередньо завантажує ресурси
     */
    async preloadResources(urls) {
        if (!this.registration) return false;

        try {
            const messageChannel = new MessageChannel();
            
            return new Promise((resolve) => {
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data.type === 'RESOURCES_PRELOADED');
                };

                this.registration.active.postMessage(
                    { type: 'PRELOAD_RESOURCES', data: { urls } },
                    [messageChannel.port2]
                );
            });
        } catch (error) {
            console.error('[SW Manager] Помилка попереднього завантаження:', error);
            return false;
        }
    }

    /**
     * Перевіряє статус Service Worker
     */
    getStatus() {
        if (!this.isSupported) {
            return 'not-supported';
        }

        if (!this.registration) {
            return 'not-registered';
        }

        if (this.updateAvailable) {
            return 'update-available';
        }

        return 'active';
    }

    /**
     * Отримує статистику кешу
     */
    async getCacheStats() {
        const cacheInfo = await this.getCacheInfo();
        
        if (!cacheInfo) {
            return {
                size: 0,
                status: 'unavailable'
            };
        }

        return {
            size: cacheInfo.size,
            status: 'available',
            sizeFormatted: this.formatBytes(cacheInfo.size)
        };
    }

    /**
     * Форматує розмір в байтах
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Експортуємо для використання
window.ServiceWorkerManager = ServiceWorkerManager;
