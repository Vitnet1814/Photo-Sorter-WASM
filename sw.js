/**
 * Service Worker для Photo Sorter WASM
 * Забезпечує кешування ресурсів та офлайн роботу
 */

const CACHE_NAME = 'photo-sorter-v1.0.1';
const STATIC_CACHE_NAME = 'photo-sorter-static-v1.0.1';
const DYNAMIC_CACHE_NAME = 'photo-sorter-dynamic-v1.0.1';

// Ресурси для кешування при встановленні
const STATIC_ASSETS = [
    '/',
    '/css/styles.css',
    '/js/main.js',
    '/js/file-handler.js',
    '/js/i18n.js',
    '/js/wasm-loader.js',
    '/wasm/photo-processor.js',
    '/wasm/photo-processor.wasm',
    '/favicon.ico',
    '/favicon.svg',
    '/manifest.json',
    '/browserconfig.xml'
];

// Ресурси, які завжди повинні завантажуватися з мережі
const NETWORK_FIRST_PATTERNS = [
    /\/api\//,
    /\/stats/,
    /\/analytics/
];

// Ресурси, які можуть працювати офлайн
const CACHE_FIRST_PATTERNS = [
    /\.(js|css|wasm|json|ico|svg|png|jpg|jpeg|gif|webp)$/,
    /\/js\//,
    /\/css\//,
    /\/wasm\//,
    /\/locales\//
];

/**
 * Подія встановлення Service Worker
 */
self.addEventListener('install', event => {
    console.log('[SW] Встановлення Service Worker v1.0.1');
    
    event.waitUntil(
        Promise.all([
            // Кешуємо статичні ресурси
            caches.open(STATIC_CACHE_NAME).then(cache => {
                console.log('[SW] Кешування статичних ресурсів');
                return cache.addAll(STATIC_ASSETS).catch(error => {
                    console.error('[SW] Помилка кешування ресурсів:', error);
                    // Кешуємо тільки доступні ресурси
                    return Promise.allSettled(
                        STATIC_ASSETS.map(url => 
                            cache.add(url).catch(err => 
                                console.log(`[SW] Не вдалося кешувати ${url}:`, err)
                            )
                        )
                    );
                });
            }),
            // Встановлюємо новий Service Worker одразу
            self.skipWaiting()
        ]).catch(error => {
            console.error('[SW] Критична помилка встановлення:', error);
        })
    );
});

/**
 * Подія активації Service Worker
 */
self.addEventListener('activate', event => {
    console.log('[SW] Активація Service Worker');
    
    event.waitUntil(
        Promise.all([
            // Очищуємо старі кеші
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('[SW] Видалення старого кешу:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Беремо контроль над всіма клієнтами
            self.clients.claim()
        ])
    );
});

/**
 * Обробка мережевих запитів
 */
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ігноруємо запити, які не є HTTP/HTTPS
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Ігноруємо запити з режимом 'navigate' (сторінки)
    if (request.mode === 'navigate') {
        return;
    }
    
    // Ігноруємо запити з режимом 'no-cors'
    if (request.mode === 'no-cors') {
        return;
    }
    
    // Обробляємо різні типи запитів
    if (isNetworkFirstRequest(request)) {
        event.respondWith(networkFirstStrategy(request));
    } else if (isCacheFirstRequest(request)) {
        event.respondWith(cacheFirstStrategy(request));
    } else {
        event.respondWith(staleWhileRevalidateStrategy(request));
    }
});

/**
 * Перевіряє, чи запит повинен використовувати стратегію "Network First"
 */
function isNetworkFirstRequest(request) {
    return NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(request.url));
}

/**
 * Перевіряє, чи запит повинен використовувати стратегію "Cache First"
 */
function isCacheFirstRequest(request) {
    return CACHE_FIRST_PATTERNS.some(pattern => pattern.test(request.url));
}

/**
 * Стратегія "Network First" - спочатку мережа, потім кеш
 */
async function networkFirstStrategy(request) {
    try {
        // Створюємо новий запит з правильним режимом
        const fetchRequest = new Request(request, {
            redirect: 'follow'
        });
        
        const networkResponse = await fetch(fetchRequest);
        
        // Кешуємо успішні відповіді
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            // Перевіряємо чи можна клонувати Response
            if (networkResponse.body && !networkResponse.bodyUsed) {
                cache.put(request, networkResponse.clone());
            }
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Мережа недоступна, використовуємо кеш:', request.url);
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Повертаємо офлайн сторінку для HTML запитів
        if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
            return new Response(
                getOfflinePage(),
                {
                    headers: { 'Content-Type': 'text/html' }
                }
            );
        }
        
        throw error;
    }
}

/**
 * Стратегія "Cache First" - спочатку кеш, потім мережа
 */
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        // Створюємо новий запит з правильним режимом
        const fetchRequest = new Request(request, {
            redirect: 'follow'
        });
        
        const networkResponse = await fetch(fetchRequest);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            // Перевіряємо чи можна клонувати Response
            if (networkResponse.body && !networkResponse.bodyUsed) {
                cache.put(request, networkResponse.clone());
            }
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Помилка завантаження:', request.url, error);
        throw error;
    }
}

/**
 * Стратегія "Stale While Revalidate" - кеш + оновлення в фоні
 */
async function staleWhileRevalidateStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    const fetchPromise = fetch(new Request(request, {
        redirect: 'follow'
    })).then(networkResponse => {
        if (networkResponse.ok) {
            const cache = caches.open(DYNAMIC_CACHE_NAME);
            cache.then(c => {
                // Перевіряємо чи можна клонувати Response
                if (networkResponse.body && !networkResponse.bodyUsed) {
                    c.put(request, networkResponse.clone());
                }
            });
        }
        return networkResponse;
    }).catch(error => {
        console.log('[SW] Помилка мережі:', request.url, error);
        return cachedResponse;
    });
    
    return cachedResponse || fetchPromise;
}

/**
 * Повертає HTML для офлайн сторінки
 */
function getOfflinePage() {
    return `
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Офлайн - Photo Sorter</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .offline-container {
            text-align: center;
            max-width: 500px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        .offline-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        h1 {
            margin: 0 0 20px 0;
            font-size: 2.5em;
        }
        p {
            margin: 0 0 30px 0;
            font-size: 1.2em;
            opacity: 0.9;
        }
        .retry-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 1.1em;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .retry-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="offline-container">
        <div class="offline-icon">📱</div>
        <h1>Офлайн режим</h1>
        <p>Ви зараз не підключені до інтернету. Перевірте з'єднання та спробуйте знову.</p>
        <button class="retry-btn" onclick="window.location.reload()">
            Спробувати знову
        </button>
    </div>
</body>
</html>`;
}

/**
 * Обробка повідомлень від основного потоку
 */
self.addEventListener('message', event => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_CACHE_SIZE':
            getCacheSize().then(size => {
                event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
            });
            break;
            
        case 'CLEAR_CACHE':
            clearCache().then(() => {
                event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
            });
            break;
            
        case 'PRELOAD_RESOURCES':
            preloadResources(data.urls).then(() => {
                event.ports[0].postMessage({ type: 'RESOURCES_PRELOADED' });
            });
            break;
    }
});

/**
 * Отримує розмір кешу
 */
async function getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
    }
    
    return totalSize;
}

/**
 * Очищує весь кеш
 */
async function clearCache() {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
}

/**
 * Попередньо завантажує ресурси
 */
async function preloadResources(urls) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    
    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
            }
        } catch (error) {
            console.log('[SW] Помилка попереднього завантаження:', url, error);
        }
    }
}

/**
 * Обробка синхронізації в фоновому режимі
 */
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

/**
 * Виконує синхронізацію в фоновому режимі
 */
async function doBackgroundSync() {
    console.log('[SW] Виконання фонової синхронізації');
    // Тут можна додати логіку синхронізації даних
}

/**
 * Обробка push повідомлень
 */
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey
            },
            actions: [
                {
                    action: 'explore',
                    title: 'Переглянути',
                    icon: '/favicon.svg'
                },
                {
                    action: 'close',
                    title: 'Закрити',
                    icon: '/favicon.svg'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

/**
 * Обробка кліків по повідомленнях
 */
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

console.log('[SW] Service Worker завантажений');
