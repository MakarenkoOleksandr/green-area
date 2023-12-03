const { Markup } = require("telegraf");
const products = require("./catalog");

let cart = {};

function openGoods(ctx, name) {
  const categoryProducts = products[name];
  categoryProducts.forEach((product) => {
    const inlineKeyboard = Markup.inlineKeyboard([
      Markup.button.callback(
        "1️⃣",
        `addToCart_${product.name}_1_${product.price}`
      ),
      Markup.button.callback(
        "2️⃣",
        `addToCart_${product.name}_2_${product.price}`
      ),
      Markup.button.callback(
        "3️⃣",
        `addToCart_${product.name}_3_${product.price}`
      ),
      Markup.button.callback(
        "5️⃣",
        `addToCart_${product.name}_5_${product.price}`
      ),
      Markup.button.callback(
        "🔟",
        `addToCart_${product.name}_10_${product.price}`
      ),
    ]);
    if (name === "Трава") {
      const content = `<b>🛍 ${product.name}</b>\n${product.happy}\n${product.power}\n\n💵 ${product.price}\n\nДобавить в корзину гр:`;
      ctx.replyWithHTML(content, inlineKeyboard);
    } else {
      const content = `<b>🛍 ${product.name}</b>\n${product.happy}\n${product.power}\n\n💵 ${product.price}\n\nДобавить в корзину шт:`;
      ctx.replyWithHTML(content, inlineKeyboard);
    }
  });
}

function sendForm(ctx) {
  const content = getCartContent(ctx, "check");
  if (Object.keys(content).length > 0) {
    ctx.reply("Send me your number please", {
      reply_markup: {
        keyboard: [[{ text: "📲 Send phone number", request_contact: true }]],
      },
    });
  } else {
    ctx.reply("Вы не можете оформить заказ с пустой корзиной!");
  }
}

function addToCart(productName, count, price) {
  const setPrice = parseFloat(price.replace(/\$/g, ""));
  if (!cart[productName]) {
    cart[productName] = {
      count: 0,
      total: 0,
    };
  }

  cart[productName].count += parseInt(count, 10);
  cart[productName].total += parseInt(count, 10) * parseFloat(setPrice);
}

function getCartContent(ctx, data) {
  let content = "";

  if (data === "add") {
    let totalOrderAmount = 0;

    for (const productName in cart) {
      const count = cart[productName].count;
      totalOrderAmount += cart[productName].total;
      const category = getCategoryByName(productName);

      if (category === "Трава") {
        content += `🛍: ${productName}\n🗂: ${count} гр\n💵: $${cart[
          productName
        ].total.toFixed(2)}\n\n`;
      } else {
        content += `🛍: ${productName}\n🗂: ${count} шт\n💵: $${cart[
          productName
        ].total.toFixed(2)}\n\n`;
      }
    }

    content += `Итого: $${totalOrderAmount.toFixed(2)}`;
  } else if (data === "clear") {
    cart = {}; // Очистить корзину
    content = "Корзина очищена.";
    ctx.reply(content);
  } else {
    return cart;
  }

  return content || "Корзина пуста";
}

function getCategoryByName(productName) {
  for (const category in products) {
    const categoryProducts = products[category];
    const foundProduct = categoryProducts.find(
      (product) => product.name === productName
    );
    if (foundProduct) {
      return category;
    }
  }
  return null; // Если товар не найден в каталоге
}

function requestPaymentMethod(ctx) {
  const inlineKeyboard = Markup.inlineKeyboard([
    Markup.button.callback("Картой", "paymentCard"),
    Markup.button.callback("Наличными", "paymentCash"),
  ]);

  ctx.reply("Пожалуйста укажите удобный для вас способ оплаты", inlineKeyboard);
}

module.exports = {
  openGoods,
  sendForm,
  addToCart,
  getCartContent,
  requestPaymentMethod,
};
