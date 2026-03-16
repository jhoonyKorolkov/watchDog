/**
 * GET эндпоинт для просмотра содержимого кэша статусов сайтов.
 * Показывает текущие закешированные данные и метаинформацию.
 *
 * Использование: GET /api/cache/status
 */
export default defineEventHandler(async (event) => {
  const storage = useStorage('data');

  // Получаем данные из кэша
  const cachedData = await storage.getItem('sites:status');

  if (!cachedData) {
    return {
      cached: false,
      message:
        'Кэш пуст. Данные будут закешированы после первой проверки монитора.',
      hint: 'Монитор запускается каждую минуту и автоматически обновляет кэш.',
    };
  }

  // Подсчитываем статистику
  const sites = cachedData as any[];
  const stats = {
    totalSites: sites.length,
    activeSites: sites.filter((s) => s.isActive === 1).length,
    inactiveSites: sites.filter((s) => s.isActive === 0).length,
    sitesWithChecks: sites.filter((s) => s.checks && s.checks.length > 0)
      .length,
  };

  return {
    cached: true,
    message: 'Данные получены из кэша',
    stats,
    data: cachedData,
    cacheKey: 'sites:status',
  };
});
