/**
 * GET эндпоинт для получения списка всех сайтов с их последней проверкой.
 * Использует кэширование через Nitro Storage для оптимизации производительности.
 */
export default defineEventHandler(async (event) => {
  // Пытаемся получить данные из кэша
  const storage = useStorage('cache');
  const cachedData = await storage.getItem('sites:status');

  // Если данные в кэше есть - возвращаем их немедленно
  if (cachedData) {
    console.log('✅ Данные получены из кэша');
    return cachedData;
  }

  // Если кэша нет - делаем запрос в БД
  console.log('📊 Данные из БД (кэш пуст)');
  const sites = await db.query.sites.findMany({
    // Исключаем мягко удалённые сайты (deletedAt != null)
    where: (site, { isNull }) => isNull(site.deletedAt),
    with: {
      checks: {
        orderBy: (check, { desc }) => desc(check.timestamp),
        limit: 1,
      },
    },
  });

  // Сохраняем результат в кэш для следующего раза
  await storage.setItem('sites:status', sites);
  console.log('💾 Результат сохранен в кэш');

  return sites;
});
