function openCategory() {
  bot.onText(/📁 Каталог товаров/, (msg) => {
    const chatId = msg.chat.id;
    const addToСart = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Добавить в корзину", callback_data: "add_to_cart_1" }],
        ],
      },
    };
    bot.sendMessage(chatId, catalog, { parse_mode: "HTML", ...addToСart });
  });
}

// Обработка нажатия на кнопку "Добавить в корзину"
bot.on("callback_query", (query) => {
  const productId = query.data.replace("add_to_cart_", "");
  addToCart(productId);
  bot.answerCallbackQuery(query.id, "Товар добавлен в корзину!");
});

// Добавление товара в корзину
function addToCart(productId) {
  if (!cart[productId]) {
    cart[productId] = 0;
  }
  cart[productId]++;
}

// Cart
bot.onText(/🛒 Корзина/, (msg) => {
  const chatId = msg.chat.id;
  const cartContent = getCartContent();
  bot.sendMessage(chatId, `Ваша корзина:\n${cartContent}`);
});

// Получение содержимого корзины
function getCartContent() {
  let content = "";
  for (const productId in cart) {
    content += `Товар ${productId}: ${cart[productId]} шт.\n`;
  }
  return content || "Корзина пуста.";
}
