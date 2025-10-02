# Photo Sorter WASM - Dockerfile
# Multi-stage build для оптимізації розміру образу

# Stage 1: Build WebAssembly module
FROM emscripten/emsdk:3.1.44 AS wasm-builder

WORKDIR /app

# Копіюємо вихідний код WASM
COPY wasm-source/ ./wasm-source/

# Компілюємо WASM модуль
WORKDIR /app/wasm-source
RUN chmod +x build.sh && ./build.sh

# Stage 2: Build Python backend
FROM python:3.11-slim AS backend-builder

WORKDIR /app

# Встановлюємо системні залежності
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Копіюємо requirements та встановлюємо залежності
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Production image
FROM python:3.11-slim AS production

# Метадані образу
LABEL maintainer="Photo Sorter WASM Team"
LABEL description="Web-додаток для сортування фотографій з WebAssembly"
LABEL version="1.0.0"

# Встановлюємо системні залежності
RUN apt-get update && apt-get install -y \
    libpq5 \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Створюємо користувача для безпеки
RUN groupadd -r photosorter && useradd -r -g photosorter photosorter

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо Python залежності з builder
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Копіюємо код додатку
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Копіюємо скомпільований WASM модуль
COPY --from=wasm-builder /app/frontend/wasm/ ./frontend/wasm/

# Створюємо необхідні директорії
RUN mkdir -p /app/logs /app/uploads /app/static

# Встановлюємо права доступу
RUN chown -R photosorter:photosorter /app
RUN chmod -R 755 /app

# Налаштування Nginx
COPY docker/nginx.conf /etc/nginx/sites-available/default
RUN rm /etc/nginx/sites-enabled/default && \
    ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/

# Налаштування Supervisor
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Налаштування Python
ENV PYTHONPATH=/app/backend
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Змінні середовища
ENV DATABASE_URL=sqlite:///app/data/photo_sorter.db
ENV SECRET_KEY=change-this-in-production
ENV JWT_SECRET_KEY=change-this-in-production
ENV REDIS_URL=redis://redis:6379/0

# Створюємо директорію для даних
RUN mkdir -p /app/data && chown photosorter:photosorter /app/data

# Відкриваємо порти
EXPOSE 80 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/api/health || exit 1

# Запуск Flask напряму (тимчасово для debugging)
CMD ["python", "/app/backend/app.py"]
