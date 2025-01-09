const { getCommercialOffer } = require('../middlewares/commercial-offer');

const {
  extractTextFromPDF,
  mergeBrokenLines,
  extractDataFromMergedLines,
  checkFileValidity,
} = require('../utils/format-text');
const { extractModelsFromExcel } = require('../utils/extract-models');
const { getVrfCommercial } = require('../middlewares/vrf-commercial');
const { transformAndCombineJoints } = require('../utils/transform-and-combine-joints');

// POST запрос для извлечения текста из PDF и сохранения в XLSX
module.exports.pdfToXLSX = async (req, res, next) => {
  try {
    const fileData = req.files.file.data;
    const fileName = req.files.file.name.toLowerCase();
    if (fileName.endsWith('.pdf')) {
      // Извлекаем текст из PDF
      const extractedText = await extractTextFromPDF(fileData);

      // Проверяем, является ли извлеченный текст массивом
      if (Array.isArray(extractedText)) {
        // Создаем массив для данных
        const data = [];

        const validate = checkFileValidity(extractedText);

        if (!validate) {
          throw new Error('Файл не соответствует необходимому шаблону КП');
        }

        // Итерируем по массиву и фильтруем нужные строки
        extractedText.forEach((pageText) => {
          const lines = pageText.split('\n');
          const mergedLines = mergeBrokenLines(lines);
          const filteredLines = mergedLines.filter((line) => /^\d+\s[A-Za-zА-Яа-я]{1,}\S{2}/.test(line) || /^Система/.test(line));
          data.push(...filteredLines);
        });

        // Извлекаем данные о системах из итогового массива
        const systemsData = extractDataFromMergedLines(data);

        // Удаляем последний элемент из массива systemsData - мусорная информация в подвале
        systemsData.pop();

        // Вызываем функцию для создания заполненного файла Excel
        const commercial = await getCommercialOffer(req, res, next, systemsData);

        // Генерируем и отправляем XLSX файл обратно клиенту
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="extracted_text.xlsx"');
        res.write(commercial, 'binary');
        res.end();
      }
    } else if (fileName.endsWith('.xlsx')) {
      // Валидация проходит внутри extractModelsFromExcel,
      // т.к. проверка данных проходит в самом файле xlsx

      const systemsData = await extractModelsFromExcel(req.files.file.data);

      const transormedSystemsData = transformAndCombineJoints(systemsData);

      // Вызываем функцию для создания заполненного файла Excel
      const commercial = await getVrfCommercial(
        req,
        res,
        next,
        transormedSystemsData,
      );

      // Генерируем и отправляем XLSX файл обратно клиенту
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="extracted_text.xlsx"');
      res.write(commercial, 'binary');
      res.end();
    } else {
      throw new Error('Ошибка извлечения текста из шаблона');
    }
  } catch (e) {
    next(e);
  }
};
