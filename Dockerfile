# Dockerfile для Nuxt 4 приложения WatchDog
# Multi-stage build для оптимизации размера образа

# ==========================================
# Stage 1: Базовый образ и установка зависимостей
# ==========================================
FROM node:20-alpine AS base

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы package.json и lock файлы
COPY package.json package-lock.json* ./

# ==========================================
# Stage 2: Установка зависимостей
# ==========================================
FROM base AS deps

# Устанавливаем зависимости (включая dev для сборки)
RUN npm ci

# ==========================================
# Stage 3: Сборка приложения
# ==========================================
FROM base AS builder

# Устанавливаем build dependencies для better-sqlite3
RUN apk add --no-cache python3 make g++

# Копируем node_modules из предыдущего stage
COPY --from=deps /app/node_modules ./node_modules

# Копируем весь проект
COPY . .

# Запускаем сборку Nuxt
RUN npm run build

# ==========================================
# Stage 4: Production образ
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Копируем собранное приложение (.output содержит все необходимое)
COPY --from=builder /app/.output ./.output

# Создаем директорию для БД если её нет
RUN mkdir -p .data && chown -R node:node /app

# Используем непривилегированного пользователя
USER node

# Открываем порт
EXPOSE 3000

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Запускаем приложение
CMD ["node", ".output/server/index.mjs"]
