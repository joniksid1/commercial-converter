function formatSystemName(originalName) {
  // Удаляем префикс "Система ", если он есть
  let formattedName = originalName.replace(/^Система\s+/, '');

  // Преобразуем формат чисел в скобках
  formattedName = formattedName.replace(/\(([\d.]+)\s*т\.м3\/час;\s*([\d.]+)\s*Па\)/, (match, volume, pressure) => {
    // Преобразуем объем из тысяч метров кубических в метры кубические
    const volumeInM3 = Math.round(parseFloat(volume.replace(',', '.')) * 1000);
    // Округляем давление, если есть дробная часть
    const roundedPressure = Math.round(parseFloat(pressure.replace(',', '.')));
    return `(L=${volumeInM3} м3/ч; Рс=${roundedPressure} Па)`;
  });

  return formattedName;
}

// Вспомогательная функция для формирования названия системы
const getSystemNameWithModelType = (systemName, models) => {
  let newName = systemName;

  const hasModelEnding = (ending) => models.some(({ model }) => model.endsWith(ending));

  if (hasModelEnding('SXA')) {
    newName += ' FULL DC Inverter VRF-система Hisense HI-FLEXI серия SXA';
  } else if (hasModelEnding('HJFH') || hasModelEnding('HKFH1')) {
    newName += ' DC Invertеr VRF-система Hisense HI-SMART серия H';
  } else if (hasModelEnding('FKFSA')) {
    newName += ' DC Invertеr VRF-система Hisense HI-FLEXI серия S HEAT RECOVERY (с рекуперацией тепла)';
  } else if (hasModelEnding('FKFW1')) {
    newName += ' DC Invertеr VRF-система Hisense HI-FLEXI серия W HEAT RECOVERY';
  } else if (hasModelEnding('XTFW')) {
    newName += ' VRF-система RoyalClima серии RCWT';
  } else if (hasModelEnding('STFG')) {
    newName += ' VRF-система RoyalClima серии RCWT';
  } else if (hasModelEnding('HFFW') || hasModelEnding('HFFW1')) {
    newName += ' VRF-система RoyalClima серии RCW (mini)';
  }

  return newName;
};

module.exports = {
  formatSystemName,
  getSystemNameWithModelType,
};
