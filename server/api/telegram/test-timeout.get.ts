/**
 * Тестовый эндпоинт для симуляции уведомления о сетевой ошибке (таймаут, DNS и т.д.).
 * Отправляет тестовое сообщение в формате реального уведомления о сетевой проблеме.
 *
 * Использование: GET /api/telegram/test-timeout
 */
export default defineEventHandler(async (event) => {
  // Симулируем данные сайта с сетевой ошибкой
  const testSiteTimeout = {
    name: 'Example.com (ТЕСТ)',
    url: 'https://example.com',
    error: 'Timeout',
    responseTime: 10000,
  };

  // Формируем сообщение о сетевой ошибке (как в monitor.ts)
  const message =
    `🚨 <b>Сайт недоступен!</b>\n\n` +
    `📍 ${testSiteTimeout.name}\n` +
    `🔗 ${testSiteTimeout.url}\n` +
    `❌ Ошибка: ${testSiteTimeout.error}\n` +
    `⏱ Время ответа: ${testSiteTimeout.responseTime}мс`;

  const success = await sendTelegramMessage(message);

  if (!success) {
    return {
      success: false,
      message: 'Ошибка отправки сообщения. Проверьте логи сервера.',
      hint: 'Убедитесь, что TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID настроены правильно в .env',
    };
  }

  return {
    success: true,
    message: '🚨 Тестовое уведомление о таймауте отправлено в Telegram!',
    sent_data: testSiteTimeout,
  };
});
