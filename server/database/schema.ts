import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const sites = sqliteTable('sites', {
  id: integer().primaryKey({ autoIncrement: true }),
  url: text('url').notNull(),
  name: text('name').notNull(),
  interval: integer().notNull().default(60), // Интервал в секундах, по умолчанию 60
  isActive: integer('is_active').notNull().default(1), // 1 - активен, 0 - неактивен
  // Unix-время в мс когда сайт был мягко удалён; null = не удалён
  deletedAt: integer('deleted_at'),
});

export const checks = sqliteTable('checks', {
  id: integer().primaryKey({ autoIncrement: true }),
  siteId: integer('site_id')
    .notNull()
    .references(() => sites.id),
  status: integer().notNull(), // HTTP статус код
  responseTime: integer('response_time').notNull(), // Время ответа в миллисекундах
  timestamp: integer().notNull(), // Временная метка проверки (Unix time)
  error: text('error'), // Сообщение об ошибке, если проверка не удалась
  createdAt: integer('created_at').notNull(), // Временная метка создания записи (Unix time)
});

// 1. Описываем связи для таблицы сайтов
export const sitesRelations = relations(sites, ({ many }) => ({
  checks: many(checks), // "У одного сайта много проверок"
}));

// 2. Описываем связи для таблицы проверок
export const checksRelations = relations(checks, ({ one }) => ({
  site: one(sites, {
    fields: [checks.siteId],
    references: [sites.id],
  }),
}));
