const { Markup } = require("telegraf");
const products = require("./catalog");
const { getCartContent } = require("./functions");

function mainMenu() {
  return Markup.keyboard([["📁 Каталог товаров"], ["🛒 Корзина"]]).resize();
}

function startMenu(bot) {
  bot.command("start", (ctx) => {
    const keyboard = mainMenu();
    ctx.reply(
      `Привет! Добро пожаловать в наш магазин. Как я могу помочь?`,
      keyboard
    );
  });
}

function setupMenu(bot) {
  bot.hears("📁 Каталог товаров", (ctx) => {
    const inlineKeyboard = Markup.inlineKeyboard(
      Object.keys(products).map((category) =>
        Markup.button.callback(`${category} 🔽`, `openGoods_${category}`)
      )
    );
    ctx.reply("Выберите категорию:", inlineKeyboard);
  });

  bot.hears("🛒 Корзина", (ctx) => {
    const inlineKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Оформить заказ", "sendForm"),
      Markup.button.callback("Очистить корзину", "clearCart"),
    ]);
    const cartContent = getCartContent(ctx, "add");
    ctx.replyWithHTML(
      `<b>🛒 Ваша корзина:</b>\n\n${cartContent}`,
      inlineKeyboard
    );
  });
}

module.exports = { startMenu, mainMenu, setupMenu };
