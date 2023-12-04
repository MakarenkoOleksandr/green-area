const { Telegraf, Markup } = require("telegraf");
require("dotenv").config();

const token = process.env.BOT_TOKEN;
const bot = new Telegraf(token);

// Variables
let cart = {};
let orderFormData = {};
let { orderNumber, orders, saveOrdersToFile } = require("./modules/orders");
const products = require("./modules/catalog");

function mainMenu() {
  return Markup.keyboard([["📁 Каталог товаров"], ["🛒 Корзина"]]).resize();
}

bot.command("start", (ctx) => {
  const keyboard = mainMenu();
  ctx.reply(
    `Привет! Добро пожаловать в наш магазин. Как я могу помочь?`,
    keyboard
  );
});

// Main menu
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

// Catalog__categories goods extends category name

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
    ctx.reply("Отправьте пожалуйста свой контакт", {
      reply_markup: {
        keyboard: [[{ text: "📲 Send phone number", request_contact: true }]],
      },
    });
  } else {
    ctx.reply("Вы не можете оформить заказ с пустой корзиной!");
  }
}

function requestPaymentMethod(ctx) {
  mainMenu();
  const inlineKeyboard = Markup.inlineKeyboard([
    Markup.button.callback("Картой", "paymentCard"),
    Markup.button.callback("Наличными", "paymentCash"),
  ]);

  ctx.reply("Пожалуйста укажите удобный для вас способ оплаты", inlineKeyboard);
}

// Cart
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
        const total = cart[productName].total.toFixed(2);
        content += `🛍: ${productName}\n🗂: ${count} шт\n💵: $${total}\n\n`;
      }
    }
    content += `Итого: $${totalOrderAmount.toFixed(2)}`;
    return content;
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

bot.action(/openGoods_(.+)/, (ctx) => {
  const [, category] = ctx.match;
  openGoods(ctx, category);
  ctx.answerCbQuery(`Переходим в ${category}`);
});

bot.action(/addToCart_(.+)_(.+)_(.+)/, (ctx) => {
  const [, name, count, price] = ctx.match;
  addToCart(`${name}`, `${count}`, `${price}`);
  ctx.answerCbQuery(`${name} добавлен в корзину в количестве ${count}`);
});

bot.action("sendForm", (ctx) => {
  sendForm(ctx);
  ctx.answerCbQuery("Переходим к оформлению заказа");
});

bot.action("clearCart", (ctx) => {
  getCartContent(ctx, "clear");
});

bot.use((ctx, next) => {
  if (ctx.update.message && ctx.update.message.contact) {
    orderFormData.contact = ctx.update.message.contact;
    requestPaymentMethod(ctx);
  } else if (ctx.update.callback_query) {
    orderFormData.paymentMethod = ctx.update.callback_query.data;

    // Добавить код для оплаты картой

    const total = getCartContent(ctx, "add");
    const orderData = `Заказ #️⃣ ${orderNumber}\n\n ${total}\n\n`;
    ctx.reply(`${orderData} ☑️ Успешно сформирован`);

    const order = {
      order: orderNumber,
      cart: total,
      contact: orderFormData.contact,
      payment: orderFormData.paymentMethod,
    };

    orders.push(order);
    saveOrdersToFile();

    const keyboard = mainMenu();
    ctx.reply("Чем еще могу помочь?", keyboard);

    const message = `Новый заказ!!!\n\n ${orderData}\n ${orderFormData.contact.phone_number}\n ${orderFormData.paymentMethod}`;
    ctx.telegram.sendMessage("-1001908353411", message);
  }
  next();
});

bot.launch();
// bot.command("start", (ctx) => {
//   const inlineKeyboard = Markup.inlineKeyboard([
//     Markup.button.callback("RU", "ru"),
//     Markup.button.callback("EN", "en"),
//   ]);
//   ctx.reply("🌐", inlineKeyboard);
// });
