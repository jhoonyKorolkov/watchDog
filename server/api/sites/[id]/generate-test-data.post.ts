import { checks } from '../../../database/schema';

/**
 * POST /api/sites/:id/generate-test-data
 *
 * Генерирует тестовые данные проверок для визуализации графиков.
 * Создает 50 записей с разными HTTP статусами и временами ответа.
 * ТОЛЬКО ДЛЯ РАЗРАБОТКИ!
 */
export default defineEventHandler(async (event) => {
  // Проверка: эндпоинт доступен только в dev режиме
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 403,
      message: 'Генерация тестовых данных доступна только в режиме разработки',
    });
  }

  const siteId = Number(getRouterParam(event, 'id'));

  // Валидация ID
  if (!siteId || isNaN(siteId)) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный ID сайта',
    });
  }

  // Проверяем, что сайт существует
  const site = await db.query.sites.findFirst({
    where: (s, { eq, isNull, and }) =>
      and(eq(s.id, siteId), isNull(s.deletedAt)),
  });

  if (!site) {
    throw createError({
      statusCode: 404,
      message: 'Сайт не найден',
    });
  }

  // Возможные статусы с разными вероятностями
  const statuses = [
    { code: 200, weight: 60, error: null }, // 60% - успешные
    { code: 201, weight: 5, error: null },
    { code: 301, weight: 5, error: 'Moved Permanently' }, // 5% - редиректы
    { code: 302, weight: 3, error: 'Found' },
    { code: 400, weight: 2, error: 'Bad Request' }, // 2% - клиентские ошибки
    { code: 401, weight: 2, error: 'Unauthorized' },
    { code: 403, weight: 2, error: 'Forbidden' },
    { code: 404, weight: 5, error: 'Not Found' },
    { code: 500, weight: 5, error: 'Internal Server Error' }, // 5% - серверные ошибки
    { code: 502, weight: 3, error: 'Bad Gateway' },
    { code: 503, weight: 3, error: 'Service Unavailable' },
    { code: 0, weight: 5, error: 'Timeout' }, // 5% - таймауты
  ];

  // Функция выбора статуса с учетом весов
  const getRandomStatus = (): (typeof statuses)[number] => {
    const totalWeight = statuses.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;

    for (const status of statuses) {
      random -= status.weight;
      if (random <= 0) return status;
    }
    return statuses[0]!; // Non-null assertion: массив всегда содержит элементы
  };

  // Генерируем 50 записей
  const now = Date.now();
  const recordsToInsert = [];

  for (let i = 0; i < 50; i++) {
    const status = getRandomStatus();
    // Время ответа: быстрее для успешных, медленнее для ошибок
    const baseTime =
      status.code === 0
        ? 10000
        : status.code >= 500
          ? 3000 + Math.random() * 2000
          : status.code >= 400
            ? 1000 + Math.random() * 1000
            : 100 + Math.random() * 400;

    recordsToInsert.push({
      siteId,
      status: status.code,
      responseTime: Math.round(baseTime),
      error: status.error,
      // Распределяем по времени: от 2 часов назад до текущего момента
      timestamp: now - (50 - i) * 144000, // ~2.4 минуты между проверками
      createdAt: now,
    });
  }

  // Вставляем все записи одним запросом
  try {
    await db.insert(checks).values(recordsToInsert);

    return {
      success: true,
      message: `Создано ${recordsToInsert.length} тестовых проверок`,
      stats: {
        total: recordsToInsert.length,
        success: recordsToInsert.filter((r) => r.status > 0 && r.status < 300)
          .length,
        redirects: recordsToInsert.filter(
          (r) => r.status >= 300 && r.status < 400,
        ).length,
        clientErrors: recordsToInsert.filter(
          (r) => r.status >= 400 && r.status < 500,
        ).length,
        serverErrors: recordsToInsert.filter((r) => r.status >= 500).length,
        timeouts: recordsToInsert.filter((r) => r.status === 0).length,
      },
    };
  } catch (insertError) {
    console.error('Ошибка вставки данных:', insertError);
    throw createError({
      statusCode: 500,
      message: 'Ошибка при создании тестовых данных',
    });
  }
});
