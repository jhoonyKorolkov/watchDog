import { invalidateSitesCache } from '../../utils/cache';

/**
 * POST эндпоинт для ручной очистки кэша статусов сайтов.
 * Полезен для тестирования и отладки системы кэширования.
 *
 * Использование: POST /api/cache/clear
 */
export default defineEventHandler(async (event) => {
  await invalidateSitesCache();

  return {
    success: true,
    message: 'Кэш успешно очищен',
    hint: 'Следующий запрос к /api/status будет получать данные из БД и обновит кэш.',
  };
});
