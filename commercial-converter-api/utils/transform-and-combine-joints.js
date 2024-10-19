const { REFNET_MODEL_TRANSFORMATIONS } = require('./models');

// Вспомогательная функция для преобразования моделей рефнетов и объединения посистемно
function transformAndCombineJoints(systemData) {
  function transformModel(modelName) {
    return REFNET_MODEL_TRANSFORMATIONS[modelName] || modelName;
  }

  return systemData.map((system) => {
    const combinedModels = {};

    system.models.forEach((model) => {
      const transformedModel = transformModel(model.model);
      const quantity = parseInt(model.quantity, 10);

      if (combinedModels[transformedModel]) {
        combinedModels[transformedModel] += quantity;
      } else {
        combinedModels[transformedModel] = quantity;
      }
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
