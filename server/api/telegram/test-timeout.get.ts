import { assertDevelopmentOnly } from '../../utils/dev-only';

export default defineEventHandler(async (event) => {
  assertDevelopmentOnly('Тестовое уведомление Telegram');

  const testSiteTimeout = {
    name: 'Example.com (ТЕСТ)',
    url: 'https://example.com',
    error: 'Timeout',
    responseTime: 10000,
  };

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
