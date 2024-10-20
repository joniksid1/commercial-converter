const ExcelJS = require('exceljs');
const { FORBIDDEN_PREFIXES, MODELS_WITH_QUANTITY_MULTIPLICATION } = require('./models');
const { FIND_MODELS_REGEX } = require('./constants');

// Функция для проверки, начинается ли модель с одного из запрещённых префиксов
const isForbiddenModel = (model) => FORBIDDEN_PREFIXES.some((prefix) => model.startsWith(prefix));

// Функция для проверки, нужно ли умножать количество
const shouldMultiplyQuantity = (model) => MODELS_WITH_QUANTITY_MULTIPLICATION.includes(model);

// Функция для чтения данных из загруженного Excel файла (из буфера)
async function extractModelsFromExcel(fileBuffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  const data = [];
  let isValidFile = false; // Переменная для проверки валидности файла

  workbook.eachSheet((worksheet) => {
    const models = [];

    worksheet.eachRow((row) => {
      const modelCell = row.getCell(1); // Столбец A (1)
      const quantityCell = row.getCell(6); // Столбец F (6)
      const companyCell = row.getCell(2); // Столбец B (2)

      // Проверяем наличие значения в столбце B
      if (companyCell.value && (companyCell.value.toString() === 'Hisense' || companyCell.value.toString() === 'ROYAL CLIMA')) {
        isValidFile = true;
      }

      // Проверяем наличие значения в столбце A
      const modelValue = modelCell.value ? modelCell.value.toString() : '';
      const quantityValue = quantityCell.value ? quantityCell.value.toString() : 'N/A'; // Если пусто, то 'N/A'

      if (modelValue) {
        const matches = modelValue.match(FIND_MODELS_REGEX);
        if (matches) {
          matches.forEach((match) => {
            if (!isForbiddenModel(match)) {
              let finalQuantity = quantityValue;

              // Проверка на умножение количества
              if (shouldMultiplyQuantity(match)) {
                finalQuantity = quantityValue * 2;
              }

              models.push({
                model: match,
                quantity: finalQuantity,
              });
            }
          });
        }
      }
    });

    if (models.length > 0) {
      data.push({
        systemName: worksheet.name,
        models,
      });
    }
  });

  // Если файл не валиден, выбрасываем ошибку
  if (!isValidFile) {
    throw new Error('Файл не соответствует необходимому шаблону');
  }

  return data;
}

module.exports = {
  extractModelsFromExcel,
};
