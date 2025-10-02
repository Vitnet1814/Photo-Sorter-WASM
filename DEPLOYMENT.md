# 🚀 Руководство по деплою

## 🌟 Рекомендовані платформи для деплою

### 1. Vercel (Статічний фронтенд + API)

**Плюси:**
- ✅ Миттєвий деплой через Git
- ✅ Безкоштовний план до 100GB/month
- ✅ Автоматичний HTTPS та CDN
- ✅ Підтримка Serverless Functions
- ✅ Працює з WebAssembly

**Мінуси:**
- ⚠️ Обмеження для складних backend операцій
- ⚠️ Потрібна адаптація Flask сервера

**Команди:**
```bash
# Встановлення Vercel CLI
npm i -g vercel

# Авторизація
vercel login

# Деплой
vercel --prod

# Налаштування домена
vercel domains add ваш-домен.com
```

---

### 2. Railway (Повний стек додаток)

**Плюси:**
- ✅ Підтримка Docker контейнерів
- ✅ PostgreSQL та Redis включені
- ✅ Автоматичний деплой з GitHub
- ✅ 5$ кредити на місяць (майже безкоштовно)
- ✅ Ваша архітектура працює без змін

**Команди:**
```bash
# Спочатку підключіть репозиторій на railway.app
# Railway автоматично визначить docker-compose.yml

# Або через CLI:
# Встановлення Railway CLI
pip install railway

# Логін
railway login

# Деплой
railway up
```

---

### 3. Render (Alternative Kubernetes)

**Плюси:**
- ✅ Автоматичний деплой з Git
- ✅ PostgreSQL database включений
- ✅ Docker підтримка
- ✅ SSL автоматично

**Налаштування:**
1. Підключіть GitHub репозиторій
2. Оберіть "Web Service"
3. Вкажіть команду: `docker-compose up`
4. Налаштуйте змінні середовища

---

### 4. Heroku (Класичний)

**Плюси:**
- ✅ Перевірена платформа
- ✅ Повна підтримка Docker
- ✅ PostgreSQL addon
- ✅ GitHub інтеграція

**Обмеження:**
- ⚠️ 550 годин/місяць на безкоштовну версію
- ⚠️ Контейнер засинає при бездіяльності

**Команди:**
```bash
# Встановлення Heroku CLI
npm install -g heroku

# Логін
heroku login

# Створення додатку
heroku create ваш-додаток-назва

# Деплой
git push heroku main

# Додавання PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev
```

---

## 🏆 Моя рекомендація: Railway

Для вашого проекту з Docker найкращий вибір - **Railway**:

### Чому Railway?
1. **Деплой з одним файлом** - ваш `docker-compose.yml` працює як є
2. **База даних включена** - PostgreSQL та Redis
3. **Автоматичний HTTPS** - SSL сертифікати оновлюються автоматично
4. **Швидкий старт** - від реєстрації до працюючого сайту за 5 хвилин
5. **Детальні логи** - легко дебагити проблеми

### Запуск на Railway:

1. **Перейдіть на railway.app**
2. **Авторизуйтесь через GitHub**
3. **Клікніть "New Project"**
4. **Оберіть ваш репозиторій foto-filter**
5. **Kлікніть "Deploy Now"**
6. **Додайте PostgreSQL сервіс**
7. **Копіюйте URL та відкрийте в браузері**

### Налаштування змінних середовища:

Додайте на Railway:
```
DATABASE_URL=postgresql://user:password@host:port/db
SCORE_DB_URL=postgresql://user:password@host:port/db  
SECRET_KEY=ваш-секретний-ключ
REDIS_URL=redis://user:password@host:port
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=ваш-email
MAIL_PASSWORD=ваш-password
GOOGLE_CLIENT_ID=ваш-git-id
GOOGLE_CLIENT_SECRET=ваш-git-secret
```

---

## 🔧 Альтернатива: Static + Backend

Якщо хочете спробувати інший підхід:

### Frontend на Vercel, Backend на Railway:
1. **Frontend**: Деплой на Vercel (статичні файли)
2. **Backend**: Деплой на Railway (Docker контейнер)
3. **Налаштування**: Зміна API URL в frontend на Railway URL

```javascript
// В frontend/js/config.js
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend.railway.app' 
  : 'http://localhost:5002';
```

---

## 🌍 Регіони для українців:

1. **Railway**: Європейські сервери
2. **Vercel**: Європейські та близькосхідні сервери  
3. **Render**: Європейські сервери
4. **Vercel**: Навіть маршрутизація через Польщу/Угорщину

---

## 📊 Порівняння пропозицій:

| Platform | Месяць | Обмеження | Простість деплою |
|----------|--------|-----------|------------------|
| Railway  | 5$ кредити | ~750h runtime | ⭐⭐⭐⭐⭐ |
| Vercel   | Безкоштовно | 100GB bandwidth | ⭐⭐⭐⭐ |
| Render   | Безкоштовно | 750h runtime | ⭐⭐⭐ |
| Heroku   | Безкоштовно | 550h + sleeping | ⭐⭐ |

---

## 🎥 Покрокове відео деплою Railway:

1. Перейдіть на railway.app
2. Авторизуйтесь через GitHub  
3. New Project → Deploy from GitHub
4. Обираєте foto-filter репозиторій
5. Клікніть "Deploy" з docker-compose
6. Відкрийте розгорнений сайт
7. Тестуйте ваш WASM модулі!

✅ **Загальний час налаштування: ~7-10 хвилин**

Рекомендую спробувати спочатку Railway - він найкраще підходить для вашої Docker архітектури! 🚀
