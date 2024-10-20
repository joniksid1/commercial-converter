const {
  SYSTEM_PREFIX_REGEX,
  SYSTEM_VOLUME_PRESSURE_REGEX,
} = require('./constants');
const { SYSTEM_MODEL_ENDINGS } = require('./models');

function formatSystemName(originalName) {
  // Удаляем префикс "Система", если он есть
  let formattedName = originalName.replace(SYSTEM_PREFIX_REGEX, '');

  // Преобразуем формат чисел в скобках
  formattedName = formattedName.replace(SYSTEM_VOLUME_PRESSURE_REGEX, (match, volume, pressure) => {
    const volumeInM3 = Math.round(parseFloat(volume.replace(',', '.')) * 1000);
    const roundedPressure = Math.round(parseFloat(pressure.replace(',', '.')));
    return `(L=${volumeInM3} м3/ч; Рс=${roundedPressure} Па)`;
  });

  return formattedName;
}

// Вспомогательная функция для формирования названия системы
const getSystemNameWithModelType = (systemName, models) => {
  let newName = systemName;
  const addedEndings = new Set(); // Множество для хранения уже добавленных окончаний

  // Функция для проверки, нужно ли игнорировать модель
  // (Cодержащие "AVD", т.к. маркировка AVD и наружных блоков H серии содержит HJFH)
  const shouldIgnoreModel = (model) => model.startsWith('AVD');

  // Используем forEach для итерации по каждому окончанию
  Object.keys(SYSTEM_MODEL_ENDINGS).forEach((ending) => {
    // Проверяем, есть ли модель с данным окончанием и она не должна быть проигнорирована
    const foundModel = models.find(({ model }) =>
      model.endsWith(ending) && !shouldIgnoreModel(model));

    // Если нашли подходящую модель и окончание ещё не добавлено
    if (foundModel && !addedEndings.has(ending)) {
      newName += ` ${SYSTEM_MODEL_ENDINGS[ending]}`;
      addedEndings.add(ending); // Добавляем окончание в множество, чтобы не дублировать
    }
  });

  return newName;
};

module.exports = {
  formatSystemName,
  getSystemNameWithModelType,
};
