const { PdfData } = require('pdfdataextract');
const {
  SYSTEM_DATA_REGEX,
  SYSTEM_NAME_REGEX,
  ORDER_NUMBER_REGEX,
  QUANTITY_REGEX,
  PRICE_REGEX,
  WORK_DAYS_REGEX,
  VALIDITY_KEYWORDS,
} = require('./constants');

const extractTextFromPDF = async (pdfFileData) => {
  try {
    const data = await PdfData.extract(pdfFileData, {
      get: {
        text: true,
      },
    });

    return data.text;
  } catch (error) {
    throw new Error(`Ошибка при извлечении текста из PDF: ${error}`);
  }
};

// Метод для объединения строк с "ШТ" где был перенос
const mergeBrokenLines = (lines) => {
  const mergedLines = [];
  let buffer = '';

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    // Если строка начинается с цифры и содержит буквенный символ и два любых символа
    if (SYSTEM_DATA_REGEX.test(line) && !WORK_DAYS_REGEX.test(line)) {
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

// Функция для извлечения данных о системах из итогового массива строк
const extractDataFromMergedLines = (mergedLines) => {
  let systemName;
  const systems = [];

  mergedLines.forEach((line) => {
    const systemNameMatch = line.match(SYSTEM_NAME_REGEX);
    if (systemNameMatch) {
      systemName = systemNameMatch[0].trim();
    }

    // Находим наименование и цену для каждой системы
    const match = line.match(SYSTEM_DATA_REGEX);
    if (match) {
      const orderNumberMatch = line.match(ORDER_NUMBER_REGEX);
      const orderNumber = orderNumberMatch ? orderNumberMatch[0] : null;
      const quantityMatch = line.match(QUANTITY_REGEX);
      const quantity = quantityMatch ? quantityMatch[1] : null;
      const priceMatch = line.match(PRICE_REGEX);
      const price = priceMatch ? priceMatch[1].replace(/\s/g, '') : null;

      // Находим позицию начала и конца строки с наименованием
      const itemNameStartIndex = line.indexOf(orderNumber) + orderNumber.length;
      const itemNameEndIndex = line.search(QUANTITY_REGEX);
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

const checkFileValidity = (text) => {
  return VALIDITY_KEYWORDS.every((keyword) => text.some((line) => line.includes(keyword)));
};

module.exports = {
  extractTextFromPDF,
  mergeBrokenLines,
  extractDataFromMergedLines,
  checkFileValidity,
};
