const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot("6987337400:AAHp2b4E7CngidB0nBFOqix6xW2rmQMp59E", {
  polling: true,
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Привет! Я твой бот.");
});
