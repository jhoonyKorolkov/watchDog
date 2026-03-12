// server/tasks/monitor.ts
import { db } from '../utils/db';
import { sites, checks } from '../database/schema';

/**
 * Проверяет один сайт и записывает результат в БД.
 * Использует $fetch.raw, чтобы получить полный объект ответа с HTTP-статусом
 * без выброса исключения на 4xx/5xx — статус всегда проверяется явно.
 */
async function checkSite(site: typeof sites.$inferSelect): Promise<void> {
  const start = Date.now();

  try {
    // $fetch.raw возвращает FetchResponse с полем .status даже при 4xx/5xx,
    // при этом не бросает исключение — нам это нужно для явной проверки статуса
    const response = await $fetch.raw(site.url, {
      method: 'GET',
      headers: { 'User-Agent': 'WatchDog/1.0' },
      // ignoreResponseError: true — не бросать исключение на статусы >= 400
      ignoreResponseError: true,
      signal: AbortSignal.timeout(10000),
    });

    const duration = Date.now() - start;
    const httpStatus = response.status;

    // Если HTTP-статус >= 400 — фиксируем как ошибку, даже без исключения
    const isError = httpStatus >= 400;
    const errorMessage = isError
      ? `HTTP ${httpStatus}: ${response.statusText || 'Error'}`
      : undefined;

    await db.insert(checks).values({
      siteId: site.id,
      status: httpStatus,
      responseTime: duration,
      error: errorMessage ?? null,
      timestamp: Date.now(),
      createdAt: Date.now(),
    });

    const icon = isError ? '⚠️' : '✅';
    console.log(`${icon} ${site.name}: ${httpStatus} (${duration}ms)`);
  } catch (err: unknown) {
    // Сюда попадаем при сетевых ошибках (таймаут, DNS, ECONNREFUSED и т.д.)
    const duration = Date.now() - start;
    const isAbort =
      err instanceof Error &&
      (err.name === 'AbortError' || err.name === 'TimeoutError');
    const errorMessage = isAbort
      ? 'Timeout'
      : err instanceof Error
        ? err.message
        : 'Unknown error';

    await db.insert(checks).values({
      siteId: site.id,
      status: 0, // 0 означает отсутствие HTTP-ответа (сетевая ошибка)
      responseTime: duration,
      error: errorMessage,
      timestamp: Date.now(),
      createdAt: Date.now(),
    });

    console.log(`❌ ${site.name}: ${errorMessage}`);
  }
}

export default defineTask({
  async run() {
    console.log('Пес вышел на охоту... 🔍');

    // 1. Получаем список активных сайтов из БД, исключая мягко удалённые
    const activeSites = await db.query.sites.findMany({
      where: (sites, { eq, isNull, and }) =>
        and(eq(sites.isActive, 1), isNull(sites.deletedAt)),
    });

    // 2. Запускаем все проверки параллельно через Promise.allSettled,
    //    чтобы падение одного сайта не останавливало проверку остальных
    const results = await Promise.allSettled(
      activeSites.map((site) => checkSite(site)),
    );

    // 3. Считаем итоговую статистику для лога
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(
      `Осмотр завершён: ${succeeded} успешно, ${failed} с ошибкой из ${activeSites.length}`,
    );

    return { result: 'Осмотр территории завершен' };
  },
});
