/**
 * GET эндпоинт для просмотра всех ключей в кэше.
 * Показывает список всех закешированных данных в Nitro Storage.
 *
 * Использование: GET /api/cache/keys
 */
export default defineEventHandler(async (event) => {
  const storage = useStorage('data');

  // Получаем все ключи в хранилище
  const keys = await storage.getKeys();

  if (!keys || keys.length === 0) {
    return {
      success: true,
      message: 'Кэш пуст',
      keys: [],
      count: 0,
    };
  }

  // Получаем метаданные для каждого ключа
  const keysWithMeta = await Promise.all(
    keys.map(async (key) => {
      const meta = await storage.getMeta(key);
      return {
        key,
        meta: meta || null,
      };
    }),
  );

  return {
    success: true,
    message: `Найдено ключей: ${keys.length}`,
    keys: keysWithMeta,
    count: keys.length,
  };
});
