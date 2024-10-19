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

  const hasModelEnding = (ending) => models.some(({ model }) => model.endsWith(ending));

  Object.keys(SYSTEM_MODEL_ENDINGS).forEach((ending) => {
    if (hasModelEnding(ending)) {
      newName += ` ${SYSTEM_MODEL_ENDINGS[ending]}`;
    }
  });

  return newName;
};

module.exports = {
  formatSystemName,
  getSystemNameWithModelType,
};
