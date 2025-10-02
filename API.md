# API Документація Photo Sorter WASM

Повна документація API для backend сервера додатку сортування фотографій.

## Базовий URL

```
http://localhost:5000/api
```

## Аутентифікація

API використовує JWT токени для аутентифікації. Токен повинен бути переданий в заголовку:

```
Authorization: Bearer <your-jwt-token>
```

## Коди відповідей

- `200` - Успішний запит
- `201` - Ресурс створено
- `400` - Невірний запит
- `401` - Не авторизований
- `403` - Доступ заборонений
- `404` - Ресурс не знайдено
- `429` - Перевищено ліміт запитів
- `500` - Внутрішня помилка сервера

## Endpoints

### 1. Перевірка стану сервера

#### GET /api/health

Перевіряє стан сервера та доступність API.

**Параметри:** Немає

**Відповідь:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

**Приклад:**
```bash
curl -X GET http://localhost:5000/api/health
```

### 2. Реєстрація користувача

#### POST /api/register

Реєструє нового користувача в системі.

**Параметри:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Відповідь:**
```json
{
  "message": "Користувач успішно зареєстрований",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "is_premium": false,
    "premium_expires": null,
    "created_at": "2024-01-15T10:30:00.000Z",
    "last_login": null,
    "usage_count": 0,
    "total_photos_processed": 0
  }
}
```

**Помилки:**
- `400` - Відсутній email або пароль
- `409` - Користувач з таким email вже існує

**Приклад:**
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword123"}'
```

### 3. Вхід користувача

#### POST /api/login

Авторизує користувача та повертає JWT токен.

**Параметри:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Відповідь:**
```json
{
  "message": "Успішний вхід",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "is_premium": false,
    "premium_expires": null,
    "created_at": "2024-01-15T10:30:00.000Z",
    "last_login": "2024-01-15T10:30:00.000Z",
    "usage_count": 0,
    "total_photos_processed": 0
  }
}
```

**Помилки:**
- `400` - Відсутній email або пароль
- `401` - Невірний email або пароль

**Приклад:**
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword123"}'
```

### 4. Отримання профілю

#### GET /api/profile

Отримує інформацію про поточного користувача.

**Заголовки:**
```
Authorization: Bearer <jwt-token>
```

**Відповідь:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "is_premium": false,
    "premium_expires": null,
    "created_at": "2024-01-15T10:30:00.000Z",
    "last_login": "2024-01-15T10:30:00.000Z",
    "usage_count": 150,
    "total_photos_processed": 150
  }
}
```

**Помилки:**
- `401` - Не авторизований
- `404` - Користувач не знайдений

**Приклад:**
```bash
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### 5. Логування використання

#### POST /api/usage

Логує використання додатку користувачем.

**Заголовки:**
```
Authorization: Bearer <jwt-token>
```

**Параметри:**
```json
{
  "photos_processed": 50,
  "processing_time": 120.5,
  "session_id": "session_123456789"
}
```

**Відповідь:**
```json
{
  "message": "Використання залоговано",
  "usage_count": 200,
  "total_photos_processed": 200
}
```

**Помилки:**
- `401` - Не авторизований
- `404` - Користувач не знайдений
- `429` - Перевищено ліміт фото

**Приклад:**
```bash
curl -X POST http://localhost:5000/api/usage \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{"photos_processed": 50, "processing_time": 120.5, "session_id": "session_123456789"}'
```

### 6. Створення підписки

#### POST /api/subscription/create

Створює нову підписку через Stripe.

**Заголовки:**
```
Authorization: Bearer <jwt-token>
```

**Параметри:** Немає

**Відповідь:**
```json
{
  "checkout_url": "https://checkout.stripe.com/pay/cs_test_...",
  "session_id": "cs_test_123456789"
}
```

**Помилки:**
- `401` - Не авторизований
- `404` - Користувач не знайдений

**Приклад:**
```bash
curl -X POST http://localhost:5000/api/subscription/create \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### 7. Webhook Stripe

#### POST /api/subscription/webhook

Обробляє події від Stripe (викликається автоматично).

**Заголовки:**
```
Stripe-Signature: t=1234567890,v1=...
```

**Параметри:** Stripe webhook payload

**Відповідь:**
```json
{
  "status": "success"
}
```

### 8. Статус підписки

#### GET /api/subscription/status

Отримує поточний статус підписки користувача.

**Заголовки:**
```
Authorization: Bearer <jwt-token>
```

**Відповідь:**
```json
{
  "is_premium": true,
  "premium_expires": "2024-02-15T10:30:00.000Z",
  "usage_count": 0,
  "total_photos_processed": 150
}
```

**Помилки:**
- `401` - Не авторизований
- `404` - Користувач не знайдений

**Приклад:**
```bash
curl -X GET http://localhost:5000/api/subscription/status \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### 9. Статистика користувача

#### GET /api/statistics

Отримує детальну статистику користувача.

**Заголовки:**
```
Authorization: Bearer <jwt-token>
```

**Відповідь:**
```json
{
  "total_photos_processed": 150,
  "recent_photos_processed": 50,
  "recent_processing_time": 120.5,
  "recent_sessions": 3,
  "is_premium": false,
  "usage_count": 150
}
```

**Помилки:**
- `401` - Не авторизований
- `404` - Користувач не знайдений

**Приклад:**
```bash
curl -X GET http://localhost:5000/api/statistics \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### 10. Надсилання відгуку

#### POST /api/feedback

Надсилає відгук від користувача.

**Заголовки:**
```
Authorization: Bearer <jwt-token>
```

**Параметри:**
```json
{
  "feedback": "Дуже зручний додаток!",
  "rating": 5
}
```

**Відповідь:**
```json
{
  "message": "Відгук успішно надіслано"
}
```

**Помилки:**
- `400` - Відсутній текст відгуку
- `401` - Не авторизований
- `404` - Користувач не знайдений

**Приклад:**
```bash
curl -X POST http://localhost:5000/api/feedback \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{"feedback": "Дуже зручний додаток!", "rating": 5}'
```

## Моделі даних

### User

```json
{
  "id": 1,
  "email": "user@example.com",
  "is_premium": false,
  "premium_expires": null,
  "created_at": "2024-01-15T10:30:00.000Z",
  "last_login": "2024-01-15T10:30:00.000Z",
  "usage_count": 150,
  "total_photos_processed": 150
}
```

### Subscription

```json
{
  "id": 1,
  "user_id": 1,
  "stripe_subscription_id": "sub_123456789",
  "stripe_customer_id": "cus_123456789",
  "status": "active",
  "current_period_start": "2024-01-15T10:30:00.000Z",
  "current_period_end": "2024-02-15T10:30:00.000Z",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

### UsageLog

```json
{
  "id": 1,
  "user_id": 1,
  "session_id": "session_123456789",
  "photos_processed": 50,
  "processing_time": 120.5,
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

## Обробка помилок

### Стандартний формат помилки

```json
{
  "error": "Опис помилки",
  "code": "ERROR_CODE",
  "details": {
    "field": "Додаткова інформація"
  }
}
```

### Коди помилок

- `VALIDATION_ERROR` - Помилка валідації даних
- `AUTHENTICATION_ERROR` - Помилка аутентифікації
- `AUTHORIZATION_ERROR` - Помилка авторизації
- `NOT_FOUND_ERROR` - Ресурс не знайдено
- `RATE_LIMIT_ERROR` - Перевищено ліміт запитів
- `SUBSCRIPTION_ERROR` - Помилка підписки
- `PAYMENT_ERROR` - Помилка оплати
- `INTERNAL_ERROR` - Внутрішня помилка сервера

## Ліміти та обмеження

### Rate Limiting

- **Безкоштовні користувачі**: 100 запитів на годину
- **Преміум користувачі**: 1000 запитів на годину
- **API ключі**: 10000 запитів на годину

### Обмеження файлів

- **Максимальний розмір**: 100MB
- **Підтримувані формати**: JPEG, PNG, TIFF, HEIC, WebP, BMP, GIF, CR2, NEF, ARW, DNG
- **Максимальна кількість файлів**: 10000 за сесію

### Обмеження користувачів

- **Безкоштовні**: 1000 фото на сесію
- **Преміум**: Безліміт
- **Максимальний час сесії**: 24 години

## Приклади використання

### JavaScript (Fetch API)

```javascript
// Реєстрація користувача
const registerUser = async (email, password) => {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.access_token);
      return data.user;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Помилка реєстрації:', error);
    throw error;
  }
};

// Отримання профілю
const getProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data.user;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Помилка отримання профілю:', error);
    throw error;
  }
};

// Логування використання
const logUsage = async (photosProcessed, processingTime, sessionId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/usage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        photos_processed: photosProcessed,
        processing_time: processingTime,
        session_id: sessionId,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Помилка логування:', error);
    throw error;
  }
};
```

### Python (requests)

```python
import requests
import json

class PhotoSorterAPI:
    def __init__(self, base_url='http://localhost:5000/api'):
        self.base_url = base_url
        self.token = None
    
    def register(self, email, password):
        """Реєстрація користувача"""
        response = requests.post(
            f'{self.base_url}/register',
            json={'email': email, 'password': password}
        )
        
        if response.status_code == 201:
            data = response.json()
            self.token = data['access_token']
            return data['user']
        else:
            raise Exception(response.json()['error'])
    
    def login(self, email, password):
        """Вхід користувача"""
        response = requests.post(
            f'{self.base_url}/login',
            json={'email': email, 'password': password}
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['access_token']
            return data['user']
        else:
            raise Exception(response.json()['error'])
    
    def get_profile(self):
        """Отримання профілю"""
        if not self.token:
            raise Exception('Не авторизований')
        
        response = requests.get(
            f'{self.base_url}/profile',
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        if response.status_code == 200:
            return response.json()['user']
        else:
            raise Exception(response.json()['error'])
    
    def log_usage(self, photos_processed, processing_time, session_id):
        """Логування використання"""
        if not self.token:
            raise Exception('Не авторизований')
        
        response = requests.post(
            f'{self.base_url}/usage',
            headers={'Authorization': f'Bearer {self.token}'},
            json={
                'photos_processed': photos_processed,
                'processing_time': processing_time,
                'session_id': session_id
            }
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(response.json()['error'])

# Приклад використання
api = PhotoSorterAPI()

# Реєстрація
user = api.register('user@example.com', 'password123')
print(f'Користувач зареєстрований: {user["email"]}')

# Логування використання
result = api.log_usage(50, 120.5, 'session_123')
print(f'Використання залоговано: {result["usage_count"]} фото')
```

### cURL приклади

```bash
# Реєстрація
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Вхід
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Отримання профілю
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Логування використання
curl -X POST http://localhost:5000/api/usage \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"photos_processed": 50, "processing_time": 120.5, "session_id": "session_123"}'

# Створення підписки
curl -X POST http://localhost:5000/api/subscription/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Статус підписки
curl -X GET http://localhost:5000/api/subscription/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Статистика
curl -X GET http://localhost:5000/api/statistics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Надсилання відгуку
curl -X POST http://localhost:5000/api/feedback \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"feedback": "Дуже зручний додаток!", "rating": 5}'
```

## WebSocket API

### Підключення

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onopen = function(event) {
    console.log('WebSocket підключено');
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Отримано повідомлення:', data);
};

ws.onclose = function(event) {
    console.log('WebSocket відключено');
};

ws.onerror = function(error) {
    console.error('Помилка WebSocket:', error);
};
```

### Повідомлення

#### Підписка на оновлення

```json
{
  "type": "subscribe",
  "channel": "user_updates",
  "user_id": 123
}
```

#### Оновлення статусу

```json
{
  "type": "status_update",
  "user_id": 123,
  "is_premium": true,
  "usage_count": 150
}
```

## Тестування API

### Postman Collection

```json
{
  "info": {
    "name": "Photo Sorter WASM API",
    "description": "API для додатку сортування фотографій",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/api/health",
          "host": ["{{base_url}}"],
          "path": ["api", "health"]
        }
      }
    },
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"user@example.com\",\n  \"password\": \"password123\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/register",
          "host": ["{{base_url}}"],
          "path": ["api", "register"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000"
    }
  ]
}
```

### Автоматичне тестування

```python
import pytest
import requests

class TestPhotoSorterAPI:
    def setup_method(self):
        self.base_url = 'http://localhost:5000/api'
        self.token = None
    
    def test_health_check(self):
        response = requests.get(f'{self.base_url}/health')
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
    
    def test_register_user(self):
        response = requests.post(
            f'{self.base_url}/register',
            json={'email': 'test@example.com', 'password': 'password123'}
        )
        assert response.status_code == 201
        data = response.json()
        assert 'access_token' in data
        assert 'user' in data
        self.token = data['access_token']
    
    def test_get_profile(self):
        if not self.token:
            self.test_register_user()
        
        response = requests.get(
            f'{self.base_url}/profile',
            headers={'Authorization': f'Bearer {self.token}'}
        )
        assert response.status_code == 200
        data = response.json()
        assert 'user' in data
        assert data['user']['email'] == 'test@example.com'
    
    def test_log_usage(self):
        if not self.token:
            self.test_register_user()
        
        response = requests.post(
            f'{self.base_url}/usage',
            headers={'Authorization': f'Bearer {self.token}'},
            json={
                'photos_processed': 10,
                'processing_time': 30.5,
                'session_id': 'test_session'
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert 'usage_count' in data
        assert 'total_photos_processed' in data
```

## Безпека

### JWT Токени

- **Алгоритм**: HS256
- **Термін дії**: 30 днів
- **Оновлення**: Автоматичне при використанні
- **Чорний список**: Підтримується для відкликання

### HTTPS

- **Обов'язково** для продакшну
- **TLS 1.2+** мінімум
- **HSTS** заголовки
- **Certificate Pinning** для мобільних додатків

### CORS

- **Дозволені домени**: Налаштовуються в конфігурації
- **Методи**: GET, POST, PUT, DELETE, OPTIONS
- **Заголовки**: Authorization, Content-Type
- **Credentials**: Підтримуються

### Rate Limiting

- **Безкоштовні**: 100 запитів/годину
- **Преміум**: 1000 запитів/годину
- **API ключі**: 10000 запитів/годину
- **IP обмеження**: 1000 запитів/годину

## Моніторинг

### Метрики

- **Запити за хвилину**: Кількість API запитів
- **Час відповіді**: Середній час обробки
- **Помилки**: Кількість 4xx/5xx відповідей
- **Активні користувачі**: Кількість унікальних користувачів

### Логування

- **Рівень**: INFO, WARNING, ERROR
- **Формат**: JSON
- **Ротація**: Щоденна
- **Зберігання**: 30 днів

### Алерти

- **Високий час відповіді**: > 2 секунди
- **Високий рівень помилок**: > 5%
- **Недоступність сервісу**: 0 відповідей
- **Перевищення лімітів**: Rate limiting

## Підтримка

### Контакти

- **Email**: api-support@photo-sorter-wasm.com
- **GitHub**: https://github.com/your-username/photo-sorter-wasm
- **Документація**: https://docs.photo-sorter-wasm.com/api

### SLA

- **Доступність**: 99.9%
- **Час відповіді**: < 500ms (95 перцентиль)
- **Підтримка**: 24/7 для преміум користувачів
- **Оновлення**: Щомісячні
