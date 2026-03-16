/**
 * API эндпоинт для получения chat_id из последних сообщений Telegram бота.
 * Помогает пользователю узнать свой chat_id для настройки уведомлений.
 *
 * Как использовать:
 * 1. Откройте вашего бота в Telegram
 * 2. Отправьте любое сообщение боту (например, /start или "Привет")
 * 3. Откройте этот эндпоинт в браузере: http://localhost:3000/api/telegram/get-chat-id
 * 4. Скопируйте chat_id и обновите TELEGRAM_CHAT_ID в .env файле
 */
export default defineEventHandler(async (event) => {
  try {
    const updates: any = await getTelegramUpdates();

    // Если нет обновлений (пользователь не писал боту)
    if (!updates.result || updates.result.length === 0) {
      return {
        success: false,
        message:
          'Не найдено сообщений от пользователей. Отправьте любое сообщение боту в Telegram и попробуйте снова.',
        instructions: [
          '1. Откройте вашего бота в Telegram',
          '2. Отправьте любое сообщение (например, /start)',
          '3. Обновите эту страницу',
        ],
      };
    }

    // Извлекаем уникальные chat_id из всех сообщений
    const chats = new Map();

    for (const update of updates.result) {
      const message =
        update.message || update.edited_message || update.channel_post;
      if (message?.chat) {
        const chatId = message.chat.id;
        const chatInfo = {
          chat_id: chatId,
          type: message.chat.type,
          username: message.chat.username || null,
          first_name: message.chat.first_name || null,
          last_name: message.chat.last_name || null,
          title: message.chat.title || null,
          last_message: message.text || message.caption || '[Медиа]',
        };
        chats.set(chatId, chatInfo);
      }
    }

    const chatList = Array.from(chats.values());

    return {
      success: true,
      message: 'Найдено чатов: ' + chatList.length,
      chats: chatList,
      instructions: [
        'Скопируйте нужный chat_id из списка выше',
        'Обновите .env файл:',
        'TELEGRAM_CHAT_ID=<ваш_chat_id>',
        'Перезапустите сервер',
      ],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Ошибка получения данных',
      instructions: [
        'Проверьте, что TELEGRAM_BOT_TOKEN правильно настроен в .env',
        'Убедитесь, что вы отправили хотя бы одно сообщение боту',
      ],
    };
  }
});
