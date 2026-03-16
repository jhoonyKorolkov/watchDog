import { getRouterParam } from 'h3';
import { eq } from 'drizzle-orm';
import { sites } from '../../database/schema';
import { invalidateSitesCache } from '../../utils/cache';

/**
 * DELETE /api/sites/:id
 * Выполняет мягкое удаление (soft delete): записывает deletedAt и снимает isActive.
 * Данные проверок сохраняются — их можно восстановить в будущем.
 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));

  if (!Number.isFinite(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Некорректный ID сайта',
    });
  }

  const existing = await db.query.sites.findFirst({
    where: (s, { eq, isNull }) => eq(s.id, id) && isNull(s.deletedAt),
  });

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Сайт не найден' });
  }

  // Помечаем сайт как удалённый: deletedAt = текущее время, isActive = 0.
  // Физического удаления записей не происходит — история проверок сохраняется.
  await db
    .update(sites)
    .set({ deletedAt: Date.now(), isActive: 0 })
    .where(eq(sites.id, id));

  // Инвалидируем кэш после удаления сайта
  await invalidateSitesCache();

  return { success: true, message: 'Сайт перемещён в архив' };
});
