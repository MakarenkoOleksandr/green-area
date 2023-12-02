const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {
  polling: true,
});
// Start-menu
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const keyboard = mainMenu();
  bot.sendMessage(
    chatId,
    `Привет! Добро пожаловать в наш магазин. Как я могу помочь?`,
    keyboard
  );
});

//Variables
let cart = {};
let orderFormData = {};
const products = require("./modules/catalog");

function mainMenu() {
  const keyboard = {
    reply_markup: {
      keyboard: [["📁 Каталог товаров"], ["🛒 Корзина"]],
      resize_keyboard: true,
    },
  };
  return keyboard;
}

// Main menu
bot.onText(/📁 Каталог товаров/, (msg) => {
  const chatId = msg.chat.id;
  const inlineKeyboard = {
    reply_markup: {
      inline_keyboard: Object.keys(products).map((category) => [
        { text: `${category} 🔽`, callback_data: `openGoods_${category}` },
      ]),
    },
  };
  bot.sendMessage(chatId, "Выберите категорию:", inlineKeyboard);
});

bot.onText(/🛒 Корзина/, (msg) => {
  const chatId = msg.chat.id;
  const inlineKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Оформить заказ",
            callback_data: "sendForm",
          },
        ],
        [
          {
            text: "Очистить корзину",
            callback_data: "clearCart",
          },
        ],
      ],
    },
  };
  const cartContent = getCartContent((data = "add"));
  bot.sendMessage(chatId, `Ваша корзина:\n${cartContent}`, inlineKeyboard);
});

// Catalog__categories goods extends category name

function openGoods(chat, name) {
  const categoryProducts = products[name];
  categoryProducts.forEach((product) => {
    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "1️⃣",
              callback_data: `addToCart_1_${name}`,
            },
            {
              text: "2️⃣",
              callback_data: `addToCart_2_${name}`,
            },
            {
              text: "3️⃣",
              callback_data: `addToCart_3_${name}`,
            },
            {
              text: "5️⃣",
              callback_data: `addToCart_5_${name}`,
            },
            {
              text: "🔟",
              callback_data: `addToCart_10_${name}`,
            },
          ],
        ],
      },
    };

    const content = `<b>${product.name}</b>\n<b>Описание:</b> ${product.happy}\n${product.power}\n<b>Цена:</b> ${product.price}\n<img></img>`;

    bot.sendMessage(chat, content, { parse_mode: "HTML", ...inlineKeyboard });
  });
  // `${product.name}\n${product.happy}\n${product.power}\n${product.price}\n\nВыберите сколько хотите:`,
}

function sendForm(chat) {
  const content = getCartContent((data = "check"));
  if (Object.keys(content).length > 0) {
    const formMessage = "Пожалуйста, укажите ваш номер телефона:";
    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Отправить номер телефона",
              callback_data: "sendPhoneNumber",
              request_contact: true,
            },
          ],
        ],
      },
    };
    bot.sendMessage(chat, formMessage, inlineKeyboard);
  } else {
    bot.sendMessage(chat, "Вы не можете оформить заказ с пустой корзиной!");
  }
}
// Cart
function addToCart(productId) {
  if (!cart[productId]) {
    cart[productId] = 0;
  }
  cart[productId]++;
}

function getCartContent(data, chat) {
  let content = "";

  if (data === "add") {
    for (const productId in cart) {
      content += `Товар ${productId}: ${cart[productId]} шт.\n`;
    }
  } else if (data === "clear") {
    cart = {}; // Очистить корзину
    content = "Корзина очищена.";
    bot.sendMessage(chat, `${content}`);
  } else {
    return cart;
  }
  return content || "Корзина пуста";
}

bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const data = query.data.split("_");

  if (data[0] === "openGoods") {
    openGoods(chatId, data[1]);
    bot.answerCallbackQuery(query.id, `Переходим в ${data[1]}`);
  } else if (data[0] === "addToCart") {
    addToCart(data[1]);
    bot.answerCallbackQuery(query.id, `Товар ${data[1]} добавлен в корзину`);
  } else if (data[0] === "sendForm") {
    sendForm(chatId);
    bot.answerCallbackQuery(query.id, "Переходим к оформлению заказа");
  } else if (data[0] === "clearCart") {
    getCartContent("clear", chatId);
  } else if (data[0] === "sendPhoneNumber") {
    requestPaymentMethod(chatId);
  } else if (data[0] === "paymentCard" || data[0] === "paymentCash") {
    orderFormData[chatId] = {
      contact: orderFormData[chatId]?.contact || "Не указан",
      paymentMethod: data[0] === "paymentCard" ? "Картой" : "Наличными",
    };
    bot.answerCallbackQuery(query.id, `Способ оплаты установлен: ${data[0]}`);
    const ownerMessage = `Новый заказ!\nКонтакт: ${orderFormData[chat].contact}\nСпособ оплаты: ${method}`;

    const contact = msg.contact.phone_number;
    orderFormData[chatId] = {
      contact,
      paymentMethod: "Не выбран",
    };
    bot.sendMessage(chatId, `Контакт сохранен: ${contact}`);
  }
});

function requestPaymentMethod(chat) {
  bot.sendMessage(chat, "Пожалуйста укажите удобный для вас способ оплаты", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Картой",
            callback_data: "paymentCard",
          },
        ],
        [
          {
            text: "Наличными",
            callback_data: "paymentCash",
          },
        ],
      ],
    },
  });
}
