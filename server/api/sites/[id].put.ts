import { getRouterParam, readBody } from 'h3';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../utils/db';
import { sites } from '../../database/schema';

// Схема частичного обновления — все поля необязательны
const updateSiteSchema = z.object({
  name: z
    .string()
    .min(3, 'Название должно быть не менее 3 символов')
    .max(100, 'Название не должно превышать 100 символов')
    .optional(),
  url: z.string().url('Некорректный URL').optional(),
  interval: z
    .number()
    .int()
    .min(30, 'Интервал должен быть не менее 30 секунд')
    .optional(),
  isActive: z.number().int().min(0).max(1).optional(),
});

/**
 * PUT /api/sites/:id
 * Обновляет параметры существующего сайта
 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));

  if (!Number.isFinite(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Некорректный ID сайта',
    });
  }

  const body = await readBody(event);
  const parsed = updateSiteSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: { errors: parsed.error.issues },
    });
  }

  // SSRF-проверка нового URL, если он был передан
  if (parsed.data.url) {
    assertNotPrivateUrl(parsed.data.url);
  }

  const existing = await db.query.sites.findFirst({
    where: (s, { eq }) => eq(s.id, id),
  });

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Сайт не найден' });
  }

  const [updated] = await db
    .update(sites)
    .set(parsed.data)
    .where(eq(sites.id, id))
    .returning();

  return { success: true, data: updated };
});
