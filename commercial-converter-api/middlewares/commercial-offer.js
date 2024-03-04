const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

module.exports.getCommercialOffer = async (req, res, next, systemsData) => {
  const templatePath = path.join(__dirname, '../template/commercial-offer.xlsx');

  let outputPath;
  let groupNumber = 0;

  try {
    // Загружаем шаблон Excel-файла
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    // Получаем лист Excel
    const worksheet = workbook.getWorksheet('ТКП');

    // Группируем системы по названию системы
    const groupedSystems = {};
    systemsData.forEach((system) => {
      if (!groupedSystems[system.systemName]) {
        groupedSystems[system.systemName] = [];
      }
      groupedSystems[system.systemName].push(system);
    });

    // Начало вставки данных
    let currentRow = 24;

    // Итерируем по группам систем и вставляем данные
    Object.keys(groupedSystems).forEach((systemName) => {
      const systems = groupedSystems[systemName];
      groupNumber += 1;

      const addHeader = () => {
        currentRow += 2;

        worksheet.mergeCells(`B${currentRow}:E${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = {
          richText: [
            { text: `${groupNumber}`, font: { name: 'Arial', size: 11, bold: true } },
          ],
        };
        worksheet.getCell(`A${currentRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getCell(`B${currentRow}`).value = {
          richText: [
            { text: `${systemName}`, font: { name: 'Arial', size: 11, bold: true } },
          ],
        };
        worksheet.getRow(currentRow).height = 47;
      };

      addHeader();

      // Добавляем данные для каждой системы
      systems.forEach((system, index) => {
        // Добавляем данные для элементов
        const addData = () => {
          worksheet.mergeCells(`B${currentRow + 1}:E${currentRow + 1}`);
          worksheet.getCell(`B${currentRow + 1}`).value = system.itemName;
          worksheet.getCell(`H${currentRow + 1}`).value = system.price;
          worksheet.getCell(`H${currentRow + 1}`).numFmt = '#,##0.00';
          worksheet.getCell(`I${currentRow + 1}`).value = 0;
          worksheet.getCell(`I${currentRow + 1}`).numFmt = '#,#0.0%';
          worksheet.getCell(`L${currentRow + 1}`).value = {
            formula: `H${currentRow + 1}*(1-I${currentRow + 1})`,
            result: (system.price),
          };
          worksheet.getCell(`M${currentRow + 1}`).value = system.quantity;
          worksheet.getCell(`P${currentRow + 1}`).value = {
            formula: `L${currentRow + 1}*M${currentRow + 1}`,
            result: (system.price),
          };
          ['H', 'I', 'M', 'Q'].forEach((column) => {
            worksheet.getCell(`${column}${currentRow + 1}`).alignment = { vertical: 'middle', horizontal: 'center' };
          });
          worksheet.getCell(`B${currentRow}`).alignment = { vertical: 'middle', wrapText: true };
          currentRow += 1;
        };

        addData();
        // Устанавливаем стиль ячейки только над первой системой (костыль из-за бага exceljs)
        // Баг проявляется при работе с объединёнными ячейками - плывут стили
        if (index === 0) {
          worksheet.getCell(`B${currentRow - 1}`).style = { alignment: { horizontal: 'center', vertical: 'middle' } };
        }
      });
    });

    // Генерируем уникальное имя файла
    const generateUniqueFileName = () => {
      const timestamp = new Date().getTime();
      const randomBytes = crypto.randomBytes(16).toString('hex');
      return `newDataSheet_${timestamp}_${randomBytes}.xlsx`;
    };

    // Сохраняем результат в новый файл Excel
    outputPath = path.join(__dirname, `../uploads/${generateUniqueFileName()}`);
    await workbook.xlsx.writeFile(outputPath);

    // Читаем содержимое файла в бинарном формате
    const fileContent = await fs.readFile(outputPath, 'binary');

    return fileContent;
  } catch (e) {
    next(e);
  } finally {
    // Удаляем временный файл
    try {
      if (outputPath) {
        await fs.unlink(outputPath);
        console.log('Файл успешно удален');
      }
    } catch (unlinkError) {
      console.error('Ошибка удаления файла:', unlinkError);
    }
  }
};
