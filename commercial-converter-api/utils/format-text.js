const { PdfData } = require('pdfdataextract');

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
    if (/^\d+\s[A-Za-zА-Яа-я]{1,}\S{2}/.test(line) && !line.includes('рабочих дней')) {
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
    // Вытаскиваем возможные названия систем
    // const systemNameMatch = line.match(/(?:Система|ПД\d+|ВД\d+|ППК|ПДУ|ВДУ).+/);
    const systemNameMatch = line.match(/Система.+/);
    if (systemNameMatch) {
      systemName = systemNameMatch[0].trim();
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
      const itemNameEndIndex = line.search(/(\d+)\sШТ/);
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
  const keywords = ['Условия оплаты', 'airone'];
  return keywords.every((keyword) => text.some((line) => line.includes(keyword)));
};

module.exports = {
  extractTextFromPDF,
  mergeBrokenLines,
  extractDataFromMergedLines,
  checkFileValidity,
};
