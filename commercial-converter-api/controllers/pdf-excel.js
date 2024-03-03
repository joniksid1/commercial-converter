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

// Метод для объединения строк с "ШТ" где был перенос
const mergeLinesWithSHTRows = (lines) => {
  const mergedLines = [];
  let buffer = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\d+\s[A-Za-zА-Яа-я]{1,}\S{2}/.test(line)) {
      if (buffer !== '') {
        mergedLines.push(buffer.trim());
        buffer = '';
      }
      buffer += line;
    } else if (line.includes('ШТ')) {
      buffer += ` ${line}`;
    } else if (line.includes('Система')) {
      mergedLines.push(line.trim()); // Добавляем строку с "Система" в итоговый массив
    } else {
      buffer += `${line} `;
    }
  }

  if (buffer !== '') {
    mergedLines.push(buffer.trim());
  }

  return mergedLines;
};

// Функция для извлечения данных о системах из итогового массива
const extractDataFromMergedLines = (mergedLines) => {
  const systems = [];

  mergedLines.forEach((line) => {
    if (line.includes('Система')) {
      const systemName = line.split(',')[0].trim(); // Получаем название системы
      systems.push(systemName);
    }

    // Находим наименование и цену для каждой системы
    const match = line.match(/^\d+\s[A-Za-zА-Яа-я]{1,}\S{2}/);
    if (match) {
      const orderNumberMatch = line.match(/^\d+/);
      const orderNumber = orderNumberMatch ? orderNumberMatch[0] : null;
      const quantityMatch = line.match(/(\d+)\sШТ/);
      const quantity = quantityMatch ? quantityMatch[1] : null;
      const priceMatch = line.match(/ШТ\s(\d+\s\d+,\d+)/) || line.match(/ШТ\s(\d+,\d+)/);
      const price = priceMatch ? priceMatch[1] : null;

      // Находим позицию начала и конца строки с наименованием
      const itemNameStartIndex = line.indexOf(orderNumber) + orderNumber.length;
      const itemNameEndIndex = line.indexOf(' ШТ');
      const itemName = line.slice(itemNameStartIndex, itemNameEndIndex - 1).trim();

      systems.push({
        orderNumber,
        itemName,
        quantity,
        price,
      });
    }
  });

  return systems;
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
        const mergedLines = mergeLinesWithSHTRows(lines);
        const filteredLines = mergedLines.filter((line) => /^\d+\s[A-Za-zА-Яа-я]{1,}\S{2}/.test(line) || /^Система/.test(line));
        data.push(...filteredLines);
      });
      // Вставляем данные в таблицу Excel
      data.forEach((row) => {
        worksheet.addRow([row]);
      });

      // Извлекаем данные о системах из итогового массива
      const systemsData = extractDataFromMergedLines(data);

      // Выводим данные о системах в консоль
      console.log('Данные по системам:');
      systemsData.forEach((system) => {
        // Не работает сейчас, systemName нет у system, название лежит вне system
        // Для такого элемента массива выводится undefind по всем свойствам
        // console.log('Название системы:', system.systemName);
        console.log('Наименование:', system.itemName);
        console.log('Количество:', system.quantity);
        console.log('Цена:', system.price);
        console.log('---------------------');
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
