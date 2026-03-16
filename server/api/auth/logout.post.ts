/**
 * POST эндпоинт для выхода из системы.
 * Очищает текущую сессию пользователя.
 */
export default defineEventHandler(async (event) => {
  // Очищаем сессию пользователя
  await clearUserSession(event);

  return { success: true, message: 'Выход выполнен успешно' };
});
