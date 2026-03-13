import { getRouterParam, readBody } from 'h3';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../utils/db';
import { sites } from '../../database/schema';

// Схема частичного обновления — все поля необязательны
const updateSiteSchema = z.object({
  isActive: z.number().int().min(0).max(1).optional(),
});

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  const body = await readBody(event);

  const parsedBody = updateSiteSchema.safeParse(body);

  if (!parsedBody.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: { errors: parsedBody.error.issues },
    });
  }

  // Проверяем существование сайта
  const site = await db.query.sites.findFirst({
    where: (s, { eq }) => eq(s.id, Number(id)),
  });

  if (!site) {
    throw createError({ statusCode: 404, statusMessage: 'Сайт не найден' });
  }

  // Обновляем только те поля, которые пришли в запросе
  // Используем Object.entries для фильтрации undefined значений
  const updatedData: Partial<typeof sites.$inferInsert> = {};

  if (parsedBody.data.isActive !== undefined) {
    updatedData.isActive = parsedBody.data.isActive;
  }

  // Обновляем запись в БД
  await db
    .update(sites)
    .set(updatedData)
    .where(eq(sites.id, Number(id)));

  // Возвращаем обновленный сайт
  const updatedSite = await db.query.sites.findFirst({
    where: (s, { eq }) => eq(s.id, Number(id)),
  });

  return { success: true, site: updatedSite };
});
