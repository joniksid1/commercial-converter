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
    let currentGroup = ''; // Переменная для текущей подгруппы

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

      // Если строка явно задаёт новую подгруппу, обновляем текущую подгруппу
      if (modelValue && modelValue.startsWith('Группа')) { // Условие для распознавания подгрупп
        currentGroup = modelValue;
      }

      if (modelValue) {
        const matches = modelValue.match(FIND_MODELS_REGEX);
        if (matches) {
          matches.forEach((match) => {
            if (!isForbiddenModel(match)) {
              let finalQuantity = quantityValue;

              if (match.endsWith('FKFW')) {
                match += '1';
              }

              // Проверка на умножение количества
              if (shouldMultiplyQuantity(match)) {
                finalQuantity = quantityValue * 2;
              }

              models.push({
                model: match,
                quantity: finalQuantity,
                group: currentGroup, // Сохраняем подгруппу для модели
              });

              // --- ДОБАВЛЕНИЕ ПУЛЬТОВ К КАССЕТНЫМ И КАНАЛЬНЫМ БЛОКАМ ---
              const prefix = match.substring(0, 3);
              const controllerMap = {
                // Hisense
                AVY: { irReceiver: 'HYRE-X01H', irController: 'HYE-VD01', wallController: 'HYXE-VA01A' },
                AVL: { irReceiver: 'HYRE-V02H', irController: 'HYE-VD01', wallController: 'HYXE-VA01A' },
                AVH: { irReceiver: 'HYRE-V02H', irController: 'HYE-VD01', wallController: 'HYXE-VA01A' },

                // Royal Clima
                RCY: { irReceiver: 'RCYR-X01H', irController: 'RCY-W01', wallController: 'RCYW-M01H' },
                RCL: { irReceiver: 'RCYR-V02H', irController: 'RCY-W01', wallController: 'RCYW-M01H' },
                RCH: { irReceiver: 'RCYR-V02H', irController: 'RCY-W01', wallController: 'RCYW-M01H' },
              };

              if (controllerMap[prefix]) {
                const baseQuantity = parseInt(finalQuantity, 10);
                const { irController, wallController, irReceiver } = controllerMap[prefix];

                // Вариант 1: ИК пульт + приёмник
                models.push({
                  model: irController,
                  quantity: baseQuantity,
                  group: currentGroup,
                  isAccessory: true,
                  note: 'выберите вариант пульта (ИК + приёмник)',
                });
                models.push({
                  model: irReceiver,
                  quantity: baseQuantity,
                  group: currentGroup,
                  isAccessory: true,
                  note: 'выберите вариант пульта (ИК + приёмник)',
                });

                // Вариант 2: Настенный пульт
                models.push({
                  model: wallController,
                  quantity: baseQuantity,
                  group: currentGroup,
                  isAccessory: true,
                  note: 'выберите вариант пульта (настенный)',
                });
              }
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
