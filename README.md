# WatchDog

WatchDog — self-hosted сервис для мониторинга доступности сайтов и HTTP endpoint'ов. Приложение позволяет отслеживать текущее состояние сервисов, смотреть историю проверок и получать уведомления в Telegram при падении или восстановлении.

## Что умеет

- проверяет сайты и endpoint'ы по расписанию
- хранит историю проверок в SQLite через Drizzle ORM
- показывает текущий статус, время ответа и недавнюю историю в интерфейсе
- отправляет уведомления в Telegram при сбоях и восстановлении
- поддерживает простой деплой через Docker и Docker Compose

## Стек

- Nuxt 4
- Nuxt UI
- Nitro scheduled tasks
- Drizzle ORM
- SQLite
- Telegram Bot API
- Docker / Docker Compose

## Локальный запуск

1. Установите зависимости:

```bash
npm install
```

2. Создайте локальный файл окружения:

```bash
cp .env.example .env
```

3. Заполните обязательные переменные в `.env`:

```env
NUXT_SESSION_PASSWORD=your-random-session-secret
ADMIN_PASSWORD=your-admin-password
```

4. Запустите проект:

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`.

## Доступные команды

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
```

## Переменные окружения

Обязательные:

- `NUXT_SESSION_PASSWORD` — секрет для сессий `nuxt-auth-utils`
- `ADMIN_PASSWORD` — пароль администратора для входа

Опциональные:

- `MONITOR_ENABLED` — включает или отключает фоновый мониторинг
- `MONITOR_SCHEDULE` — cron-расписание проверок
- `TELEGRAM_BOT_TOKEN` — токен Telegram-бота
- `TELEGRAM_CHAT_ID` — chat id для отправки уведомлений
- `DATABASE_URL` — кастомный путь к SQLite базе

Полный шаблон доступен в [.env.example](.env.example).

## Архитектура

- `server/tasks/monitor.ts` запускает фоновые проверки и обновляет snapshot статусов
- `server/api/status.get.ts` отдаёт данные для дашборда, используя кэш при наличии
- `server/api/sites/*.ts` отвечает за CRUD-операции над отслеживаемыми сайтами
- `server/utils/telegram.ts` отправляет уведомления о падении и восстановлении

## Деплой

Инструкция по деплою через Docker находится в [DEPLOY.md](DEPLOY.md).

## Для портфолио

Этот проект вырос из практической задачи мониторинга личной инфраструктуры. Основной акцент был на полноценном end-to-end решении: авторизация, дашборд, фоновые проверки, хранение истории, Telegram-уведомления и лёгкий self-hosted деплой.
