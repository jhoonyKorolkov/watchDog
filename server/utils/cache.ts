export async function invalidateSitesCache() {
  try {
    const storage = useStorage('cache');
    await storage.removeItem('sites:status');
    console.log('🗑️ Кэш статусов сайтов инвалидирован');
  } catch (error) {
    console.error('❌ Ошибка инвалидации кэша:', error);
  }
}
