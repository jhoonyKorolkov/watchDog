/**
 * Утилита для отправки уведомлений в Telegram.
 * Использует Telegram Bot API для отправки сообщений в указанный чат.
 */

/**
 * Отправляет сообщение в Telegram чат через Telegram Bot API.
 *
 * @param text - Текст сообщения для отправки
 * @returns Promise<boolean> - true если сообщение успешно отправлено, false в случае ошибки
 *
 * @example
 * await sendTelegramMessage('🚨 Сайт example.com недоступен!');
 */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  // Получаем токен бота и ID чата из переменных окружения
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Проверяем, что переменные окружения настроены
  if (!botToken || !chatId) {
    console.warn(
      '⚠️ Telegram не настроен: отсутствует TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID',
    );
    return false;
  }

  try {
    // Формируем URL для Telegram Bot API
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    // Отправляем POST запрос с текстом сообщения
    const response = await $fetch(url, {
      method: 'POST',
      body: {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML', // Поддержка HTML форматирования в сообщениях
      },
    });

    console.log('✅ Telegram уведомление отправлено');
    return true;
  } catch (error: any) {
    // Логируем ошибку с детализацией
    console.error('❌ Ошибка отправки Telegram уведомления:', error);

    // Более понятные сообщения об ошибках
    if (error.status === 403 || error.statusCode === 403) {
      console.error(
        '\n⚠️  ОШИБКА 403: Бот не может отправить сообщение в этот чат.\n' +
          '   Возможные причины:\n' +
          '   1. Неправильный TELEGRAM_CHAT_ID (сейчас: ' +
          chatId +
          ')\n' +
          '   2. Вы не начали разговор с ботом (отправьте /start боту)\n' +
          '   3. Бот заблокирован пользователем\n' +
          '\n   Как получить правильный chat_id:\n' +
          '   1. Откройте бота в Telegram и отправьте любое сообщение\n' +
          '   2. Откройте в браузере: http://localhost:3000/api/telegram/get-chat-id\n' +
          '   3. Скопируйте ваш chat_id и обновите .env файл\n',
      );
    } else if (error.status === 401 || error.statusCode === 401) {
      console.error(
        '\n⚠️  ОШИБКА 401: Неверный TELEGRAM_BOT_TOKEN.\n' +
          '   Проверьте токен бота в .env файле.\n',
      );
    }

    return false;
  }
}

/**
 * Получает последние обновления от Telegram бота.
 * Используется для получения chat_id пользователя.
 *
 * @returns Promise с информацией о последних сообщениях
 */
export async function getTelegramUpdates() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN не настроен');
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/getUpdates`;
    const response = await $fetch(url);
    return response;
  } catch (error) {
    console.error('Ошибка получения обновлений Telegram:', error);
    throw error;
  }
}
