/**
 * POST эндпоинт для входа в систему.
 * Проверяет пароль из тела запроса и создает сессию при успешной аутентификации.
 */
export default defineEventHandler(async (event) => {
  // Читаем пароль из тела запроса
  const body = await readBody(event);
  const { password } = body;

  // Получаем пароль администратора из переменных окружения
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Проверяем наличие пароля в запросе
  if (!password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Пароль обязателен',
    });
  }

  // Проверяем, что пароль администратора настроен
  if (!adminPassword) {
    throw createError({
      statusCode: 500,
      statusMessage: 'ADMIN_PASSWORD не настроен',
    });
  }

  // Проверяем совпадение пароля
  if (password !== adminPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Неверный пароль',
    });
  }

  // Создаем сессию пользователя
  await setUserSession(event, {
    user: {
      name: 'Admin',
    },
  });

  return { success: true, message: 'Вход выполнен успешно' };
});
