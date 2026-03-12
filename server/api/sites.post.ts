import { defineEventHandler, readBody } from 'h3';
import { z } from 'zod';
import { db } from '../utils/db';
import { sites } from '../database/schema';

// Зод схема для валидации данных при создании сайта
const createSiteSchema = z.object({
  name: z
    .string()
    .min(1, 'Название обязательно')
    .min(3, 'Название должно быть не менее 3 символов')
    .max(100, 'Название не должно превышать 100 символов'),
  url: z.string().min(1, 'URL обязателен').url('Некорректный URL'),
  interval: z
    .number()
    .int()
    .min(30, 'Интервал должен быть не менее 30 секунд')
    .default(60)
    .optional(),
});

/**
 * POST /api/sites
 * Создает новый сайт для мониторинга
 */
export default defineEventHandler(async (event) => {
  try {
    // Получаем тело запроса
    const body = await readBody(event);

    // Валидируем данные через Зод
    const validatedData = createSiteSchema.parse(body);

    // Проверяем, что URL не является локальным адресом (SSRF защита)
    const urlObject = new URL(validatedData.url);
    const hostname = urlObject.hostname.toLowerCase();

    // Запрещаем локальные адреса и приватные подсети
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.20.') ||
      hostname.startsWith('172.21.') ||
      hostname.startsWith('172.22.') ||
      hostname.startsWith('172.23.') ||
      hostname.startsWith('172.24.') ||
      hostname.startsWith('172.25.') ||
      hostname.startsWith('172.26.') ||
      hostname.startsWith('172.27.') ||
      hostname.startsWith('172.28.') ||
      hostname.startsWith('172.29.') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.');

    if (isLocalhost) {
      throw new Error('Использование локальных адресов запрещено');
    }

    // Вставляем новый сайт в БД и получаем объект созданного сайта
    const [newSite] = await db
      .insert(sites)
      .values({
        name: validatedData.name,
        url: validatedData.url,
        interval: validatedData.interval || 60,
        isActive: 1,
      })
      .returning();

    // Возвращаем успешный ответ с данными созданного сайта
    return {
      success: true,
      message: 'Сайт успешно добавлен',
      data: newSite,
    };
  } catch (error) {
    // Обработка ошибок валидации Зод
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: {
          errors: fieldErrors,
        },
      });
    }

    // Обработка других ошибок
    if (error instanceof Error) {
      throw createError({
        statusCode: 400,
        statusMessage: error.message,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Неизвестная ошибка при добавлении сайта',
    });
  }
});
