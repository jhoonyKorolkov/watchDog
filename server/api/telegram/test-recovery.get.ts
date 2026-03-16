/**
 * Тестовый эндпоинт для симуляции уведомления о восстановлении сайта.
 * Отправляет тестовое сообщение в формате реального уведомления о восстановлении.
 *
 * Использование: GET /api/telegram/test-recovery
 */
export default defineEventHandler(async (event) => {
  // Симулируем данные восстановленного сайта
  const testSiteRecovered = {
    name: 'Example.com (ТЕСТ)',
    url: 'https://example.com',
    status: 200,
    responseTime: 234,
  };

  // Формируем сообщение о восстановлении сайта (как в monitor.ts)
  const message =
    `✅ <b>Сайт восстановлен!</b>\n\n` +
    `📍 ${testSiteRecovered.name}\n` +
    `🔗 ${testSiteRecovered.url}\n` +
    `✓ Статус: ${testSiteRecovered.status}\n` +
    `⏱ Время ответа: ${testSiteRecovered.responseTime}мс`;

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
    message:
      '✅ Тестовое уведомление о восстановлении сайта отправлено в Telegram!',
    sent_data: testSiteRecovered,
  };
});
