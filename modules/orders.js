const fs = require("fs");
const path = require("path");

const ordersFilePath = path.join(__dirname, "orders.json");

let orders = [];
let orderNumber = getOrderNumber();

try {
  const data = fs.readFileSync(ordersFilePath, "utf8");
  orders = JSON.parse(data);
} catch (err) {
  saveOrdersToFile();
}

function saveOrdersToFile() {
  try {
    fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), "utf8");
  } catch (error) {
    console.error("Ошибка при сохранении заказов в файл:", error);
  }
}

function getOrderNumber() {
  const data = fs.readFileSync(ordersFilePath, "utf8");
  const jsonData = JSON.parse(data);
  const lastOrder = jsonData[jsonData.length - 1];
  const orderNumber = lastOrder.order;

  return orderNumber + 1;
}

module.exports = { orders, saveOrdersToFile, orderNumber };
