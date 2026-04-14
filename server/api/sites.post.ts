import { defineEventHandler, readBody } from 'h3';
import { z } from 'zod';
import { db } from '../utils/db';
import { sites } from '../database/schema';
import { invalidateSitesCache } from '../utils/cache';
import { assertNotPrivateUrl } from '../utils/ssrf';

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
    const body = await readBody(event);
    const validatedData = createSiteSchema.parse(body);
    assertNotPrivateUrl(validatedData.url);

    const [newSite] = await db
      .insert(sites)
      .values({
        name: validatedData.name,
        url: validatedData.url,
        interval: validatedData.interval || 60,
        isActive: 1,
      })
      .returning();

    await invalidateSitesCache();

    return {
      success: true,
      message: 'Сайт успешно добавлен',
      data: newSite,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: {
          errors: error.issues,
        },
      });
    }

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
