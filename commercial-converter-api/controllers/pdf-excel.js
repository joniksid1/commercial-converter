const { PdfData } = require('pdfdataextract');
const { getCommercialOffer } = require('./commercial-offer');

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

    // Если строка начинается с цифры и содержит буквенный символ и два любых символа
    if (/^\d+\s[A-Za-zА-Яа-я]{1,}\S{2}/.test(line)) {
      if (buffer !== '') {
        mergedLines.push(buffer.trim());
        buffer = '';
      }
      buffer += line;
      // Если строка содержит "Система", добавляем её в итоговый массив
    } else if (line.includes('Система')) {
      if (buffer !== '') {
        mergedLines.push(buffer.trim());
        buffer = '';
      }
      mergedLines.push(line.trim());
      // Если строка содержит "ШТ", добавляем её в буфер
    } else if (line.includes('ШТ')) {
      buffer += ` ${line}`;
      // Иначе добавляем строку в буфер
    } else {
      buffer += line;
    }
  }

  // Если остался непустой буфер, добавляем его в итоговый массив
  if (buffer !== '') {
    mergedLines.push(buffer.trim());
  }
  return mergedLines;
};

// Функция для извлечения данных о системах из итогового массива
const extractDataFromMergedLines = (mergedLines) => {
  // Почему-то происходит СМЕЩЕНИЕ НА ОДНУ СИСТЕМУ НАЗАД (ВСТАВЛЯЕТСЯ ПЕРЕД ВИБРОИЗОЛЯТОРОМ)
  let systemName;
  const systems = [];

  mergedLines.forEach((line) => {
    if (line.includes('Система')) {
      systemName = line.split(',')[0].trim(); // Получаем название системы
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
        systemName,
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

      // Извлекаем данные о системах из итогового массива
      const systemsData = extractDataFromMergedLines(data);

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
