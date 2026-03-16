import { getRouterParam } from 'h3';

/**
 * GET /api/sites/:id
 * Возвращает данные сайта вместе с последними 30 проверками (по убыванию времени).
 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));

  if (!Number.isFinite(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Некорректный ID сайта',
    });
  }

  const site = await db.query.sites.findFirst({
    // Не показываем мягко удалённые сайты
    where: (s, { eq, isNull, and }) => and(eq(s.id, id), isNull(s.deletedAt)),
    with: {
      // Последние 30 проверок — достаточно для графика и таблицы истории
      checks: {
        orderBy: (c, { desc }) => desc(c.timestamp),
        limit: 30,
      },
    },
  });

  if (!site) {
    throw createError({ statusCode: 404, statusMessage: 'Сайт не найден' });
  }

  return site;
});
