const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { formatSystemName } = require('../utils/format-system-name');

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

      const formattedTitle = formatSystemName(systemName);

      groupNumber += 1;

      const addHeader = () => {
        currentRow += 2;
        worksheet.mergeCells(`B${currentRow}:E${currentRow}`);

        const cellA = worksheet.getCell(`A${currentRow}`);
        cellA.value = parseInt(groupNumber, 10);
        cellA.alignment = { vertical: 'middle', horizontal: 'center' };
        cellA.font = { name: 'Arial', size: 11, bold: true };

        worksheet.getCell(`B${currentRow}`).value = {
          richText: [
            { text: `${formattedTitle}`, font: { name: 'Arial', size: 11, bold: true } },
          ],
        };
        worksheet.getRow(currentRow).height = 47;
      };

      addHeader();

      // Добавляем данные для каждой системы
      systems.forEach((system, index) => {
        // Добавляем данные для элементов
        const addData = () => {
          let { price } = system;
          if (price !== null && !Number.isNaN(price)) {
            price = parseFloat(price.replace(/\s/g, '').replace(',', '.'));
          }
          worksheet.mergeCells(`B${currentRow + 1}:E${currentRow + 1}`);
          // Функция, которая форматирует текст и возвращает его в формате rich text
          const formatText = (text) => {
            // Проверяем, есть ли пробел в строке
            const hasSpace = /\s/.test(text);

            // Если пробел есть, то ищем последнее слово
            if (hasSpace) {
              // Регулярное выражение для поиска последнего слова в тексте
              const lastWordRegex = /[^\s]+$/;
              const lastWordMatch = text.match(lastWordRegex);

              // Если найдено последнее слово, выделить его
              if (lastWordMatch) {
                const lastWord = lastWordMatch[0];
                const lastIndex = text.lastIndexOf(lastWord);
                const plainTextBeforeLastWord = text.substring(0, lastIndex);
                const plainTextAfterLastWord = text.substring(lastIndex + lastWord.length);

                // Проверка, является ли последнее слово "А" или "резинового"
                if (lastWord !== 'А'
                && lastWord !== 'резинового'
                && lastWord !== 'IP54'
                && lastWord !== 'IP65'
                ) {
                  // Форматирование текста: первая часть без выделения, последнее слово - выделено
                  const formattedText = [
                    { text: plainTextBeforeLastWord, font: { name: 'Arial', size: 11, bold: false } },
                    { text: lastWord, font: { name: 'Arial', size: 11, bold: true } },
                    { text: plainTextAfterLastWord, font: { name: 'Arial', size: 11, bold: false } },
                  ];

                  const cellValue = {
                    richText: formattedText.map(({ text: itemText, font }) => ({
                      text: itemText,
                      font: {
                        ...font,
                        bold: font.bold,
                      },
                    })),
                  };

                  return cellValue;
                }
              }
            } else {
              // Если пробела нет, вернуть единственное слово жирным
              return {
                richText: [{ text, font: { name: 'Arial', size: 11, bold: true } }],
              };
            }

            // Иначе вернуть весь текст без выделения
            return {
              richText: [{ text, font: { name: 'Arial', size: 11, bold: false } }],
            };
          };

          const formattedText = formatText(system.itemName);
          worksheet.getCell(`B${currentRow + 1}`).value = formattedText;
          worksheet.getCell(`H${currentRow + 1}`).numFmt = '#,##0.00';
          worksheet.getCell(`H${currentRow + 1}`).value = price;
          worksheet.getCell(`I${currentRow + 1}`).value = 0;
          worksheet.getCell(`I${currentRow + 1}`).numFmt = '#,#0.0%';
          worksheet.getCell(`L${currentRow + 1}`).value = {
            formula: `H${currentRow + 1}*(1-I${currentRow + 1})`,
            result: (system.price),
          };
          worksheet.getCell(`M${currentRow + 1}`).value = parseInt(system.quantity, 10);
          worksheet.getCell(`M${currentRow + 1}`).style.font = { name: 'Arial', size: 11, color: { argb: '0000FF' } };
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
    return null;
  } finally {
    // Удаляем временный файл
    try {
      if (outputPath) {
        await fs.unlink(outputPath);
      }
    } catch (unlinkError) {
      next(unlinkError);
    }
  }
};
