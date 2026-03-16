/**
 * Тестовый эндпоинт для симуляции уведомления о падении сайта.
 * Отправляет тестовое сообщение в формате реального уведомления о проблеме.
 *
 * Использование: GET /api/telegram/test-alert
 */
export default defineEventHandler(async (event) => {
  // Симулируем данные упавшего сайта
  const testSiteDown = {
    name: 'Example.com (ТЕСТ)',
    url: 'https://example.com',
    status: 500,
    error: 'HTTP 500: Internal Server Error',
    responseTime: 5234,
  };

  // Формируем сообщение о падении сайта (как в monitor.ts)
  const message =
    `🚨 <b>Сайт недоступен!</b>\n\n` +
    `📍 ${testSiteDown.name}\n` +
    `🔗 ${testSiteDown.url}\n` +
    `❌ Статус: ${testSiteDown.status}\n` +
    `📝 ${testSiteDown.error}\n` +
    `⏱ Время ответа: ${testSiteDown.responseTime}мс`;

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
    message: '🚨 Тестовое уведомление о падении сайта отправлено в Telegram!',
    sent_data: testSiteDown,
  };
});
