import { lt, eq, desc } from 'drizzle-orm';
import { db } from '../utils/db';
import { sites, checks } from '../database/schema';
import { sendTelegramMessage } from '../utils/telegram';

function isStatusOk(status: number): boolean {
  return status >= 200 && status < 300;
}

async function checkSite(site: typeof sites.$inferSelect): Promise<void> {
  const start = Date.now();

  const previousCheck = await db.query.checks.findFirst({
    where: eq(checks.siteId, site.id),
    orderBy: [desc(checks.timestamp)],
  });

  try {
    const response = await $fetch.raw(site.url, {
      method: 'GET',
      headers: { 'User-Agent': 'WatchDog/1.0' },
      ignoreResponseError: true,
      signal: AbortSignal.timeout(10000),
    });

    const duration = Date.now() - start;
    const httpStatus = response.status;

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

    const currentOk = isStatusOk(httpStatus);
    const previousOk = previousCheck ? isStatusOk(previousCheck.status) : null;

    if (previousOk !== null && previousOk !== currentOk) {
      if (!currentOk) {
        const message =
          `🚨 <b>Сайт недоступен!</b>\n\n` +
          `📍 ${site.name}\n` +
          `🔗 ${site.url}\n` +
          `❌ Статус: ${httpStatus}${errorMessage ? `\n📝 ${errorMessage}` : ''}\n` +
          `⏱ Время ответа: ${duration}мс`;
        await sendTelegramMessage(message);
      } else {
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
      status: 0,
      responseTime: duration,
      error: errorMessage,
      timestamp: Date.now(),
      createdAt: Date.now(),
    });

    console.log(`❌ ${site.name}: ${errorMessage}`);

    const currentOk = false;
    const previousOk = previousCheck ? isStatusOk(previousCheck.status) : null;

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
    if (process.env.MONITOR_ENABLED === 'false') {
      console.log('[Monitor] Мониторинг отключен через MONITOR_ENABLED=false');
      return { success: true, skipped: true, reason: 'disabled' };
    }

    console.log('Пес вышел на охоту... 🔍');

    const activeSites = await db.query.sites.findMany({
      where: (sites, { eq, isNull, and }) =>
        and(eq(sites.isActive, 1), isNull(sites.deletedAt)),
    });

    const results = await Promise.allSettled(
      activeSites.map((site) => checkSite(site)),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(
      `Осмотр завершён: ${succeeded} успешно, ${failed} с ошибкой из ${activeSites.length}`,
    );

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    await db.delete(checks).where(lt(checks.timestamp, sevenDaysAgo));
    console.log('🧹 Старые записи (>7 дней) удалены');

    const sitesWithStatus = await db.query.sites.findMany({
      where: (sites, { isNull }) => isNull(sites.deletedAt),
      with: {
        checks: {
          orderBy: (check, { desc }) => desc(check.timestamp),
          limit: 1,
        },
      },
    });

    const storage = useStorage('cache');
    await storage.setItem('sites:status', sitesWithStatus);
    console.log('💾 Кэш статусов сайтов обновлен');

    return { result: 'Осмотр территории завершен' };
  },
});
