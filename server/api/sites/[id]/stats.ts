import { desc, eq } from 'drizzle-orm';
import { checks } from '../../../database/schema';

/**
 * GET /api/sites/:id/stats
 *
 * Возвращает последние 50 проверок для указанного сайта,
 * отсортированных по времени (от новых к старым).
 * Используется для построения графиков статистики.
 */
export default defineEventHandler(async (event) => {
  const siteId = Number(getRouterParam(event, 'id'));

  // Валидация ID
  if (!siteId || isNaN(siteId)) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный ID сайта',
    });
  }

  // Получаем последние 30 проверок, отсортированных по timestamp (от новых к старым)
  const results = await db
    .select()
    .from(checks)
    .where(eq(checks.siteId, siteId))
    .orderBy(desc(checks.timestamp))
    .limit(30);

  // Возвращаем в обратном порядке (от старых к новым) для графиков
  return results.reverse();
});
