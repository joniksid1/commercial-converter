const { priceDb, checkAndReconnect } = require('./db');
const { NotFoundError } = require('./errors/not-found-error');

const { MYSQL_PRICE_DATABASE } = process.env;

// Получение данных по ценам и названиям из БД для коммерческого предложения
async function fetchDataQueries(systemData) {
  await checkAndReconnect(priceDb, MYSQL_PRICE_DATABASE);

  // Создаем массив для хранения всех моделей
  const modelNames = systemData.flatMap((system) => system.models.map((model) => model.model));

  // Удаляем дубликаты моделей
  const uniqueModelNames = [...new Set(modelNames)];

  // Создаем строку с вопросительными знаками для запроса
  const placeholders = uniqueModelNames.map(() => '?').join(', ');

  // Выполняем запрос к базе данных
  const query = `
    SELECT *
    FROM Price
    WHERE Model IN (${placeholders});
  `;

  const [priceDbData] = await priceDb.query(query, uniqueModelNames);

  if (priceDbData.length === 0) {
    throw new NotFoundError({ message: 'Не удалось найти данные в базе' });
  }

  // Создаем объект для сопоставления моделей с данными из базы
  const priceDataMap = {};
  priceDbData.forEach((item) => {
    priceDataMap[item.Model] = item; // Предполагается, что у вас есть поле Model в ответе из БД
  });

  // Добавляем данные из базы в исходную структуру systemData
  systemData.forEach((system) => {
    system.models.forEach((model) => {
      if (priceDataMap[model.model]) {
        model.priceData = priceDataMap[model.model]; // Добавляем данные о цене к модели
      } else {
        model.priceData = null; // Если нет данных, добавляем null или другое значение
      }
    });
  });

  return systemData; // Возвращаем обновленную структуру данных
}

module.exports = {
  fetchDataQueries,
};
