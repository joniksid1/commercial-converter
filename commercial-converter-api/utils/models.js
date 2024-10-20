// Модели рефнетов и их преобразования
const REFNET_MODEL_TRANSFORMATIONS = {
  'HFQ-102F': 'Y-1SL',
  'HFQ-162F': 'Y-2SL',
  'HFQ-242F': 'Y-2SL',
  'HFQ-302F': 'Y-3SL',
  'HFQ-462F': 'Y-3SL',
  'HFQ-682F': 'Y-4S',
  'HFQ-M32F': 'ML-01S',
  'HFQ-M462F': 'ML-01S',
  'HFQ-M682F': 'ML-01S',
  'HFQ-M142F': 'Y-1SL',
  'HFQ-M282F': 'Y-1SL',
  'HFQ-M452F': 'Y-2SL',
  'HFQ-M562F': 'Y-2SL',
  'HFQ-M692F': 'Y-3SL',
  'HFQ-M902F': 'Y-3SL',
  'HFQ-462XF': 'Y-4S',
  'HFQ-682XF': 'Y-4S',
  'HFQ-M202F': 'ML-01S',
  'HFQ-M212F': 'ML-01S',
  'HFQ-M302F': 'ML-01S',
};

// Определение моделей, которые требуют удвоения количества
const MODELS_WITH_QUANTITY_MULTIPLICATION = [
  'HFQ-M142F', 'HFQ-M282F', 'HFQ-M452F', 'HFQ-M562F',
  'HFQ-M692F', 'HFQ-M902F', 'HFQ-462XF', 'HFQ-682XF',
  'HFQ-M202F', 'HFQ-M212F', 'HFQ-M302F',
];

// Закончания моделей и их типы систем
const SYSTEM_MODEL_ENDINGS = {
  SXA: 'FULL DC Inverter VRF-система Hisense HI-FLEXI серия SXA',
  HJFH: 'DC Invertеr VRF-система Hisense HI-SMART серия H',
  HKFH1: 'DC Invertеr VRF-система Hisense HI-SMART серия H',
  FKFSA: 'DC Invertеr VRF-система Hisense HI-FLEXI серия S HEAT RECOVERY (с рекуперацией тепла)',
  FKFW1: 'DC Invertеr VRF-система Hisense HI-FLEXI серия W HEAT RECOVERY',
  XTFW: 'VRF-система RoyalClima серии RCWT',
  STFG: 'VRF-система RoyalClima серии RCWT',
  HFFW: 'VRF-система RoyalClima серии RCW (mini)',
  HFFW1: 'VRF-система RoyalClima серии RCW (mini)',
};

// Определение ненужных моделей
const FORBIDDEN_PREFIXES = [
  'HP-D', 'HP-C', 'HP-G', 'HPE-D', 'AHU', 'RCYR-Z01H', 'RCYR-T03H', 'RCPE-D', 'RCPE-G', 'RCP-DC', 'RCP-CC',
];

module.exports = {
  REFNET_MODEL_TRANSFORMATIONS,
  SYSTEM_MODEL_ENDINGS,
  FORBIDDEN_PREFIXES,
  MODELS_WITH_QUANTITY_MULTIPLICATION,
};
