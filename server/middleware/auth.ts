/**
 * Server middleware для защиты API эндпоинтов.
 * Проверяет наличие активной сессии пользователя для всех API запросов,
 * кроме публичных эндпоинтов (auth и status).
 */
export default defineEventHandler(async (event) => {
  const path = event.path;

  // Пропускаем публичные эндпоинты и внутренние эндпоинты nuxt-auth-utils
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/status',
    '/api/_auth/session', // Эндпоинт для проверки сессии от nuxt-auth-utils
  ];

  // Пропускаем публичные префиксы путей (для динамических эндпоинтов)
  const publicPathPrefixes = [
    '/api/_nuxt_icon/', // Эндпоинты для загрузки иконок от Nuxt UI
  ];

  // Проверяем точное совпадение пути
  if (publicPaths.includes(path)) {
    return;
  }

  // Проверяем совпадение по префиксу
  if (publicPathPrefixes.some((prefix) => path.startsWith(prefix))) {
    return;
  }

  // Проверяем авторизацию для всех остальных API эндпоинтов
  if (path.startsWith('/api/')) {
    const session = await getUserSession(event);

    // Если сессии нет, возвращаем 401
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Необходима авторизация',
      });
    }
  }
});
