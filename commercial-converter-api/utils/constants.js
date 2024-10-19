// Регулярное выражение для удаления префикса "Система "
const SYSTEM_PREFIX_REGEX = /^Система\s+/;

// Регулярное выражение для форматирования чисел в скобках (объем в м3/час и давление в Па)
const SYSTEM_VOLUME_PRESSURE_REGEX = /\(([\d.]+)\s*т\.м3\/час;\s*([\d.]+)\s*Па\)/;

// Регулярное выражение для извлечения системных данных
const SYSTEM_DATA_REGEX = /^\d+\s[A-Za-zА-Яа-я]{1,}\S{2}/;

// Регулярное выражение для наименования системы
const SYSTEM_NAME_REGEX = /Система.+/;

// Регулярное выражение для номера заказа
const ORDER_NUMBER_REGEX = /^\d+/;

// Регулярное выражение для количества с "ШТ"
const QUANTITY_REGEX = /(\d+)\sШТ/;

// Регулярное выражение для цены с "ШТ"
const PRICE_REGEX = /ШТ\s([\d\s]*\d+,\d+)/;

// Регулярное выражение для определения строк с "рабочих дней"
const WORK_DAYS_REGEX = /рабочих дней/;

// Ключевые слова для проверки файла
const VALIDITY_KEYWORDS = ['Условия оплаты', 'airone'];

// Для определения высоты строки моделей в ТКП
const AVC_AVBC_REGEX = /^AVC|AVBC/;
const MODELS_REGEX = /^AVS|HZX|AVY|AVL|AVD|AVE|AVV|AVK|RCZX|RCS|RCC|RCBC|RCY|RCL|RCD|RCE|RCH/;

// Выражения для поиска моделей в EXCEL спецификации
const FIND_MODELS_REGEX = /[A-Z]{2,}-[A-Za-z0-9]*/g;

module.exports = {
  SYSTEM_PREFIX_REGEX,
  SYSTEM_VOLUME_PRESSURE_REGEX,
  SYSTEM_DATA_REGEX,
  SYSTEM_NAME_REGEX,
  ORDER_NUMBER_REGEX,
  QUANTITY_REGEX,
  PRICE_REGEX,
  WORK_DAYS_REGEX,
  VALIDITY_KEYWORDS,
  AVC_AVBC_REGEX,
  MODELS_REGEX,
  FIND_MODELS_REGEX,
};
