# Встановлення Photo Sorter WASM

Детальна інструкція з встановлення та налаштування додатку для сортування фотографій.

## Системні вимоги

### Мінімальні вимоги
- **ОС**: Windows 10, macOS 10.14, Linux Ubuntu 18.04+
- **Браузер**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **RAM**: 4 GB
- **Диск**: 2 GB вільного місця
- **Процесор**: x64 архітектура

### Рекомендовані вимоги
- **ОС**: Windows 11, macOS 12+, Linux Ubuntu 20.04+
- **Браузер**: Chrome 90+, Firefox 85+, Safari 14+
- **RAM**: 8 GB+
- **Диск**: 10 GB+ вільного місця
- **Процесор**: 4+ ядра, 2.5+ GHz

## Встановлення для розробки

### 1. Клонування репозиторію

```bash
git clone https://github.com/your-username/photo-sorter-wasm.git
cd photo-sorter-wasm
```

### 2. Встановлення Emscripten SDK

#### Windows
```bash
# Завантажте та встановіть Emscripten SDK
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
emsdk install latest
emsdk activate latest
emsdk_env.bat
```

#### macOS
```bash
# Встановлення через Homebrew
brew install emscripten

# Або вручну
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

#### Linux
```bash
# Встановлення через пакетний менеджер
sudo apt-get update
sudo apt-get install emscripten

# Або вручну
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

### 3. Компіляція WebAssembly модуля

```bash
cd wasm-source
chmod +x build.sh
./build.sh
```

### 4. Встановлення Python залежностей

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 5. Налаштування бази даних

```bash
# Створення міграцій
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

### 6. Налаштування змінних середовища

```bash
# Створіть файл .env в папці backend
cp config.py .env

# Відредагуйте .env файл
nano .env
```

Приклад `.env` файлу:
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///photo_sorter.db
JWT_SECRET_KEY=your-jwt-secret-key-here
STRIPE_SECRET_KEY=sk_test_your_stripe_key_here
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### 7. Запуск сервера розробки

```bash
# Backend
cd backend
python app.py

# Frontend (в новому терміналі)
cd frontend
python -m http.server 8000
```

## Встановлення для продакшну

### 1. Docker встановлення

```bash
# Створення Docker образу
docker build -t photo-sorter-wasm .

# Запуск контейнера
docker run -d -p 5000:5000 --name photo-sorter photo-sorter-wasm
```

### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/photo_sorter
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: photo_sorter
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

```bash
# Запуск
docker-compose up -d
```

### 3. Ручне встановлення на сервер

#### Ubuntu/Debian
```bash
# Оновлення системи
sudo apt update && sudo apt upgrade -y

# Встановлення Python та pip
sudo apt install python3 python3-pip python3-venv -y

# Встановлення PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Встановлення Redis
sudo apt install redis-server -y

# Встановлення Nginx
sudo apt install nginx -y

# Клонування проекту
git clone https://github.com/your-username/photo-sorter-wasm.git
cd photo-sorter-wasm

# Встановлення залежностей
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Налаштування бази даних
sudo -u postgres createdb photo_sorter
sudo -u postgres createuser photo_sorter_user
sudo -u postgres psql -c "ALTER USER photo_sorter_user PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE photo_sorter TO photo_sorter_user;"

# Створення systemd сервісу
sudo nano /etc/systemd/system/photo-sorter.service
```

Приклад systemd сервісу:
```ini
[Unit]
Description=Photo Sorter WASM
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/photo-sorter-wasm/backend
Environment=PATH=/path/to/photo-sorter-wasm/backend/venv/bin
ExecStart=/path/to/photo-sorter-wasm/backend/venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Активація сервісу
sudo systemctl enable photo-sorter
sudo systemctl start photo-sorter
```

#### CentOS/RHEL
```bash
# Встановлення EPEL репозиторію
sudo yum install epel-release -y

# Встановлення Python та pip
sudo yum install python3 python3-pip -y

# Встановлення PostgreSQL
sudo yum install postgresql-server postgresql-contrib -y
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Встановлення Redis
sudo yum install redis -y
sudo systemctl enable redis
sudo systemctl start redis

# Встановлення Nginx
sudo yum install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

## Налаштування Nginx

```nginx
# /etc/nginx/sites-available/photo-sorter
server {
    listen 80;
    server_name your-domain.com;
    
    # Перенаправлення на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL сертифікати
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # SSL налаштування
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Статичні файли
    location / {
        root /path/to/photo-sorter-wasm/frontend;
        try_files $uri $uri/ /index.html;
    }
    
    # API проксі
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket підтримка
    location /ws/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Безпека
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

```bash
# Активація конфігурації
sudo ln -s /etc/nginx/sites-available/photo-sorter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Налаштування SSL сертифікатів

### Let's Encrypt
```bash
# Встановлення Certbot
sudo apt install certbot python3-certbot-nginx -y

# Отримання сертифікату
sudo certbot --nginx -d your-domain.com

# Автоматичне оновлення
sudo crontab -e
# Додайте рядок:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## Моніторинг та логування

### Налаштування логування
```bash
# Створення папки для логів
sudo mkdir -p /var/log/photo-sorter
sudo chown www-data:www-data /var/log/photo-sorter

# Налаштування logrotate
sudo nano /etc/logrotate.d/photo-sorter
```

```bash
# /etc/logrotate.d/photo-sorter
/var/log/photo-sorter/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload photo-sorter
    endscript
}
```

### Налаштування моніторингу
```bash
# Встановлення Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xzf prometheus-2.40.0.linux-amd64.tar.gz
sudo mv prometheus-2.40.0.linux-amd64 /opt/prometheus

# Встановлення Grafana
wget https://dl.grafana.com/oss/release/grafana-9.3.0.linux-amd64.tar.gz
tar xzf grafana-9.3.0.linux-amd64.tar.gz
sudo mv grafana-9.3.0 /opt/grafana
```

## Перевірка встановлення

### 1. Перевірка WebAssembly модуля
```bash
# Відкрийте браузер та перейдіть на:
http://localhost:8000/wasm/test.html
```

### 2. Перевірка API
```bash
# Перевірка здоров'я сервера
curl http://localhost:5000/api/health

# Очікувана відповідь:
# {"status": "healthy", "timestamp": "2024-01-15T10:30:00", "version": "1.0.0"}
```

### 3. Перевірка бази даних
```bash
# Підключення до бази даних
psql -h localhost -U photo_sorter_user -d photo_sorter

# Перевірка таблиць
\dt

# Перевірка користувачів
SELECT * FROM users;
```

## Усунення неполадок

### Проблеми з WebAssembly
```bash
# Перевірка версії Emscripten
emcc --version

# Очищення кешу
emcc --clear-cache

# Перекомпіляція
cd wasm-source
rm -rf ../frontend/wasm/*
./build.sh
```

### Проблеми з базою даних
```bash
# Перевірка підключення
python -c "from app import db; print('Database connection OK')"

# Скидання бази даних
flask db drop
flask db create
flask db upgrade
```

### Проблеми з правами доступу
```bash
# Виправлення прав доступу
sudo chown -R www-data:www-data /path/to/photo-sorter-wasm
sudo chmod -R 755 /path/to/photo-sorter-wasm
```

## Підтримка

Якщо у вас виникли проблеми з встановленням:

1. Перевірте [FAQ](FAQ.md)
2. Створіть [Issue](https://github.com/your-username/photo-sorter-wasm/issues)
3. Напишіть на email: support@photo-sorter-wasm.com

## Оновлення

### Оновлення до нової версії
```bash
# Зупинка сервісу
sudo systemctl stop photo-sorter

# Створення бекапу
sudo -u postgres pg_dump photo_sorter > backup_$(date +%Y%m%d_%H%M%S).sql

# Оновлення коду
git pull origin main

# Оновлення залежностей
source venv/bin/activate
pip install -r requirements.txt

# Застосування міграцій
flask db upgrade

# Перезапуск сервісу
sudo systemctl start photo-sorter
```
