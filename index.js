const { Telegraf, Markup } = require("telegraf");
require("dotenv").config();

const token = process.env.BOT_TOKEN;
const bot = new Telegraf(token);

const { rus } = require("./modules/ru");

// Start-menu
bot.command("start", (ctx) => {
  const inlineKeyboard = Markup.inlineKeyboard([
    Markup.button.callback("RU", "ru"),
    Markup.button.callback("EN", "en"),
  ]);
  ctx.reply("🌐", inlineKeyboard);
});

bot.action("ru", (ctx) => {
  rus(ctx);
  ctx.answerCbQuery("Выбран русский язык");
});

bot.launch();
