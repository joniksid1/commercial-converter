// Вспомогательная функция для преобразования моделей рефнетов и объединения посистемно
function transformAndCombineJoints(systemData) {
  // Функция для преобразования моделей по заданным правилам
  function transformModel(modelName) {
    if (modelName === 'HFQ-102F') {
      return 'Y-1S';
    } if (['HFQ-162F', 'HFQ-242F'].includes(modelName)) {
      return 'Y-2S';
    } if (['HFQ-302F', 'HFQ-462F'].includes(modelName)) {
      return 'Y-3S';
    } if (modelName === 'HFQ-682F') {
      return 'Y-4';
    } if (['HFQ-M32F', 'HFQ-M462F', 'HFQ-M682F'].includes(modelName)) {
      return 'ML-01S';
    }
    return modelName; // Оставляем без изменений, если модель не попадает под правила
  }

  // Пройдем по каждой системе
  return systemData.map((system) => {
    // Объект для хранения преобразованных моделей в каждой системе
    const combinedModels = {};

    // Проходим по всем моделям в системе
    system.models.forEach((model) => {
      const transformedModel = transformModel(model.model); // Преобразуем модель
      const quantity = parseInt(model.quantity, 10); // Преобразуем количество в число

      // Если преобразованная модель уже есть, увеличиваем количество
      if (combinedModels[transformedModel]) {
        combinedModels[transformedModel] += quantity;
      } else {
        // Иначе создаем новую запись с количеством
        combinedModels[transformedModel] = quantity;
      }
    });

    // Возвращаем преобразованные данные для системы
    return {
      systemName: system.systemName,
      models: Object.keys(combinedModels).map((modelName) => ({
        model: modelName,
        quantity: combinedModels[modelName].toString(), // Преобразуем количество обратно в строку
      })),
    };
  });
}

module.exports = {
  transformAndCombineJoints,
};
