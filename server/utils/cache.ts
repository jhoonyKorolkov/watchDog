/**
 * Утилита для инвалидации кэша статусов сайтов.
 * Вызывается при любых изменениях данных сайтов (создание, удаление, обновление).
 */
export async function invalidateSitesCache() {
  try {
    const storage = useStorage('data');
    await storage.removeItem('sites:status');
    console.log('🗑️ Кэш статусов сайтов инвалидирован');
  } catch (error) {
    console.error('❌ Ошибка инвалидации кэша:', error);
  }
}
