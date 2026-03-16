// server/tasks/monitor.ts
import { lt, eq, desc } from 'drizzle-orm';
import { db } from '../utils/db';
import { sites, checks } from '../database/schema';
import { sendTelegramMessage } from '../utils/telegram';

/**
 * Определяет, является ли статус успешным (сайт работает нормально).
 * @param status - HTTP статус код (0 означает сетевую ошибку)
 */
function isStatusOk(status: number): boolean {
  // Статус 200-299 считается успешным, 0 - сетевая ошибка
  return status >= 200 && status < 300;
}

/**
 * Проверяет один сайт и записывает результат в БД.
 * Использует $fetch.raw, чтобы получить полный объект ответа с HTTP-статусом
 * без выброса исключения на 4xx/5xx — статус всегда проверяется явно.
 * Отправляет уведомление в Telegram при изменении статуса сайта.
 */
async function checkSite(site: typeof sites.$inferSelect): Promise<void> {
  const start = Date.now();

  // Получаем последнюю проверку этого сайта из БД для сравнения статуса
  const previousCheck = await db.query.checks.findFirst({
    where: eq(checks.siteId, site.id),
    orderBy: [desc(checks.timestamp)],
  });

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

    // Записываем результат проверки в БД
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

    // Проверяем изменение статуса и отправляем уведомление в Telegram
    const currentOk = isStatusOk(httpStatus);
    const previousOk = previousCheck ? isStatusOk(previousCheck.status) : null;

    // Если статус изменился (был OK -> стал ошибка, или была ошибка -> стал OK)
    if (previousOk !== null && previousOk !== currentOk) {
      if (!currentOk) {
        // Сайт упал
        const message =
          `🚨 <b>Сайт недоступен!</b>\n\n` +
          `📍 ${site.name}\n` +
          `🔗 ${site.url}\n` +
          `❌ Статус: ${httpStatus}${errorMessage ? `\n📝 ${errorMessage}` : ''}\n` +
          `⏱ Время ответа: ${duration}мс`;
        await sendTelegramMessage(message);
      } else {
        // Сайт восстановился
        const message =
          `✅ <b>Сайт восстановлен!</b>\n\n` +
          `📍 ${site.name}\n` +
          `🔗 ${site.url}\n` +
          `✓ Статус: ${httpStatus}\n` +
          `⏱ Время ответа: ${duration}мс`;
        await sendTelegramMessage(message);
      }
    }
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

    // Записываем результат проверки с ошибкой в БД
    await db.insert(checks).values({
      siteId: site.id,
      status: 0, // 0 означает отсутствие HTTP-ответа (сетевая ошибка)
      responseTime: duration,
      error: errorMessage,
      timestamp: Date.now(),
      createdAt: Date.now(),
    });

    console.log(`❌ ${site.name}: ${errorMessage}`);

    // Проверяем изменение статуса и отправляем уведомление в Telegram
    const currentOk = false; // Сетевая ошибка = сайт недоступен
    const previousOk = previousCheck ? isStatusOk(previousCheck.status) : null;

    // Если ранее сайт был доступен, а теперь упал
    if (previousOk === true && !currentOk) {
      const message =
        `🚨 <b>Сайт недоступен!</b>\n\n` +
        `📍 ${site.name}\n` +
        `🔗 ${site.url}\n` +
        `❌ Ошибка: ${errorMessage}\n` +
        `⏱ Время ответа: ${duration}мс`;
      await sendTelegramMessage(message);
    }
  }
}

export default defineTask({
  async run() {
    // Проверка: мониторинг можно отключить через MONITOR_ENABLED=false
    if (process.env.MONITOR_ENABLED === 'false') {
      console.log('[Monitor] Мониторинг отключен через MONITOR_ENABLED=false');
      return { success: true, skipped: true, reason: 'disabled' };
    }

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

    // 4. Очищаем старые данные (старше 7 дней)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    await db.delete(checks).where(lt(checks.timestamp, sevenDaysAgo));
    console.log('🧹 Старые записи (>7 дней) удалены');

    // 5. Формируем snapshot текущего состояния всех сайтов для кэширования
    const sitesWithStatus = await db.query.sites.findMany({
      where: (sites, { isNull }) => isNull(sites.deletedAt),
      with: {
        checks: {
          orderBy: (check, { desc }) => desc(check.timestamp),
          limit: 1,
        },
      },
    });

    // Сохраняем snapshot в Nitro Storage для быстрого доступа
    const storage = useStorage('cache');
    await storage.setItem('sites:status', sitesWithStatus);
    console.log('💾 Кэш статусов сайтов обновлен');

    return { result: 'Осмотр территории завершен' };
  },
});
