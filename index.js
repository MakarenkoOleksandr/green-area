const { Telegraf, Markup, session } = require("telegraf");
require("dotenv").config();
const fs = require("fs");
const request = require("request");
const token = process.env.BOT_TOKEN;

const bot = new Telegraf(token);
bot.use(session());

bot.use((ctx, next) => {
  ctx.session = ctx.session || {};
  next();
});
// Variables
let cart = {};
let orderFormData = {};
let { orderNumber, orders, saveOrdersToFile } = require("./modules/orders");
const products = require("./modules/catalog");

bot.command("start", (ctx) => {
  const inlineKeyboard = Markup.inlineKeyboard([
    Markup.button.callback("RU", "ru"),
    Markup.button.callback("EN", "en"),
  ]);
  ctx.reply("🌐", inlineKeyboard);
});

bot.action("ru", (ctx) => {});
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
    ctx.reply("Введите свой контакт (например, номер телефона):");
    ctx.session.enableContactInput = true;
  } else {
    ctx.reply("Вы не можете оформить заказ с пустой корзиной!");
  }
}

function handleContactInput(ctx) {
  if (ctx.session.enableContactInput) {
    const contact = ctx.message.text;
    orderFormData.contact = { phone_number: contact };
    requestReceivingMethod(ctx);
    ctx.session.enableContactInput = false;
  }
}

function handleDeliveryAddress(ctx) {
  if (ctx.session.enableDeliveryAddress) {
    const address = ctx.message.text;
    orderFormData.address = address;
    ctx.session.enableDeliveryAddress = false;
    requestPaymentMethod(ctx);
  }
}

function handleAttachFile(ctx) {
  if (ctx.session.attachBill) {
    const photoInfo = ctx.message.photo[ctx.message.photo.length - 1];
    bot.telegram.getFile(photoInfo.file_id).then((fileInfo) => {
      const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
      const fileStream = fs.createWriteStream(fileInfo.file_path);
      request(fileUrl).pipe(fileStream);

      // Событие 'finish' произойдет, когда скачивание завершится
      fileStream.on("finish", () => {
        ctx.session.attachBill = false;
        bot.telegram.sendPhoto("-1001908353411", {
          source: `${fileInfo.file_path}`,
        });
        orderInfo(ctx);
      });

      // Скачиваем файл
    });
  }
}

function requestReceivingMethod(ctx) {
  const inlineKeyboard = Markup.inlineKeyboard([
    Markup.button.callback("Самовывоз", "pickup"),
    Markup.button.callback("Доставка", "delivery"),
  ]);

  ctx.reply("Как вы хотите получить заказ", inlineKeyboard);
}

function requestDeliveryAddress(ctx) {
  ctx.session.enableDeliveryAddress = true;
  ctx.reply("Введите адрес доставки");
}

function requestPaymentMethod(ctx) {
  const inlineKeyboard = Markup.inlineKeyboard([
    Markup.button.callback("Картой", "paymentCard"),
    Markup.button.callback("Наличными", "paymentCash"),
  ]);

  ctx.reply("Пожалуйста укажите удобный для вас способ оплаты", inlineKeyboard);
}

function orderInfo(ctx) {
  const total = getCartContent(ctx, "add");
  const orderData = `Заказ #️⃣ ${orderNumber}\n\n ${total}\n\n`;
  ctx.reply(`${orderData} ☑️ Успешно сформирован`);

  const order = {
    order: orderNumber,
    cart: total,
    contact: orderFormData.contact,
    address: orderFormData.address,
    bill: orderFormData.bill,
    payment: orderFormData.paymentMethod,
  };

  orders.push(order);
  saveOrdersToFile();

  const keyboard = mainMenu();
  ctx.reply("Чем еще могу помочь?", keyboard);

  const message = `Новый заказ!!!\n\n ${orderData}\n Связь с клиентом: ${orderFormData.contact.phone_number}\n Способ получения: ${orderFormData.address}\n Способ оплаты: ${orderFormData.paymentMethod}`;
  ctx.telegram.sendMessage("-1001908353411", message);
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

bot.action("pickup", (ctx) => {
  orderFormData.address = "Самовывоз";
  requestPaymentMethod(ctx);
  ctx.answerCbQuery("Переходим к выбору оплаты");
});

bot.action("delivery", (ctx) => {
  requestDeliveryAddress(ctx);
});

bot.action("paymentCash", (ctx) => {
  orderFormData.paymentMethod = "Наличка";
  orderInfo(ctx);
});

bot.action("paymentCard", (ctx) => {
  orderFormData.paymentMethod = "Карта";
  getQrCode(ctx);
});

function getQrCode(ctx) {
  ctx.replyWithPhoto(
    { source: "./img/1.jpg" },
    { caption: "Ваш QR-код для оплаты" }
  );
  ctx.session.attachBill = true;
  ctx.reply("Как совершите оплату, прикрепите квитанцию в чат");
}

bot.use((ctx, next) => {
  if (ctx.message && ctx.message.text) {
    if (ctx.session.enableContactInput === true) {
      handleContactInput(ctx);
    } else if (ctx.session.enableDeliveryAddress === true) {
      handleDeliveryAddress(ctx);
    }
  } else {
    handleAttachFile(ctx);
  }
  next();
});

bot.launch();
