const ExcelJS = require('exceljs');

// Регулярное выражение для поиска маркировок (латиница, цифры и тире/буквы в конце)
const pattern = /[A-Z]{2,}-[A-Za-z0-9]*/g;

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
      if (companyCell.value && companyCell.value.toString() === ('Hisense' || 'ROYAL CLIMA')) {
        isValidFile = true; // Файл валиден
      }

      // Проверяем наличие значения в столбце A
      const modelValue = modelCell.value ? modelCell.value.toString() : '';
      const quantityValue = quantityCell.value ? quantityCell.value.toString() : 'N/A'; // Если пусто, то 'N/A'

      if (modelValue) { // Проверяем, что модель не пустая
        const matches = modelValue.match(pattern);
        if (matches) {
          matches.forEach((match) => {
            models.push({
              model: match,
              quantity: quantityValue,
            });
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
