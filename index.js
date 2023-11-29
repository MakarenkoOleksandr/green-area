const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot("6987337400:AAHp2b4E7CngidB0nBFOqix6xW2rmQMp59E", {
  polling: true,
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const keyboard = {
    reply_markup: {
      keyboard: [["🛒 Каталог товаров", "ℹ️ О нас"], ["📞 Контакты"]],
      resize_keyboard: true,
    },
  };

  bot.sendMessage(
    chatId,
    `Привет! Добро пожаловать в наш магазин. Как я могу помочь?`,
    keyboard
  );
});

bot.onText(/🛒 Каталог товаров/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Каталог товаров: ...");
});

bot.onText(/ℹ️ О нас/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "О нас: ...");
});

bot.onText(/📞 Контакты/, (msg) => {
  const chatId = msg.chat.id;
  // Добавь свой код для отображения контактов
  bot.sendMessage(chatId, "Контакты: ...");
});
