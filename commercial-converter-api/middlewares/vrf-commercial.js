const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { fetchDataQueries } = require('../utils/database-query-service');
const { getSystemNameWithModelType } = require('../utils/format-system-name');

module.exports.getVrfCommercial = async (req, res, next, systemsData) => {
  const templatePath = path.join(__dirname, '../template/commercial-offer.xlsx');

  let outputPath;
  let groupNumber = 0;

  const priceSystemsData = await fetchDataQueries(systemsData);

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const worksheet = workbook.getWorksheet('ТКП');

    // Группируем системы по названию системы, игнорируем 'total'
    const groupedSystems = priceSystemsData.filter((system) => system.systemName !== 'total');

    // Начало вставки данных
    let currentRow = 24;

    // Итерируем по системам и вставляем данные
    groupedSystems.forEach((systemData) => {
      const { systemName, models } = systemData;

      groupNumber += 1;

      // Генерируем новое название системы
      const updatedSystemName = getSystemNameWithModelType(systemName, models);

      // Добавление заголовка системы
      const addHeader = () => {
        currentRow += 2;
        worksheet.mergeCells(`B${currentRow}:E${currentRow}`);

        const cellA = worksheet.getCell(`A${currentRow}`);
        cellA.value = parseInt(groupNumber, 10);
        cellA.alignment = { vertical: 'middle', horizontal: 'center' };
        cellA.font = { name: 'Arial', size: 11, bold: true };

        worksheet.getCell(`B${currentRow}`).value = {
          richText: [
            { text: `${updatedSystemName}`, font: { name: 'Arial', size: 11, bold: true } },
          ],
        };
        worksheet.getRow(currentRow).height = 47;
      };

      addHeader();

      // Добавление моделей системы
      models.forEach((modelData) => {
        const { model, quantity, priceData } = modelData;

        // Если данных о модели нет, выводим сообщение
        if (!priceData) {
          worksheet.mergeCells(`B${currentRow + 1}:E${currentRow + 1}`);
          worksheet.getCell(`B${currentRow + 1}`).value = `Данные о модели "${model}" не найдены.`;
          worksheet.getCell(`B${currentRow + 1}`).font = {
            name: 'Arial', size: 11, italic: true, color: { argb: 'FF0000' },
          };
          currentRow += 1;
          return;
        }

        const { ModelTKP, Price } = priceData;

        const formatText = (text, modelName) => {
          const regex = new RegExp(`(${modelName})`, 'gi'); // Регулярное выражение для поиска маркировки

          const formattedText = [];
          let lastIndex = 0;
          let match;

          // Проходим по тексту и ищем все совпадения с моделью
          while ((match = regex.exec(text)) !== null) {
            const beforeMatch = text.substring(lastIndex, match.index);
            const matchedText = match[0];
            lastIndex = regex.lastIndex;

            // Добавляем текст до совпадения
            if (beforeMatch) {
              formattedText.push({
                text: beforeMatch,
                font: { name: 'Arial', size: 11, bold: false },
              });
            }

            // Добавляем само совпадение жирным
            formattedText.push({
              text: matchedText,
              font: { name: 'Arial', size: 11, bold: true },
            });
          }

          // Добавляем оставшийся текст после последнего совпадения
          const afterMatch = text.substring(lastIndex);
          if (afterMatch) {
            formattedText.push({
              text: afterMatch,
              font: { name: 'Arial', size: 11, bold: false },
            });
          }

          return { richText: formattedText };
        };

        // Форматируем текст с выделением маркировки
        const formattedText = formatText(ModelTKP, model);

        worksheet.mergeCells(`B${currentRow + 1}:E${currentRow + 1}`);
        worksheet.getCell(`B${currentRow + 1}`).value = formattedText;
        worksheet.getCell(`G${currentRow + 1}`).numFmt = '#,##0.00';
        worksheet.getCell(`G${currentRow + 1}`).value = Price;
        worksheet.getCell(`I${currentRow + 1}`).value = 0;
        worksheet.getCell(`I${currentRow + 1}`).numFmt = '#,#0.0%';
        worksheet.getCell(`K${currentRow + 1}`).value = {
          formula: `G${currentRow + 1}*(1-I${currentRow + 1})`,
          result: Price,
        };
        worksheet.getCell(`M${currentRow + 1}`).value = parseInt(quantity, 10);
        worksheet.getCell(`M${currentRow + 1}`).style.font = { name: 'Arial', size: 11, color: { argb: '0000FF' } };
        worksheet.getCell(`O${currentRow + 1}`).value = {
          formula: `K${currentRow + 1}*M${currentRow + 1}`,
          result: Price * quantity,
        };

        worksheet.getCell(`Q${currentRow + 1}`).value = priceData.NSKod;
        ['H', 'I', 'M', 'Q'].forEach((column) => {
          worksheet.getCell(`${column}${currentRow + 1}`).alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Настраиваем выравнивание для ячеек
        ['H', 'I', 'M', 'Q'].forEach((column) => {
          worksheet.getCell(`${column}${currentRow + 1}`).alignment = { vertical: 'middle', horizontal: 'center' };
        });

        worksheet.getCell(`B${currentRow}`).alignment = { vertical: 'middle', wrapText: true };
        currentRow += 1;
      });
    });

    // Генерация уникального имени файла
    const generateUniqueFileName = () => {
      const timestamp = new Date().getTime();
      const randomBytes = crypto.randomBytes(16).toString('hex');
      return `newDataSheet_${timestamp}_${randomBytes}.xlsx`;
    };

    // Сохранение результата
    outputPath = path.join(__dirname, `../uploads/${generateUniqueFileName()}`);
    await workbook.xlsx.writeFile(outputPath);

    // Чтение содержимого файла в бинарном формате
    const fileContent = await fs.readFile(outputPath, 'binary');

    return fileContent;
  } catch (e) {
    next(e);
    return null;
  } finally {
    try {
      if (outputPath) {
        await fs.unlink(outputPath);
      }
    } catch (unlinkError) {
      next(unlinkError);
    }
  }
};
