function formatSystemName(originalName) {
  // Удаляем префикс "Система ", если он есть
  let formattedName = originalName.replace(/^Система\s+/, '');

  // Преобразуем формат чисел в скобках
  formattedName = formattedName.replace(/\(([\d.]+)\s*т\.м3\/час;\s*([\d.]+)\s*Па\)/, (match, volume, pressure) => {
    // Преобразуем объем из тысяч метров кубических в метры кубические
    const volumeInM3 = Math.round(parseFloat(volume.replace(',', '.')) * 1000);
    // Округляем давление, если есть дробная часть
    const roundedPressure = Math.round(parseFloat(pressure.replace(',', '.')));
    return `(L=${volumeInM3} м3/час; Рс=${roundedPressure} Па)`;
  });

  return formattedName;
}

module.exports = {
  formatSystemName,
};
