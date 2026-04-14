export async function sendTelegramMessage(text: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn(
      '⚠️ Telegram не настроен: отсутствует TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID',
    );
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await $fetch(url, {
      method: 'POST',
      body: {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      },
    });

    console.log('✅ Telegram уведомление отправлено');
    return true;
  } catch (error: any) {
    console.error('❌ Ошибка отправки Telegram уведомления:', error);

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
