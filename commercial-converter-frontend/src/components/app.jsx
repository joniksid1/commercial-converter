import { useState, useEffect } from 'react';
import axios from 'axios';

function FileUploadForm() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const handleDocumentDragOver = (event) => {
      event.preventDefault();
      setDragOver(true);
    };

    const handleDocumentDragLeave = (event) => {
      event.preventDefault();
      // Проверяем, что курсор покинул окно
      if (event.clientX === 0 && event.clientY === 0) {
        setDragOver(false);
      }
    };

    const handleDocumentDrop = (event) => {
      event.preventDefault();
      setDragOver(false);
      const droppedFile = event.dataTransfer.files[0];
      if (droppedFile && (droppedFile.name.endsWith('.pdf') || droppedFile.name.endsWith('.xlsx'))) {
        setError(null);
        setFile(droppedFile);
        setFileName(droppedFile.name);
      } else {
        setError('Пожалуйста, перетащите файл в формате PDF или XLSX');
        setFile(null);
        setFileName('');
      }
    };

    document.addEventListener('dragover', handleDocumentDragOver);
    document.addEventListener('dragleave', handleDocumentDragLeave);
    document.addEventListener('drop', handleDocumentDrop);

    return () => {
      document.removeEventListener('dragover', handleDocumentDragOver);
      document.removeEventListener('dragleave', handleDocumentDragLeave);
      document.removeEventListener('drop', handleDocumentDrop);
    };
  }, []);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && (selectedFile.name.endsWith('.pdf') || selectedFile.name.endsWith('.xlsx'))) {
      setError(null);
      setFile(selectedFile);
      setFileName(selectedFile.name);
    } else {
      setError('Пожалуйста, выберите файл в формате PDF или XLSX');
      setFile(null);
      setFileName('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // const response = await axios.post('http://localhost:8000/api/convert', formData, {
      //   responseType: 'blob',
      // });

      const response = await axios.post('http://192.168.97.110:8080/api/convert', formData, {
        responseType: 'blob',
      });

      // Используем исходное имя загружаемого файла
      const downloadFileName = 'Коммерческое предложение ' + fileName.replace(/\.[^/.]+$/, '') + '.xlsx';

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', downloadFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      if (error.response) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const contentType = error.response.headers['content-type'];
          if (contentType && contentType.includes('text/html')) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(reader.result, 'text/html');
            const message = doc.querySelector('h1') ? doc.querySelector('h1').textContent : 'Неизвестная ошибка';
            setError(`Ошибка сервера: ${message}`);
          } else {
            try {
              const errorMessage = JSON.parse(reader.result).message;
              setError(errorMessage || 'Произошла ошибка при загрузке файла. Пожалуйста, попробуйте еще раз или обратитесь к администратору.');
            } catch {
              setError('Ошибка сервера, попробуйте ещё раз.');
            }
          }
        };
        reader.onerror = () => {
          setError('Ошибка чтения ответа сервера.');
        };
        reader.readAsText(error.response.data);
      } else {
        console.log('Произошла ошибка:', error.message);
        setError('Произошла ошибка при запросе на сервер. Пожалуйста, попробуйте ещё раз или обратитесь к администратору.');
      }
    }
  };

  return (
    <main className={`main ${dragOver ? 'drag-over' : ''}`}>
      <div className={`drag-over-overlay ${dragOver ? 'visible' : ''}`}></div>
      <h2 className='main__header'>Загрузите / перетащите PDF (AirOne) или XLSX (VRF) файл</h2>
      {error && <div className='error'>{error}</div>}
      <form className='form' method="post" encType="multipart/form-data" onSubmit={handleSubmit}>
        <label className='form__input-file'>
          <input type="file" name="file" accept=".pdf, .xlsx" onChange={handleFileChange} />
          <span className='form__input-file-btn'>Загрузить PDF / XLSX файл</span>
          <span className='form__input-file-text'>{fileName ? fileName : 'Максимум 30 МБ'}</span>
        </label>
        <button className='form__button' type="submit" disabled={!file || isLoading}>
          {isLoading ? 'Загрузка...' : 'Сформировать ТКП в XLSX'}
        </button>
      </form>
    </main>
  );
}

export default FileUploadForm;
``
