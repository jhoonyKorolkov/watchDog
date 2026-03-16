# 🚀 Инструкция по развертыванию WatchDog с Docker

Это руководство поможет развернуть систему мониторинга WatchDog на вашем сервере с использованием Docker.

## 📋 Требования

- Docker 20.10 или выше
- Docker Compose 2.0 или выше
- Минимум 512 MB RAM
- Минимум 1 GB свободного места на диске

## 🔧 Быстрая установка

### 1. Клонируйте репозиторий

```bash
git clone <your-repo-url> watchdog
cd watchdog
```

### 2. Настройте переменные окружения

Скопируйте шаблон и отредактируйте файл:

```bash
cp .env.example .env
nano .env
```

**Обязательно измените:**

```env
# Генерируйте случайную строку (32+ символов)
NUXT_SESSION_PASSWORD=$(openssl rand -base64 32)

# Установите надежный пароль
ADMIN_PASSWORD=your_secure_password_here
```

> **Важно:** НЕ изменяйте `DATABASE_URL` в `.env` файле для локальной разработки! Приложение автоматически использует `.data/sqlite.db`. В Docker контейнере путь устанавливается автоматически через `docker-compose.yml`.

**Опционально для Telegram уведомлений:**

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота и добавьте в `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
3. Запустите приложение (шаг 3)
4. Напишите боту любое сообщение
5. Откройте в браузере: `http://your-server:3000/api/telegram/get-chat-id`
6. Скопируйте `chat_id` и добавьте в `.env`:
   ```env
   TELEGRAM_CHAT_ID=123456789
   ```
7. Перезапустите контейнер

### 3. Запустите приложение

```bash
# Сборка и запуск в фоновом режиме
docker-compose up -d

# Просмотр логов
docker-compose logs -f watchdog
```

### 4. Откройте приложение

Откройте браузер и перейдите на:

```
http://your-server:3000
```

Войдите с паролем, который установили в `.env`.

## 📦 Управление контейнером

### Остановка приложения

```bash
docker-compose down
```

### Перезапуск приложения

```bash
docker-compose restart
```

### Обновление приложения

```bash
# Остановка и удаление старого контейнера
docker-compose down

# Получение новых изменений
git pull

# Пересборка и запуск
docker-compose up -d --build
```

### Просмотр логов

```bash
# Все логи
docker-compose logs -f

# Последние 100 строк
docker-compose logs --tail=100 -f
```

### Очистка логов

```bash
docker-compose down
docker-compose up -d
```

## 🗄️ База данных

База данных SQLite хранится в Docker volume `watchdog-data`.

### Резервное копирование

```bash
# Создание бэкапа
docker run --rm -v watchdog_watchdog-data:/data -v $(pwd):/backup alpine tar czf /backup/backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
```

### Восстановление из бэкапа

```bash
# Остановка приложения
docker-compose down

# Восстановление (замените backup.tar.gz на ваш файл)
docker run --rm -v watchdog_watchdog-data:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/backup.tar.gz"

# Запуск приложения
docker-compose up -d
```

## 🔍 Проверка здоровья (Health Check)

Docker автоматически проверяет работоспособность каждые 30 секунд через endpoint `/api/status`.

Проверить статус вручную:

```bash
docker-compose ps
```

Статус должен быть `healthy`.

## 🔒 Безопасность

### Рекомендации

1. **Обязательно измените `NUXT_SESSION_PASSWORD`** - используйте случайную строку минимум 32 символа
2. **Используйте надежный `ADMIN_PASSWORD`** - минимум 12 символов с цифрами и спецсимволами
3. **Не коммитьте `.env` файл** в Git (уже добавлен в `.gitignore`)
4. **Используйте HTTPS** - разместите приложение за reverse proxy (Nginx, Caddy)

### Настройка Nginx Reverse Proxy

Пример конфигурации для Nginx:

```nginx
server {
    listen 80;
    server_name watchdog.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

После настройки используйте [Certbot](https://certbot.eff.org/) для HTTPS:

```bash
sudo certbot --nginx -d watchdog.yourdomain.com
```

## 🐛 Решение проблем

### Контейнер не запускается

Проверьте логи:

```bash
docker-compose logs watchdog
```

### База данных не сохраняется

Убедитесь, что volume создан:

```bash
docker volume ls | grep watchdog
```

### Telegram не отправляет уведомления

1. Проверьте токен бота в `.env`
2. Убедитесь, что вы написали боту хотя бы одно сообщение
3. Проверьте chat_id через `/api/telegram/get-chat-id`
4. Посмотрите логи на наличие ошибок

### Порт 3000 уже занят

Измените порт в `docker-compose.yml`:

```yaml
ports:
  - '8080:3000' # Изменить первое число
```

### Ошибки компиляции better-sqlite3

Если при сборке образа возникают ошибки вида `node-gyp` или `better-sqlite3`:

1. Убедитесь, что в Dockerfile установлены build dependencies (уже включены)
2. Очистите Docker кэш и пересоберите:
   ```bash
   docker-compose down
   docker builder prune -a
   docker-compose up -d --build
   ```

### Проблемы с архитектурой (Mac → Linux)

Если вы собираете образ на Mac (arm64/amd64), а деплоите на Linux сервер с другой архитектурой:

```bash
# Сборка для конкретной платформы
docker buildx build --platform linux/amd64 -t watchdog .

# Или указать в docker-compose.yml
services:
  watchdog:
    platform: linux/amd64
    build: ...
```

## 📊 Мониторинг

### Использование ресурсов

```bash
docker stats watchdog-monitor
```

### Проверка работы мониторинга

1. Откройте приложение
2. Добавьте тестовый сайт (например, `https://google.com`)
3. В течение 1 минуты появится первая проверка
4. Проверки выполняются каждую минуту автоматически

## 🔄 Очистка старых данных

Приложение автоматически удаляет результаты проверок старше 7 дней. Это происходит при каждом запуске задачи мониторинга (каждую минуту).

## 📞 Поддержка

Если возникли проблемы:

1. Проверьте логи: `docker-compose logs -f`
2. Убедитесь, что все переменные в `.env` заполнены корректно
3. Проверьте доступность порта 3000
4. Убедитесь, что Docker и Docker Compose установлены правильно

## ⚙️ Дополнительные настройки

### Управление мониторингом

Вы можете управлять автоматическим мониторингом через переменные окружения в `.env`:

**Включение/отключение мониторинга:**

```env
# Отключить автоматические проверки
MONITOR_ENABLED=false

# Включить обратно (по умолчанию)
MONITOR_ENABLED=true
```

После изменения перезапустите контейнер:

```bash
docker-compose restart
```

**Изменение интервала проверок:**

```env
# Каждую минуту (по умолчанию)
MONITOR_SCHEDULE=*/1 * * * *

# Каждые 5 минут
MONITOR_SCHEDULE=*/5 * * * *

# Каждые 15 минут
MONITOR_SCHEDULE=*/15 * * * *

# Каждый час
MONITOR_SCHEDULE=0 * * * *

# Каждые 6 часов
MONITOR_SCHEDULE=0 */6 * * *
```

Формат cron: `минута час день месяц день_недели`

> **Примечание:** После изменения `MONITOR_SCHEDULE` нужно **пересобрать** контейнер:
>
> ```bash
> docker-compose up -d --build
> ```

**Примеры использования:**

Остановить мониторинг для обслуживания:

1. Добавьте в `.env`: `MONITOR_ENABLED=false`
2. Перезапустите: `docker-compose restart`
3. Проверьте логи: `docker-compose logs -f` (должно быть "Мониторинг отключен")

Уменьшить нагрузку (проверки раз в час):

1. Измените в `.env`: `MONITOR_SCHEDULE=0 * * * *`
2. Пересоберите: `docker-compose up -d --build`

### Очистка кэша

Откройте в браузере:

```
http://your-server:3000/api/cache/clear
```

(Требуется авторизация)
