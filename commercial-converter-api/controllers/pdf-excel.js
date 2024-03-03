const { PdfData } = require('pdfdataextract');
const ExcelJS = require('exceljs');

// Метод для извлечения текста из PDF
const extractTextFromPDF = async (pdfFileData) => {
  try {
    const data = await PdfData.extract(pdfFileData, {
      get: {
        text: true, // Включаем извлечение текста
      },
    });

    return data.text; // Возвращаем извлеченный текст
  } catch (error) {
    throw new Error(`Ошибка при извлечении текста из PDF: ${error}`);
  }
};

// POST запрос для извлечения текста из PDF и сохранения в XLSX
module.exports.pdfToXLSX = async (req, res, next) => {
  try {
    const pdfFileData = req.files.pdfFile.data;

    // Извлекаем текст из PDF
    const extractedText = await extractTextFromPDF(pdfFileData);

    // Создаем новую книгу Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Extracted Text');

    // Проверяем, является ли извлеченный текст массивом
    if (Array.isArray(extractedText)) {
      // Создаем массив для данных
      const data = [];

      // Итерируем по массиву и фильтруем нужные строки
      extractedText.forEach((pageText) => {
        const lines = pageText.split('\n');
        lines.forEach((line) => {
          data.push(line);
        });
      });
      // Вставляем данные в таблицу Excel
      data.forEach((row) => {
        worksheet.addRow(row.split('\n'));
      });
    } else {
      throw new Error('Извлеченный текст не является массивом');
    }

    // Генерируем и отправляем XLSX файл обратно клиенту
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="extracted_text.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    next(e);
  }
};
