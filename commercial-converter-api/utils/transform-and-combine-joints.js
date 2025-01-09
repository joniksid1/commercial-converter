const { REFNET_MODEL_TRANSFORMATIONS } = require('./models');

// Вспомогательная функция для преобразования моделей рефнетов и объединения посистемно
function transformModel(modelName, quantity) {
  if (modelName === 'HFQ-M562F') {
    // Для HFQ-M562F создаем две модели
    const adjustedQuantity = quantity === 1 ? 1 : Math.floor(quantity / 2);
    return ['Y-3SL', 'Y-2SL'].map((model) => ({
      model,
      quantity: adjustedQuantity,
    }));
  }
  return [{ model: REFNET_MODEL_TRANSFORMATIONS[modelName] || modelName, quantity }];
}

function transformAndCombineJoints(systemData) {
  return systemData.map((system) => {
    const combinedModels = {};

    system.models.forEach((model) => {
      const transformedModels = transformModel(model.model, parseInt(model.quantity, 10));

      transformedModels.forEach((transformedModel) => {
        const { model: transformedModelName, quantity } = transformedModel;

        if (combinedModels[transformedModelName]) {
          combinedModels[transformedModelName] += quantity;
        } else {
          combinedModels[transformedModelName] = quantity;
        }
      });
    });

    return {
      systemName: system.systemName,
      models: Object.keys(combinedModels).map((modelName) => ({
        model: modelName,
        quantity: combinedModels[modelName].toString(),
      })),
    };
  });
}

module.exports = {
  transformAndCombineJoints,
};
