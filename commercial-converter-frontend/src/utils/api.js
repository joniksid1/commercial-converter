export const BASE_URL = 'http://localhost:3000';

export const fetchDataSheetOrCommercial = (historyItem, endpoint, acceptType) => {
  return fetch(`${BASE_URL}/${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Accept': acceptType, // Ожидаемый тип контента
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ historyItem })
  })
    .then(async (response) => {
      if (response.ok) {
        return response;
      } else {
        // Если ответ сервера не 200 OK, пытаемся получить текст ошибки
        const errorMessage = await response.text();
        throw new Error(errorMessage || 'Произошла ошибка на сервере');
      }
    })
    .catch((error) => {
      console.error('Ошибка при выполнении запроса:', error.message);
      throw error;
    });
};

export const getCommercial = (historyItem) => {
  return fetchDataSheetOrCommercial(historyItem, 'offer', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
};

export const getDataSheet = (historyItem) => {
  return fetchDataSheetOrCommercial(historyItem, 'data-sheet', 'application/pdf');
};

export const getFanModels = () => {
  return fetch(`${BASE_URL}/models`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Не удалось получить модели вентиляторов');
      }
      return response.json();
    })
    .then((data) => data.modelsArray)
    .catch((error) => {
      console.error('Ошибка при запросе данных моделей вентиляторов на сервер:', error.message);
      throw error;
    });
};

export const getFanDataPoints = () => {
  return fetch(`${BASE_URL}/data-points`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Не удалось получить данные точек графиков вентиляторов');
      }
      return response.json();
    })
    .then((data) => data.fanData)
    .catch((error) => {
      console.error('Ошибка при запросе данных точек графиков вентиляторов на сервер:', error.message);
      throw error;
    });
};
