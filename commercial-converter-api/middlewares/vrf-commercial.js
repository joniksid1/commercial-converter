const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { fetchDataQueries } = require('../utils/database-query-service');
const { getSystemNameWithModelType } = require('../utils/format-system-name');
const { AVC_AVBC_REGEX, MODELS_REGEX } = require('../utils/constants');

module.exports.getVrfCommercial = async (req, res, next, systemsData) => {
  const templatePath = path.join(__dirname, '../template/commercial-offer.xlsx');

  let outputPath;
  let groupNumber = 0;

  const priceSystemsData = await fetchDataQueries(systemsData);

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const worksheet = workbook.getWorksheet('ТКП');

    // Фильтруем системы, исключая 'total', но не меняем порядок групп
    const groupedSystems = priceSystemsData.filter((system) => system.systemName !== 'total');

    let currentRow = 24;

    groupedSystems.forEach((systemData) => {
      const { systemName, models } = systemData;
      groupNumber += 1;

      const updatedSystemName = getSystemNameWithModelType(systemName, models);

      const addHeader = () => {
        currentRow += 2;
        worksheet.mergeCells(`B${currentRow}:E${currentRow}`);

        const cellA = worksheet.getCell(`A${currentRow}`);
        cellA.value = parseInt(groupNumber, 10);
        cellA.alignment = { vertical: 'middle', horizontal: 'center' };
        cellA.font = { name: 'Arial', size: 11, bold: true };

        const systemNamePart = systemName;
        const remainingPart = updatedSystemName.replace(systemName, '');

        worksheet.getCell(`B${currentRow}`).value = {
          richText: [
            {
              text: systemNamePart,
              font: {
                name: 'Arial', size: 11, bold: true, color: { argb: '800000' },
              },
            },
            {
              text: remainingPart,
              font:
              {
                name: 'Arial', size: 11, bold: true, color: { argb: '000000' },
              },
            },
          ],
        };

        worksheet.getRow(currentRow).height = 46;
      };

      addHeader();

      // Сортировка моделей внутри группы по числовым частям в имени модели
      const groupedModels = models.reduce((acc, modelData) => {
        const { model } = modelData;
        const prefix = model.split('-')[0]; // Извлекаем префикс, например, "AVC"

        if (!acc[prefix]) acc[prefix] = [];
        acc[prefix].push(modelData); // Группируем модели по префиксам

        return acc;
      }, {});

      // Сортируем модели в каждой группе по числовым частям
      const sortedModels = Object.values(groupedModels).flatMap((group) => group.sort((a, b) => {
        const modelA = a.model;
        const modelB = b.model;

        // Извлекаем числовую часть модели с помощью регулярного выражения
        const numberA = parseInt(modelA.replace(/\D/g, ''), 10);
        const numberB = parseInt(modelB.replace(/\D/g, ''), 10);

        // Сравниваем числовые части
        return numberA - numberB;
      }));

      console.log(`Модели для группы "${systemName}" после сортировки:`, sortedModels.map((model) => model.model));

      // Вставка моделей системы
      sortedModels.forEach((modelData) => {
        const { model, quantity, priceData } = modelData;

        if (!priceData) {
          worksheet.mergeCells(`B${currentRow + 1}:E${currentRow + 1}`);
          worksheet.getCell(`B${currentRow + 1}`).value = `Данные о модели "${model}" не найдены. Количество: ${quantity}`;
          worksheet.getCell(`B${currentRow + 1}`).font = {
            name: 'Arial', size: 11, italic: true, color: { argb: 'FF0000' },
          };
          currentRow += 1;
          return;
        }

        const { ModelTKP, Price } = priceData;

        const formatText = (text, modelName) => {
          const regex = new RegExp(`(${modelName})`, 'gi');

          const formattedText = [];
          let lastIndex = 0;
          let match;

          while ((match = regex.exec(text)) !== null) {
            const beforeMatch = text.substring(lastIndex, match.index);
            const matchedText = match[0];
            lastIndex = regex.lastIndex;

            if (beforeMatch) {
              formattedText.push({
                text: beforeMatch,
                font: { name: 'Arial', size: 11, bold: false },
              });
            }

            formattedText.push({
              text: matchedText,
              font: { name: 'Arial', size: 11, bold: true },
            });
          }

          const afterMatch = text.substring(lastIndex);
          if (afterMatch) {
            formattedText.push({
              text: afterMatch,
              font: { name: 'Arial', size: 11, bold: false },
            });
          }

          return { richText: formattedText };
        };

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

        worksheet.getCell(`B${currentRow}`).alignment = { vertical: 'middle', wrapText: true };

        if (AVC_AVBC_REGEX.test(model)) {
          worksheet.getRow(currentRow + 1).height = 52;
        } else if (MODELS_REGEX.test(model)) {
          worksheet.getRow(currentRow + 1).height = 39;
        } else {
          worksheet.getRow(currentRow + 1).height = 23;
        }
        currentRow += 1;
      });
    });

    const generateUniqueFileName = () => {
      const timestamp = new Date().getTime();
      const randomBytes = crypto.randomBytes(16).toString('hex');
      return `newDataSheet_${timestamp}_${randomBytes}.xlsx`;
    };

    outputPath = path.join(__dirname, `../uploads/${generateUniqueFileName()}`);
    await workbook.xlsx.writeFile(outputPath);

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
