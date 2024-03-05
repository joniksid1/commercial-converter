const { getCommercialOffer } = require('../middlewares/commercial-offer');

const {
  extractTextFromPDF,
  mergeBrokenLines,
  extractDataFromMergedLines,
  checkFileValidity,
} = require('../utils/format-text');

// POST запрос для извлечения текста из PDF и сохранения в XLSX
module.exports.pdfToXLSX = async (req, res, next) => {
  try {
    const pdfFileData = req.files.pdfFile.data;

    // Извлекаем текст из PDF
    const extractedText = await extractTextFromPDF(pdfFileData);

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
    } else {
      throw new Error('Извлеченный текст не является массивом');
    }
  } catch (e) {
    next(e);
  }
};
