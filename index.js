const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot("6987337400:AAHp2b4E7CngidB0nBFOqix6xW2rmQMp59E", {
  polling: true,
});

// Start-menu
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const keyboard = {
    reply_markup: {
      keyboard: [["📁 Каталог товаров"], ["🛒 Корзина"]],
      resize_keyboard: true,
    },
  };

  bot.sendMessage(
    chatId,
    `Привет! Добро пожаловать в наш магазин. Как я могу помочь?`,
    keyboard
  );
});

//Variables
let cart = {};
const products = {
  Трава: [
    {
      name: "Порошок из лобковых волос",
      description: "Ебошит",
      price: "$9.99",
    },
    {
      name: "Жвачка с лобковыми волосами",
      description: "Жуй и ебоши",
      price: "$12.99",
    },
    {
      name: "Сушеные лобковые волосы",
      description: "Как чипсы, только волосатые",
      price: "$7.99",
    },
  ],
  Печеньки: [
    {
      name: "Прошлогодние",
      description: "Ебошит нормально",
      price: "$15.99",
    },
    {
      name: "Печеньки с изюмом",
      description: "Для гурманов",
      price: "$18.99",
    },
    {
      name: "Печеньки с шоколадом",
      description: "Шоколадные волосы внутри",
      price: "$22.99",
    },
  ],
  Кексы: [
    {
      name: "С запашком",
      description: "Ебошит, но потом хочется травы",
      price: "$25.99",
    },
    {
      name: "Кекс с малиной",
      description: "Малиновые волосы для аромата",
      price: "$28.99",
    },
    {
      name: "Кекс с ванилью",
      description: "Ванильные волосы в каждом кексе",
      price: "$30.99",
    },
  ],
  Косяки: [
    {
      name: "Хуй пойми что было час назад",
      description: "Все в одном",
      price: "$35.99",
    },
    {
      name: "Секретные косяки",
      description: "Тайное сочетание волос и травы",
      price: "$39.99",
    },
    {
      name: "Эксклюзивные косяки",
      description: "Лучшие из лучших",
      price: "$49.99",
    },
  ],
};

// Catalog
// General
bot.onText(/📁 Каталог товаров/, (msg) => {
  const chatId = msg.chat.id;
  getCatalogs(chatId);
});

// Create categories menu
function getCatalogs(chat) {
  const inlineKeyboard = {
    reply_markup: {
      inline_keyboard: Object.keys(products).map((category) => [
        { text: category, callback_data: category },
      ]),
    },
  };

  bot.sendMessage(chat, "Выберите категорию:", inlineKeyboard);
}

bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const category = query.data;

  openCategory(chatId, category);
  bot.answerCallbackQuery(query.id, `Переходим в ${category}`);
});

// Opening categories goods extends category name
function openCategory(chatId, category) {
  const categoryProducts = products[category];

  if (categoryProducts.length > 0) {
    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: categoryProducts.map((product) => [
          { text: product.name, callback_data: `add_to_cart_${product.id}` },
        ]),
      },
    };

    bot.sendMessage(chatId, category, inlineKeyboard);
  } else {
    bot.sendMessage(chatId, "Товары в этой категории отсутствуют.");
  }
}
